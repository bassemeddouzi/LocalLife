import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Monthly Guide refresh nudges + freshness score recompute (callable from Admin). */
@Injectable()
export class FreshnessJobsService {
  private readonly logger = new Logger(FreshnessJobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runMonthlyGuideRefreshNudge() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const guides = await this.prisma.guideProfile.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { lastContentReviewAt: null },
          { lastContentReviewAt: { lt: cutoff } },
        ],
      },
      select: { userId: true },
    });
    let cues = 0;
    for (const g of guides) {
      await this.prisma.notification.create({
        data: {
          userId: g.userId,
          type: 'FRESHNESS',
          title: 'Time to refresh your zone knowledge',
          body: 'Please review and update your places, tips, and safety notes this month.',
        },
      });
      await this.prisma.avatarCue.create({
        data: {
          userId: g.userId,
          animationHint: 'wave',
          title: 'Refresh your zone',
          body: 'Monthly reminder: update local knowledge for better AI plans.',
          deepLink: 'guide/activity',
        },
      });
      cues += 1;
    }
    this.logger.log(`Freshness nudges sent to ${cues} guides`);
    return { guidesNotified: cues };
  }

  async recomputePlaceFreshnessScores() {
    const places = await this.prisma.place.findMany({
      where: { deletedAt: null },
      select: { id: true, lastReviewedAt: true },
    });
    const now = Date.now();
    let updated = 0;
    for (const p of places) {
      let score = 40;
      if (p.lastReviewedAt) {
        const days =
          (now - p.lastReviewedAt.getTime()) / (24 * 60 * 60 * 1000);
        if (days <= 7) score = 100;
        else if (days <= 30) score = 80;
        else if (days <= 90) score = 55;
        else score = 25;
      }
      await this.prisma.place.update({
        where: { id: p.id },
        data: { freshnessScore: score },
      });
      updated += 1;
    }
    return { placesUpdated: updated };
  }
}
