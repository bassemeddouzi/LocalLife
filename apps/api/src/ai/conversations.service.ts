import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.decorators';
import { OrchestratorService } from './orchestrator.service';
import { CompressionService } from './compression.service';
import { IssueDetectorService } from './issue-detector.service';
import { SessionContextService } from './session-context.service';
import { AiFeatureFlagsService, AI_FEATURE_KEYS } from './ai-feature-flags.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorService,
    private readonly compression: CompressionService,
    private readonly issueDetector: IssueDetectorService,
    private readonly sessionContext: SessionContextService,
    private readonly featureFlags: AiFeatureFlagsService,
  ) {}

  create(user: AuthUser, dto: { title?: string; cityId?: string }) {
    return this.prisma.conversation.create({
      data: {
        userId: user.id,
        title: dto.title ?? 'New chat',
        cityId: dto.cityId,
      },
    });
  }

  list(user: AuthUser) {
    return this.prisma.conversation.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        cityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async get(user: AuthUser, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { citations: true },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== user.id) {
      throw new ForbiddenException('Not your conversation');
    }
    return conversation;
  }

  async softDelete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }

  async postMessage(
    user: AuthUser,
    conversationId: string,
    dto: {
      content: string;
      cityId?: string;
      lat?: number;
      lng?: number;
      gpsAccurate?: boolean;
      locale?: string;
      smartBrief?: Record<string, unknown>;
    },
  ) {
    const conversation = await this.get(user, conversationId);
    const cityId = dto.cityId ?? conversation.cityId;
    if (!cityId) {
      throw new NotFoundException('cityId required on conversation or message');
    }

    if (conversation.cityId !== cityId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { cityId },
      });
    }

    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    if (dto.smartBrief && typeof dto.smartBrief === 'object') {
      const sessionOn = await this.featureFlags.isEnabled(
        AI_FEATURE_KEYS.sessionContext,
        user.id,
      );
      if (sessionOn) {
        await this.sessionContext.upsertSessionContext(user.id, {
          conversationId,
          cityId,
          contextJson: dto.smartBrief,
        });
      }
    }

    const answer = await this.orchestrator.answer({
      cityId,
      content: dto.content,
      locale: dto.locale ?? user.locale,
      lat: dto.lat,
      lng: dto.lng,
      gpsAccurate: dto.gpsAccurate,
      userId: user.id,
    });

    const placeCitations = answer.citations
      .filter((c) => c.entityType === 'place')
      .filter(
        (c, idx, arr) =>
          arr.findIndex((x) => x.entityId === c.entityId) === idx,
      )
      .slice(0, 3);

    const assistant = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content: answer.content,
        toolPayload: {
          grounding: answer.grounding,
          reasons: answer.reasons,
          cards: answer.cards,
          meta: answer.meta,
          citationTitles: Object.fromEntries(
            placeCitations.map((c) => [c.entityId, c.title]),
          ),
        },
        citations: {
          create: placeCitations.map((c, idx) => ({
            entityType: c.entityType,
            entityId: c.entityId,
            rank: idx,
          })),
        },
      },
      include: { citations: true },
    });

    const messageWithTitles = {
      ...assistant,
      citations: assistant.citations.map((c) => ({
        ...c,
        title:
          placeCitations.find((p) => p.entityId === c.entityId)?.title ??
          c.entityType,
      })),
    };

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        title:
          conversation.title === 'New chat'
            ? dto.content.slice(0, 60)
            : conversation.title,
      },
    });

    await this.prisma.aiActionLog.create({
      data: {
        userId: user.id,
        actionType: 'chat.message',
        status: 'ok',
        payload: {
          conversationId,
          messageId: assistant.id,
          grounding: answer.grounding,
          modelId: answer.meta.modelId,
          latencyMs: answer.meta.latencyMs,
          toolCount: answer.meta.toolCount,
          mode: answer.meta.mode,
        },
      },
    });

    const memoryOn = await this.featureFlags.isEnabled(
      AI_FEATURE_KEYS.profileMemory,
      user.id,
    );
    if (
      memoryOn &&
      (dto.smartBrief ||
        this.isCompressionKeyEvent(dto.content))
    ) {
      await this.compression.compressConversationDelta(user.id, conversationId);
    }

    const issueOn = await this.featureFlags.isEnabled(
      AI_FEATURE_KEYS.issueDetector,
      user.id,
    );
    const detected = issueOn ? this.issueDetector.detect(dto.content) : null;
    if (detected) {
      const signal = await this.issueDetector.createSignal({
        userId: user.id,
        conversationId,
        messageId: userMessage.id,
        cityId,
        reason: dto.content.slice(0, 600),
        signalType: detected.signalType,
        severity: detected.severity,
        evidenceJson: { locale: dto.locale ?? user.locale },
      });
      await this.issueDetector.notifyGuide(signal.id);
      await this.prisma.message.update({
        where: { id: userMessage.id },
        data: { issueSignalScannedAt: new Date() },
      });
    }

    return {
      message: messageWithTitles,
      grounding: answer.grounding,
      reasons: answer.reasons,
      cards: answer.cards,
      meta: answer.meta,
    };
  }

  private isCompressionKeyEvent(content: string) {
    return /(plan|trip|family|friends|budget|prefer|solo|couple|transport|mood|conservative|adventure)/i.test(
      content,
    );
  }
}
