import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../shared/memory-cache.service';

export const AI_FEATURE_KEYS = {
  profileMemory: 'ai.profileMemory',
  sessionContext: 'ai.sessionContext',
  digestRead: 'ai.digestRead',
  issueDetector: 'ai.issueDetector',
  tokenGovernor: 'ai.tokenGovernor',
} as const;

@Injectable()
export class AiFeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  async isEnabled(key: string, userId?: string): Promise<boolean> {
    const cacheKey = `ff:${key}:${userId ?? 'global'}`;
    const cached = this.cache.get<boolean>(cacheKey);
    if (cached != null) return cached;

    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!row) {
      this.cache.set(cacheKey, false, 30_000);
      return false;
    }
    if (row.enabledGlobal) {
      this.cache.set(cacheKey, true, 30_000);
      return true;
    }
    const rules = (row.rulesJson ?? {}) as {
      userIds?: string[];
      roles?: string[];
    };
    const allowed =
      Boolean(userId && rules.userIds?.includes(userId)) ||
      Boolean(userId && rules.roles?.length);
    this.cache.set(cacheKey, allowed, 30_000);
    return allowed;
  }
}
