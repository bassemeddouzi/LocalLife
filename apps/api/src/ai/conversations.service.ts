import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.decorators';
import { OrchestratorService } from './orchestrator.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorService,
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
      locale?: string;
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

    await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    const answer = await this.orchestrator.answer({
      cityId,
      content: dto.content,
      locale: dto.locale ?? user.locale,
      lat: dto.lat,
      lng: dto.lng,
    });

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
        },
        citations: {
          create: answer.citations.map((c, idx) => ({
            entityType: c.entityType,
            entityId: c.entityId,
            rank: idx,
          })),
        },
      },
      include: { citations: true },
    });

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

    return {
      message: assistant,
      grounding: answer.grounding,
      reasons: answer.reasons,
      cards: answer.cards,
      meta: answer.meta,
    };
  }
}
