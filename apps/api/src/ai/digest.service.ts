import { Injectable } from '@nestjs/common';
import { AiDigestTargetType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DigestService {
  constructor(private readonly prisma: PrismaService) {}

  async getDigest(targetType: AiDigestTargetType, targetId: string) {
    return this.prisma.aiDigest.findUnique({
      where: { targetType_targetId: { targetType, targetId } },
    });
  }

  async ensurePlaceDigest(placeId: string) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, deletedAt: null },
      select: {
        id: true,
        cityId: true,
        name: true,
        summary: true,
        priceLevel: true,
        guideComment: true,
        precautionsText: true,
        typicalDurationMin: true,
        budgetBand: true,
        primaryCategory: { select: { key: true, name: true } },
      },
    });
    if (!place) return null;
    const digestJson = {
      name: place.name,
      summary: place.summary,
      priceLevel: place.priceLevel,
      budgetBand: place.budgetBand,
      durationMin: place.typicalDurationMin,
      category: place.primaryCategory?.name ?? null,
      guideTip: place.guideComment,
      precautions: place.precautionsText,
    };
    const sourceHash = this.hash(JSON.stringify(digestJson));
    const summaryText = `${place.name}: ${place.summary}`.slice(0, 280);
    return this.upsertDigest({
      targetType: AiDigestTargetType.PLACE,
      targetId: place.id,
      cityId: place.cityId,
      sourceHash,
      digestJson,
      summaryText,
    });
  }

  async upsertDigest(input: {
    targetType: AiDigestTargetType;
    targetId: string;
    cityId?: string | null;
    sourceHash: string;
    digestJson: Record<string, unknown>;
    summaryText?: string;
    digestVersion?: number;
  }) {
    const existing = await this.getDigest(input.targetType, input.targetId);
    if (existing?.sourceHash === input.sourceHash) return existing;
    return this.prisma.aiDigest.upsert({
      where: {
        targetType_targetId: {
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
      create: {
        ...input,
        digestJson: input.digestJson as Prisma.InputJsonValue,
        digestVersion: input.digestVersion ?? 1,
      },
      update: {
        cityId: input.cityId ?? null,
        sourceHash: input.sourceHash,
        digestJson: input.digestJson as Prisma.InputJsonValue,
        summaryText: input.summaryText,
        generatedAt: new Date(),
        digestVersion: (existing?.digestVersion ?? 0) + 1,
      },
    });
  }

  private hash(value: string) {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) {
      h = (h << 5) - h + value.charCodeAt(i);
      h |= 0;
    }
    return `h${Math.abs(h)}`;
  }
}
