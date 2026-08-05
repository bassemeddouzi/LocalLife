import { Injectable } from '@nestjs/common';
import {
  AiIssueSignalStatus,
  AiIssueSignalType,
  Prisma,
  RuleSeverity,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IssueDetectorService {
  constructor(private readonly prisma: PrismaService) {}

  detect(content: string) {
    const text = content.toLowerCase();
    if (/(closed|fermé|msakker|سكر|سكروا|maftou7ch)/i.test(text)) {
      return {
        signalType: AiIssueSignalType.PLACE_CLOSED_REPORT,
        severity: RuleSeverity.IMPORTANT,
      };
    }
    if (/(danger|unsafe|harassment|سرقة|dangerous|mouch aman)/i.test(text)) {
      return {
        signalType: AiIssueSignalType.SAFETY_CONCERN_REPORT,
        severity: RuleSeverity.CRITICAL,
      };
    }
    if (/(wrong|fake|inaccurate|ghalet|moch s7i7)/i.test(text)) {
      return {
        signalType: AiIssueSignalType.INACCURATE_INFO_REPORT,
        severity: RuleSeverity.IMPORTANT,
      };
    }
    return null;
  }

  async createSignal(input: {
    userId: string;
    conversationId: string;
    messageId: string;
    cityId?: string;
    reason: string;
    signalType: AiIssueSignalType;
    severity: RuleSeverity;
    evidenceJson?: Record<string, unknown>;
  }) {
    return this.prisma.aiIssueSignal.create({
      data: {
        ...input,
        evidenceJson:
          input.evidenceJson === undefined
            ? undefined
            : (input.evidenceJson as Prisma.InputJsonValue),
        status: AiIssueSignalStatus.OPEN,
      },
    });
  }

  async notifyGuide(signalId: string) {
    const signal = await this.prisma.aiIssueSignal.findUnique({ where: { id: signalId } });
    if (!signal) return null;
    const guide = await this.prisma.guideProfile.findFirst({
      where: signal.cityId ? { baseCityId: signal.cityId, status: 'APPROVED' } : { status: 'APPROVED' },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!guide?.userId) return null;
    const notification = await this.prisma.notification.create({
      data: {
        userId: guide.userId,
        type: 'ai.issue_signal',
        title: 'AI detected local issue',
        body: signal.reason.slice(0, 220),
        data: { signalId: signal.id, signalType: signal.signalType, cityId: signal.cityId },
      },
    });
    await this.prisma.avatarCue.create({
      data: {
        userId: guide.userId,
        title: 'Please verify local issue',
        body: signal.reason.slice(0, 220),
        animationHint: 'alert',
        notificationId: notification.id,
      },
    });
    await this.prisma.aiIssueSignal.update({
      where: { id: signal.id },
      data: {
        status: AiIssueSignalStatus.NOTIFIED,
        assignedGuideUserId: guide.userId,
        notifiedAt: new Date(),
      },
    });
    return notification;
  }
}
