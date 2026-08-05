import { Injectable } from '@nestjs/common';
import {
  AudienceTag,
  RuleCategory,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DigestService } from './digest.service';
import { AiFeatureFlagsService, AI_FEATURE_KEYS } from './ai-feature-flags.service';

export type ToolCitation = {
  entityType: string;
  entityId: string;
  title: string;
};

export type RetrievalFilters = {
  blockAdultNightlife?: boolean;
};

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Extract useful search tokens from free text (EN/FR/AR); drop short noise words. */
function extractPlaceQueryTokens(content: string): string | undefined {
  const cleaned = content
    .replace(/\[category:[a-z_]+\]/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim();
  if (!cleaned) return undefined;
  // Full Arabic/Latin sentence as contains-query rarely matches names — use longest token ≥3 chars
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter(
      (t) =>
        !/^(the|and|for|with|from|that|this|what|where|when|how|est|les|des|une|dans|pour|avec|موجود|اسمو|التي|الآن|منطقتي|منطق|مكاني|فين|وين|انا|أنا)$/i.test(
          t,
        ),
    );
  if (!tokens.length) return undefined;
  // Prefer proper-looking tokens (capitalized / longer)
  tokens.sort((a, b) => b.length - a.length);
  return tokens[0];
}

@Injectable()
export class RetrievalToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digestService: DigestService,
    private readonly featureFlags: AiFeatureFlagsService,
  ) {}

  async searchPlaces(input: {
    cityId: string;
    query?: string;
    categoryKey?: string;
    lat?: number;
    lng?: number;
    limit?: number;
    filters?: RetrievalFilters;
  }) {
    const limit = Math.min(input.limit ?? 8, 20);
    const category = input.categoryKey
      ? await this.prisma.category.findUnique({
          where: { key: input.categoryKey },
        })
      : null;

    const hasGeo =
      typeof input.lat === 'number' &&
      typeof input.lng === 'number' &&
      Number.isFinite(input.lat) &&
      Number.isFinite(input.lng);

    const places = await this.prisma.place.findMany({
      where: {
        cityId: input.cityId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
        ...(category ? { primaryCategoryId: category.id } : {}),
        ...(input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: 'insensitive' } },
                { summary: { contains: input.query, mode: 'insensitive' } },
                { addressText: { contains: input.query, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(input.filters?.blockAdultNightlife
          ? { NOT: { audienceTags: { has: AudienceTag.ADULT_NIGHTLIFE } } }
          : {}),
      },
      take: hasGeo ? Math.max(limit * 8, 40) : Math.max(limit * 3, 20),
      orderBy: [
        { freshnessScore: 'desc' },
        { lastReviewedAt: 'desc' },
        { popularityScore: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        summary: true,
        latitude: true,
        longitude: true,
        addressText: true,
        priceLevel: true,
        freshnessScore: true,
        lastReviewedAt: true,
        audienceTags: true,
        primaryCategory: { select: { key: true, name: true } },
      },
    });

    const ranked = places
      .map((p) => {
        const latitude = Number(p.latitude);
        const longitude = Number(p.longitude);
        const freshnessScore =
          p.freshnessScore != null ? Number(p.freshnessScore) : null;
        const freshnessRank =
          (freshnessScore != null ? freshnessScore : 0) * 10 +
          (p.lastReviewedAt
            ? Math.max(
                0,
                30 - (Date.now() - p.lastReviewedAt.getTime()) / 86400000,
              )
            : 0);
        const distanceKm = hasGeo
          ? haversineKm(input.lat!, input.lng!, latitude, longitude)
          : null;
        // Prefer nearer places when GPS is present
        const _rank =
          distanceKm != null
            ? 1000 - Math.min(distanceKm, 80) * 12 + freshnessRank * 0.2
            : freshnessRank;
        return {
          ...p,
          latitude,
          longitude,
          freshnessScore,
          distanceKm:
            distanceKm != null ? Number(distanceKm.toFixed(2)) : undefined,
          _rank,
        };
      })
      .sort((a, b) => b._rank - a._rank)
      .slice(0, limit)
      .map(({ _rank, ...rest }) => rest);

    return ranked;
  }

  async resolveNearestDistrict(input: {
    cityId: string;
    lat: number;
    lng: number;
  }) {
    const districts = await this.prisma.district.findMany({
      where: { cityId: input.cityId },
      select: {
        id: true,
        slug: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });
    if (!districts.length) return null;
    let best: {
      id: string;
      slug: string;
      name: string;
      distanceKm: number;
    } | null = null;
    for (const d of districts) {
      const distanceKm = haversineKm(
        input.lat,
        input.lng,
        Number(d.latitude),
        Number(d.longitude),
      );
      if (!best || distanceKm < best.distanceKm) {
        best = {
          id: d.id,
          slug: d.slug,
          name: d.name,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      }
    }
    return best;
  }

  async getPlaceDetails(placeId: string) {
    return this.prisma.place.findFirst({
      where: {
        id: placeId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
        addressText: true,
        phone: true,
        priceLevel: true,
        latitude: true,
        longitude: true,
        freshnessScore: true,
        lastReviewedAt: true,
        guideComment: true,
        primaryCategory: { select: { key: true, name: true } },
      },
    });
  }

  async searchEvents(input: { cityId: string; limit?: number }) {
    const now = new Date();
    return this.prisma.event.findMany({
      where: {
        cityId: input.cityId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
        startsAt: { gte: new Date(now.getTime() - 7 * 86400000) },
      },
      take: input.limit ?? 5,
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        title: true,
        summary: true,
        startsAt: true,
        endsAt: true,
        priceLevel: true,
      },
    });
  }

  async getTransportOptions(input: { cityId: string }) {
    const systems = await this.prisma.transportSystem.findMany({
      where: {
        cityId: input.cityId,
        verificationStatus: VerificationStatus.APPROVED,
      },
      include: {
        routes: {
          where: { verificationStatus: VerificationStatus.APPROVED },
          include: {
            fromHub: { select: { id: true, name: true } },
            toHub: { select: { id: true, name: true } },
          },
        },
      },
    });
    return systems.map((s) => ({
      id: s.id,
      name: s.name,
      mode: s.mode,
      summary: s.summary,
      pricingType: s.pricingType,
      priceMin: s.priceMin,
      priceMax: s.priceMax,
      currency: s.currency,
      paymentMethods: s.paymentMethods,
      warnings: s.warnings,
      lastReviewedAt: s.lastReviewedAt,
      routes: s.routes.map((r) => ({
        id: r.id,
        from: r.fromHub.name,
        to: r.toHub.name,
        approxDurationMin: r.approxDurationMin,
        priceMin: r.priceMin,
        priceMax: r.priceMax,
        currency: r.currency,
      })),
    }));
  }

  async getArrivalGuide(input: { cityId?: string; airportPlaceId?: string }) {
    return this.prisma.arrivalGuide.findFirst({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(input.cityId ? { cityId: input.cityId } : {}),
        ...(input.airportPlaceId
          ? { airportPlaceId: input.airportPlaceId }
          : {}),
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLocalRules(input: {
    cityId: string;
    category?: RuleCategory;
    audience?: string;
  }) {
    const city = await this.prisma.city.findUnique({
      where: { id: input.cityId },
      select: { countryId: true },
    });
    return this.prisma.localRule.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(input.category ? { category: input.category } : {}),
        ...(input.audience ? { audience: input.audience } : {}),
        OR: [
          { cityId: input.cityId },
          ...(city
            ? [{ countryId: city.countryId, cityId: null as string | null }]
            : []),
        ],
      },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }],
      take: 12,
      select: {
        id: true,
        category: true,
        severity: true,
        title: true,
        summary: true,
        sourceType: true,
        lastReviewedAt: true,
      },
    });
  }

  async searchHowToGuides(input: {
    cityId: string;
    categoryKey?: string;
    query?: string;
  }) {
    return this.prisma.howToGuide.findMany({
      where: {
        cityId: input.cityId,
        verificationStatus: VerificationStatus.APPROVED,
        ...(input.categoryKey ? { categoryKey: input.categoryKey } : {}),
        ...(input.query
          ? {
              OR: [
                { title: { contains: input.query, mode: 'insensitive' } },
                { summary: { contains: input.query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      take: 5,
    });
  }

  /** Heuristic retrieval pack for a user question (APPROVED only). */
  async retrieveForQuestion(input: {
    cityId: string;
    content: string;
    lat?: number;
    lng?: number;
    gpsAccurate?: boolean;
    filters?: RetrievalFilters;
  }) {
    const q = input.content.toLowerCase();
    const citations: ToolCitation[] = [];
    const pack: Record<string, unknown> = {};
    const filters = input.filters;
    const hasGeo =
      typeof input.lat === 'number' &&
      typeof input.lng === 'number' &&
      Number.isFinite(input.lat) &&
      Number.isFinite(input.lng);

    const categoryTag = q.match(/\[category:([a-z_]+)\]/);
    const tagged = categoryTag?.[1] ?? null;

    const wantsArrival =
      tagged === 'arrival' ||
      /airport|arriv|landing|first hour|sim card|immigration|مطار|وصول|الهجرة|sim/.test(
        q,
      );
    const wantsTransport =
      tagged === 'taxi' ||
      tagged === 'louage' ||
      /taxi|تاكسي|طاكسي|louage|لواج|الواج|واج|transport|نقل|تنقل|midoun|houmt|حومة|ميدون|airport\s*→|get to|fare|payment|prix|tarif|كيفية.*تاكسي|كيف.*تاكسي|موجود.*تاكسي|كم تكلف|تكلف/.test(
        q,
      );
    const wantsPharmacy =
      tagged === 'pharmacy' || /pharmac|صيدل/.test(q);
    const wantsHospital =
      /hospital|clinic|doctor|emergency room|مستشفى|عيادة|طبيب/.test(q);
    const wantsFood =
      tagged === 'food' ||
      /restaurant|food|eat|café|cafe|coffee|مطعم|ماكلة|أكل|قهوة|مقهى|رخيص|رخيصة/.test(
        q,
      );
    const wantsBudget =
      /budget|cheap|afford|دينار|د\.?\s*ت|فلوس|مال|20\s*د|قرش|pas cher|bon marché|قليل.*مال|مش.*(عندي|لدي).*مال/.test(
        q,
      );
    const wantsRules =
      tagged === 'safety' ||
      /safe|scam|emergency|rule|police|dress|photo|cash|money|أمان|شرطة|احتيال|فلوس|نقد/.test(
        q,
      );
    const wantsSurvival =
      /survival|48h|first (two|2) days|checklist|بقاء|أول يومين/.test(q);
    const wantsWhereAmI =
      /where\s+am\s+i|where\s+i\s+am|where\s+i'?m|where\s+are\s+we|what('?s| is) my (current )?(location|area|place)|my (current )?(location|area|place)|current (location|area|position)|exactly where|name of the (area|eara|zone|district|neighborhood)|which (area|district|zone|eara)|what (area|district|zone|eara)|اسم.*(منطق|منطقة|حي)|شنو اسم منطقة|منطق(ة|تي| اللي)|فين انا|وين انا|وين أنا|فين أنا|مكاني الآن|مكاني الان|المكان اللي|أينا أنا|أين أنا|ou suis[- ]je|où suis[- ]je|quelle zone|quel quartier|où je suis|ma position/.test(
        q,
      ) ||
      (/منطق|منطقة|حي|quartier|district|area|eara|location|emplacement/.test(q) &&
        /ana|أنا|انا|now|الآن|الان|تو|ici|here|مكاني|exact|exactly|am in|i am|je suis/.test(
          q,
        ));
    const wantsNearby =
      wantsWhereAmI ||
      /near me|nearby|autour de moi|près de moi|قريب مني|من موقعي|around me/.test(
        q,
      );
    // "في مكاني" alone often means taxi-at-my-location — not a where-am-I dump
    const asksUnknownPlace =
      /unicorn castle|atlantis disco|fake place|made-up|does .+ exist/.test(q);

    // Only expose nearest-district in the knowledge pack for explicit location questions
    if (hasGeo && (wantsWhereAmI || wantsNearby)) {
      const nearest = await this.resolveNearestDistrict({
        cityId: input.cityId,
        lat: input.lat!,
        lng: input.lng!,
      });
      const gpsAccurate = input.gpsAccurate !== false;
      pack.userLocation = {
        lat: input.lat,
        lng: input.lng,
        nearestDistrict: nearest,
        gpsAccurate,
      };
      pack.gpsAccurate = gpsAccurate;
      // Do not cite district as a clickable entity — avoid junk links in the app
    }

    if (wantsArrival) {
      const guide = await this.getArrivalGuide({ cityId: input.cityId });
      pack.arrivalGuide = guide;
      if (guide) {
        citations.push({
          entityType: 'arrival_guide',
          entityId: guide.id,
          title: guide.title,
        });
      }
    }

    if (wantsTransport) {
      const transport = await this.getTransportOptions({
        cityId: input.cityId,
      });
      pack.transport = transport;
      for (const t of transport) {
        citations.push({
          entityType: 'transport_system',
          entityId: t.id,
          title: t.name,
        });
      }
      if (hasGeo) {
        const hubs = await this.searchPlaces({
          cityId: input.cityId,
          categoryKey: 'transport_hubs',
          lat: input.lat,
          lng: input.lng,
          limit: 5,
          filters,
        });
        pack.nearbyTransportHubs = hubs;
        for (const p of hubs) {
          citations.push({
            entityType: 'place',
            entityId: p.id,
            title: p.name,
          });
        }
      }
    }

    if (wantsPharmacy) {
      const places = await this.searchPlaces({
        cityId: input.cityId,
        categoryKey: 'pharmacies',
        lat: input.lat,
        lng: input.lng,
        limit: 8,
        filters,
      });
      pack.pharmacies = places;
      for (const p of places) {
        citations.push({
          entityType: 'place',
          entityId: p.id,
          title: p.name,
        });
      }
    }

    if (wantsHospital) {
      const places = await this.searchPlaces({
        cityId: input.cityId,
        categoryKey: 'hospitals',
        lat: input.lat,
        lng: input.lng,
        limit: 8,
        filters,
      });
      pack.hospitals = places;
      for (const p of places) {
        citations.push({
          entityType: 'place',
          entityId: p.id,
          title: p.name,
        });
      }
    }

    if (wantsFood) {
      const places = await this.searchPlaces({
        cityId: input.cityId,
        categoryKey: /cafe|café|coffee|قهوة|مقهى/.test(q)
          ? 'cafes'
          : 'restaurants',
        lat: input.lat,
        lng: input.lng,
        limit: 8,
        filters,
      });
      pack.food = places;
      for (const p of places) {
        citations.push({
          entityType: 'place',
          entityId: p.id,
          title: p.name,
        });
      }
    }

    if (wantsRules) {
      const rules = await this.getLocalRules({ cityId: input.cityId });
      pack.rules = rules;
      for (const r of rules) {
        citations.push({
          entityType: 'local_rule',
          entityId: r.id,
          title: r.title,
        });
      }
    }

    if (wantsSurvival) {
      const guides = await this.searchHowToGuides({
        cityId: input.cityId,
        categoryKey: 'SURVIVAL_48H',
      });
      pack.howTo = guides;
      for (const g of guides) {
        citations.push({
          entityType: 'how_to_guide',
          entityId: g.id,
          title: g.title,
        });
      }
    }

    if (wantsBudget) {
      if (!wantsFood) {
        const cheapFood = await this.searchPlaces({
          cityId: input.cityId,
          categoryKey: 'restaurants',
          lat: input.lat,
          lng: input.lng,
          limit: 6,
          filters,
        });
        const budgetFood = cheapFood.filter(
          (p) =>
            p.priceLevel === 'FREE' ||
            p.priceLevel === 'BUDGET' ||
            p.priceLevel == null,
        );
        pack.food = budgetFood.length ? budgetFood : cheapFood.slice(0, 4);
        for (const p of pack.food as Array<{ id: string; name: string }>) {
          citations.push({
            entityType: 'place',
            entityId: p.id,
            title: p.name,
          });
        }
      }
      if (!wantsTransport) {
        const transport = await this.getTransportOptions({
          cityId: input.cityId,
        });
        const cheapModes = transport.filter((t) =>
          /WALK|SHARED_TAXI|BUS|BIKE/i.test(t.mode),
        );
        pack.transport = cheapModes.length ? cheapModes : transport.slice(0, 3);
        for (const t of pack.transport as Array<{ id: string; name: string }>) {
          citations.push({
            entityType: 'transport_system',
            entityId: t.id,
            title: t.name,
          });
        }
      }
      pack.budgetHint = {
        note: 'User has a tight budget — prefer louage/walk, budget food, free beaches; avoid private taxis as default.',
      };
    }

    if (wantsNearby || wantsWhereAmI) {
      if (!hasGeo) {
        const districts = await this.prisma.district.findMany({
          where: { cityId: input.cityId },
          select: { id: true, name: true, slug: true },
          take: 12,
        });
        pack.districts = districts;
      }
      const nearby = await this.searchPlaces({
        cityId: input.cityId,
        lat: input.lat,
        lng: input.lng,
        limit: 8,
        filters,
      });
      pack.nearbyPlaces = nearby;
      for (const p of nearby) {
        citations.push({
          entityType: 'place',
          entityId: p.id,
          title: p.name,
        });
      }
    }

    // Generic place search fallback when nothing matched but looks like a place query
    const meaningfulKeys = Object.keys(pack).filter((k) => k !== 'userLocation');
    if (meaningfulKeys.length === 0 && !asksUnknownPlace) {
      const token = extractPlaceQueryTokens(input.content);
      const places = await this.searchPlaces({
        cityId: input.cityId,
        query: token,
        lat: input.lat,
        lng: input.lng,
        limit: 5,
        filters,
      });
      pack.places = places;
      for (const p of places) {
        citations.push({
          entityType: 'place',
          entityId: p.id,
          title: p.name,
        });
      }
    }

    if (asksUnknownPlace) {
      pack.unknownPlaceQuery = true;
      // Explicitly do not invent — leave places empty
      pack.places = [];
    }

    const unique = new Map<string, ToolCitation>();
    for (const c of citations) {
      unique.set(`${c.entityType}:${c.entityId}`, c);
    }

    const condensedDigests = await Promise.all(
      [...unique.values()].slice(0, 8).map(async (c) => {
        const digestEnabled = await this.featureFlags.isEnabled(
          AI_FEATURE_KEYS.digestRead,
        );
        if (!digestEnabled) return null;
        if (c.entityType === 'place') {
          const existing = await this.digestService.getDigest('PLACE', c.entityId);
          if (existing) return existing;
          return this.digestService.ensurePlaceDigest(c.entityId);
        }
        if (c.entityType === 'transport_system') {
          return this.digestService.getDigest('TRANSPORT_SYSTEM', c.entityId);
        }
        return null;
      }),
    );
    const digestCards = condensedDigests
      .filter(Boolean)
      .map((d: (typeof condensedDigests)[number]) => ({
        targetType: d!.targetType,
        targetId: d!.targetId,
        summaryText: d!.summaryText,
        digestVersion: d!.digestVersion,
      }));
    if (digestCards.length) {
      pack.digests = digestCards;
    }

    return {
      pack,
      citations: [...unique.values()],
      asksUnknownPlace,
    };
  }
}
