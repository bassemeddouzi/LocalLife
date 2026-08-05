import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type SessionContextInput = {
  conversationId?: string;
  planId?: string;
  cityId?: string;
  groupType?: string;
  mood?: string;
  budgetNow?: 'LOW' | 'MEDIUM' | 'HIGH';
  conservatismNow?: 'OPEN' | 'MODERATE' | 'CONSERVATIVE' | 'STRICT';
  hasPrivateTransport?: boolean;
  walksOkNow?: boolean;
  maxEndTimeIso?: string;
  contextJson?: Record<string, unknown>;
};

@Injectable()
export class SessionContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectiveContext(userId: string, conversationId?: string) {
    const pref = await this.prisma.userPreference.findUnique({ where: { userId } });
    const active = await this.prisma.clientSessionContext.findFirst({
      where: { userId, isActive: true, ...(conversationId ? { conversationId } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      budgetBand: active?.budgetNow ?? pref?.budgetBand ?? 'MEDIUM',
      conservatismLevel:
        active?.conservatismNow ?? pref?.conservatismLevel ?? 'MODERATE',
      hasPrivateTransport: active?.hasPrivateTransport ?? pref?.hasVehicle ?? false,
      walksOk: active?.walksOkNow ?? pref?.walksOk ?? true,
      groupType: active?.groupType ?? pref?.groupSize ?? 'SOLO',
      mood: active?.mood ?? pref?.vibe ?? 'CALM',
      contextJson: (active?.contextJson as Record<string, unknown> | null) ?? {},
    };
  }

  async upsertSessionContext(userId: string, input: SessionContextInput) {
    const current = await this.prisma.clientSessionContext.findFirst({
      where: {
        userId,
        isActive: true,
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
        ...(input.planId ? { planId: input.planId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (current) {
      return this.prisma.clientSessionContext.update({
        where: { id: current.id },
        data: {
          ...input,
          contextJson:
            input.contextJson === undefined
              ? undefined
              : (input.contextJson as Prisma.InputJsonValue),
          contextVersion: current.contextVersion + 1,
          lastUsedAt: new Date(),
        },
      });
    }
    return this.prisma.clientSessionContext.create({
      data: {
        userId,
        ...input,
        contextJson:
          input.contextJson === undefined
            ? undefined
            : (input.contextJson as Prisma.InputJsonValue),
        lastUsedAt: new Date(),
        isActive: true,
      },
    });
  }
}
