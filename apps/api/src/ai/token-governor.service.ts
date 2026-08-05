import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenGovernorService {
  private readonly maxInputTokens = Number(process.env.AI_MAX_INPUT_TOKENS ?? 6000);
  private readonly maxOutputTokens = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 700);
  private readonly dailyTokenBudget = Number(process.env.AI_DAILY_USER_TOKEN_BUDGET ?? 50000);

  constructor(private readonly prisma: PrismaService) {}

  getBounds() {
    return {
      maxInputTokens: this.maxInputTokens,
      maxOutputTokens: this.maxOutputTokens,
      dailyTokenBudget: this.dailyTokenBudget,
    };
  }

  approximateTokens(text: string) {
    return Math.ceil(text.length / 4);
  }

  trimToBudget(text: string, maxTokens: number) {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}\n...[trimmed for token budget]`;
  }

  async canSpend(userId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agg = await this.prisma.aiTokenUsage.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { totalTokens: true },
    });
    const used = agg._sum.totalTokens ?? 0;
    return {
      allowed: used < this.dailyTokenBudget,
      used,
      remaining: Math.max(0, this.dailyTokenBudget - used),
    };
  }

  async recordUsage(input: {
    userId?: string;
    conversationId?: string;
    messageId?: string;
    provider: string;
    modelId: string;
    intentType?: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs?: number;
    cachedHit?: boolean;
  }) {
    return this.prisma.aiTokenUsage.create({
      data: {
        ...input,
        totalTokens: input.promptTokens + input.completionTokens,
      },
    });
  }
}
