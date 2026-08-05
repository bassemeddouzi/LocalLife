import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileMemoryService } from './profile-memory.service';

@Injectable()
export class CompressionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileMemory: ProfileMemoryService,
  ) {}

  async compressConversationDelta(userId: string, conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        role: 'USER',
        OR: [{ compressedAt: null }, { issueSignalScannedAt: null }],
      },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });
    if (!messages.length) return { updated: false };
    const joined = messages.map((m) => m.content).join('\n').toLowerCase();
    const patch: Record<string, unknown> = {};
    if (/(family|kids|children|famille|3ayla|عائلة)/i.test(joined)) patch.groupSize = 'FAMILY_KIDS';
    if (/(friends|s7ab|صحاب)/i.test(joined)) patch.groupSize = 'FRIENDS';
    if (/(budget|cheap|econom|9lil|pas cher)/i.test(joined)) patch.budgetBand = 'LOW';
    if (/(luxury|classy|high budget|ghali)/i.test(joined)) patch.budgetBand = 'HIGH';
    if (/(calm|quiet|conservative|respect)/i.test(joined)) patch.vibe = 'CALM';
    if (Object.keys(patch).length) {
      await this.profileMemory.mergeProfileCard(userId, patch);
    }
    await this.prisma.message.updateMany({
      where: { id: { in: messages.map((m) => m.id) } },
      data: { compressedAt: new Date(), compressionVersion: 1 },
    });
    return { updated: Object.keys(patch).length > 0, patch };
  }
}
