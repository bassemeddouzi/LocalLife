import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ProfilePatch = {
  personaType?: string | null;
  budgetBand?: string | null;
  groupSize?: string | null;
  vibe?: string | null;
  conservatismLevel?: string | null;
  hasVehicle?: boolean | null;
  walksOk?: boolean | null;
  homeCityId?: string | null;
  dislikes?: string[];
  likes?: string[];
  lastRatedTarget?: string;
  lastRating?: number;
  [key: string]: unknown;
};

@Injectable()
export class ProfileMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileCard(userId: string) {
    const pref = await this.prisma.userPreference.findUnique({ where: { userId } });
    const current = (pref?.aiProfileJson as Record<string, unknown> | null) ?? {};
    return {
      hash: pref?.aiProfileHash ?? null,
      version: pref?.aiProfileVersion ?? 1,
      updatedAt: pref?.aiProfileUpdatedAt ?? null,
      card: {
        ...current,
        budgetBand: pref?.budgetBand ?? current.budgetBand ?? 'MEDIUM',
        conservatismLevel:
          pref?.conservatismLevel ?? current.conservatismLevel ?? 'MODERATE',
        hasVehicle: pref?.hasVehicle ?? current.hasVehicle ?? false,
        walksOk: pref?.walksOk ?? current.walksOk ?? true,
        groupSize: pref?.groupSize ?? current.groupSize ?? 'SOLO',
      },
    };
  }

  async mergeProfileCard(userId: string, patch: ProfilePatch) {
    const existing = await this.getProfileCard(userId);
    const nextCard = {
      ...(existing.card as Record<string, unknown>),
      ...patch,
      updatedBy: 'ai',
    };
    const serialized = JSON.stringify(nextCard);
    const nextHash = this.hash(serialized);
    await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        aiProfileJson: nextCard,
        aiProfileHash: nextHash,
        aiProfileVersion: 1,
        aiProfileUpdatedAt: new Date(),
      },
      update: {
        aiProfileJson: nextCard,
        aiProfileHash: nextHash,
        aiProfileVersion: (existing.version ?? 1) + 1,
        aiProfileUpdatedAt: new Date(),
      },
    });
    return this.getProfileCard(userId);
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
