import { ClientVibe, PersonaType, TransportMode } from '@prisma/client';
import { PlanScoringService } from './plan-scoring.service';

describe('PlanScoringService', () => {
  const packs = [
    {
      id: '1',
      code: 'arrival_kit',
      title: 'First hour after landing',
      summary: 'Calm arrival',
      personaHints: [PersonaType.TOURIST, PersonaType.VISITING],
      enabled: true,
      cityId: null,
      stepsJson: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      code: 'adventure_day',
      title: 'Adventure explore day',
      summary: 'Fun social',
      personaHints: [PersonaType.ADVENTURE, PersonaType.SOLO],
      enabled: true,
      cityId: null,
      stepsJson: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const prisma = {
    planPack: { findMany: jest.fn().mockResolvedValue(packs) },
  } as never;
  const service = new PlanScoringService(prisma);

  it('prefers walk for short distances', () => {
    const ranked = service.rankTransportModes(
      {
        hasPrivateTransport: false,
        budgetBand: 'MEDIUM',
        conservatismLevel: 'MODERATE',
        groupType: 'SOLO',
        mood: 'CALM',
      },
      0.8,
    );
    expect(ranked[0].mode).toBe(TransportMode.WALK);
  });

  it('boosts taxi for long distances', () => {
    const ranked = service.rankTransportModes(
      {
        hasPrivateTransport: false,
        budgetBand: 'MEDIUM',
        conservatismLevel: 'MODERATE',
        groupType: 'SOLO',
        mood: ClientVibe.CALM,
      },
      12,
    );
    expect(ranked[0].mode).toBe(TransportMode.TAXI);
  });

  it('returns dual-bias candidates with why', async () => {
    const rows = await service.suggestCandidatePacks({
      userId: 'u1',
      prefs: {
        hasPrivateTransport: false,
        budgetBand: 'LOW',
        conservatismLevel: 'MODERATE',
        groupType: 'FRIENDS',
        mood: 'CALM',
      },
    });
    expect(rows.length).toBeLessThanOrEqual(2);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].why).toBeTruthy();
    expect(rows[0].recommended).toBe(true);
    if (rows[1]) {
      expect(rows[1].id).not.toBe(rows[0].id);
      expect(rows[1].why).toBeTruthy();
    }
  });
});
