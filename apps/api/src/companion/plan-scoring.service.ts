import { Injectable } from '@nestjs/common';
import { ClientVibe, PersonaType, TransportMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type EffectivePrefs = {
  hasPrivateTransport: boolean;
  budgetBand: 'LOW' | 'MEDIUM' | 'HIGH';
  conservatismLevel: 'OPEN' | 'MODERATE' | 'CONSERVATIVE' | 'STRICT';
  groupType: string;
  mood: string;
};

type Bias = 'calm_budget' | 'fun_social';

@Injectable()
export class PlanScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestCandidatePacks(input: {
    cityId?: string;
    userId: string;
    prefs: EffectivePrefs;
    situation?: 'arrival' | 'on_island_day' | 'health' | 'transport_only';
  }) {
    const situation = input.situation ?? 'on_island_day';
    const packs = await this.prisma.planPack.findMany({
      where: {
        enabled: true,
        OR: input.cityId
          ? [{ cityId: null }, { cityId: input.cityId }]
          : [{ cityId: null }],
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    });

    const filtered = packs.filter((pack) => {
      const code = `${pack.code} ${pack.title}`.toLowerCase();
      const isArrivalish = /arrival|airport|landing|first hour/.test(code);
      const isHealthish = /hospital|clinic|survival|pharmacy kit/.test(code);
      const isTransportOnly = /transport_only|transport-only/.test(code);
      if (situation === 'arrival') return isArrivalish || !isHealthish;
      if (situation === 'health') return isHealthish || /pharmacy|student/.test(code);
      if (situation === 'transport_only') return isTransportOnly;
      // on_island_day — hide airport / survival / transport-only kits
      if (isArrivalish || isHealthish || isTransportOnly) return false;
      return true;
    });

    const pool = filtered.length ? filtered : packs;

    const calm = this.rankWithBias(pool, input.prefs, 'calm_budget');
    const fun = this.rankWithBias(pool, input.prefs, 'fun_social');

    const picks: Array<{
      id: string;
      code: string;
      title: string;
      summary: string | null;
      score: number;
      why: string;
      recommended: boolean;
      bias: Bias;
    }> = [];

    if (calm) {
      picks.push({
        id: calm.pack.id,
        code: calm.pack.code,
        title: calm.pack.title,
        summary: calm.pack.summary,
        score: calm.score,
        why: calm.why,
        recommended: true,
        bias: 'calm_budget',
      });
    }
    if (fun && fun.pack.id !== calm?.pack.id) {
      picks.push({
        id: fun.pack.id,
        code: fun.pack.code,
        title: fun.pack.title,
        summary: fun.pack.summary,
        score: fun.score,
        why: fun.why,
        recommended: picks.length === 0,
        bias: 'fun_social',
      });
    } else if (pool.length > 1 && calm) {
      const alt = pool.find((p) => p.id !== calm.pack.id);
      if (alt) {
        const scored = this.scorePack(alt, input.prefs, 'fun_social');
        picks.push({
          id: alt.id,
          code: alt.code,
          title: alt.title,
          summary: alt.summary,
          score: scored.score,
          why: scored.why,
          recommended: false,
          bias: 'fun_social',
        });
      }
    }

    return picks.slice(0, 2);
  }

  rankTransportModes(prefs: EffectivePrefs, distanceKm: number) {
    const base: Array<{ mode: TransportMode; score: number }> = [
      { mode: TransportMode.WALK, score: distanceKm < 1 ? 70 : 15 },
      { mode: TransportMode.TAXI, score: distanceKm > 5 ? 80 : 62 },
      { mode: TransportMode.SHARED_TAXI, score: distanceKm > 2 ? 76 : 50 },
      { mode: TransportMode.BUS, score: prefs.budgetBand === 'LOW' ? 75 : 52 },
      {
        mode: TransportMode.CAR_RENTAL,
        score: prefs.hasPrivateTransport ? 74 : 20,
      },
    ];
    if (prefs.mood === ClientVibe.CALM) {
      for (const item of base) {
        if (item.mode === TransportMode.BUS) item.score -= 8;
        if (item.mode === TransportMode.TAXI) item.score += 4;
      }
    }
    return base.sort((a, b) => b.score - a.score);
  }

  private rankWithBias(
    packs: Array<{
      id: string;
      code: string;
      title: string;
      summary: string | null;
      personaHints: PersonaType[];
    }>,
    prefs: EffectivePrefs,
    bias: Bias,
  ) {
    if (!packs.length) return null;
    const ranked = packs
      .map((pack) => this.scorePack(pack, prefs, bias))
      .sort((a, b) => b.score - a.score);
    return ranked[0] ?? null;
  }

  private scorePack(
    pack: {
      id: string;
      code: string;
      title: string;
      summary: string | null;
      personaHints: PersonaType[];
    },
    prefs: EffectivePrefs,
    bias: Bias,
  ) {
    const personaHints = pack.personaHints ?? [];
    let score = 40;
    const whyParts: string[] = [];

    if (
      prefs.groupType.includes('FAMILY') &&
      personaHints.includes(PersonaType.FAMILY)
    ) {
      score += 20;
      whyParts.push('Fits family outing');
    }
    if (
      prefs.groupType.includes('SOLO') &&
      personaHints.includes(PersonaType.SOLO)
    ) {
      score += 15;
      whyParts.push('Good for solo');
    }
    if (
      prefs.groupType.includes('FRIENDS') &&
      (personaHints.includes(PersonaType.ADVENTURE) ||
        pack.code.includes('friends') ||
        /fun|night|adventure/i.test(pack.title))
    ) {
      score += 12;
      whyParts.push('Works with friends');
    }

    if (bias === 'calm_budget') {
      if (prefs.budgetBand === 'LOW') score += 18;
      if (prefs.mood === 'CALM' || prefs.mood.includes('CALM')) score += 16;
      if (personaHints.includes(PersonaType.VISITING)) score += 10;
      if (/arrival|calm|first|easy|kit/i.test(`${pack.code} ${pack.title}`)) {
        score += 14;
        whyParts.push('Calm & practical');
      }
      if (prefs.conservatismLevel !== 'OPEN') score += 8;
      whyParts.push('Budget-friendly bias');
    } else {
      if (prefs.mood === 'ADVENTURE' || prefs.mood.includes('ADVENTURE')) {
        score += 18;
      }
      if (personaHints.includes(PersonaType.ADVENTURE)) score += 14;
      if (/adventure|explore|fun|night|beach/i.test(`${pack.code} ${pack.title}`)) {
        score += 14;
        whyParts.push('More social / exploratory');
      }
      if (prefs.budgetBand === 'HIGH') score += 8;
      whyParts.push('Fun & social bias');
    }

    if (!whyParts.length) whyParts.push('Matches your trip profile');

    return {
      pack,
      score,
      why: whyParts.slice(0, 2).join(' · '),
    };
  }
}
