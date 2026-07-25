import { Injectable } from '@nestjs/common';
import { RuleCategory, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ToolCitation = {
  entityType: string;
  entityId: string;
  title: string;
};

@Injectable()
export class RetrievalToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchPlaces(input: {
    cityId: string;
    query?: string;
    categoryKey?: string;
    lat?: number;
    lng?: number;
    limit?: number;
  }) {
    const limit = Math.min(input.limit ?? 8, 20);
    const category = input.categoryKey
      ? await this.prisma.category.findUnique({
          where: { key: input.categoryKey },
        })
      : null;

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
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [{ popularityScore: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        summary: true,
        latitude: true,
        longitude: true,
        priceLevel: true,
        primaryCategory: { select: { key: true, name: true } },
      },
    });

    return places.map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
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
  }) {
    const q = input.content.toLowerCase();
    const citations: ToolCitation[] = [];
    const pack: Record<string, unknown> = {};

    const wantsArrival =
      /airport|arriv|landing|first hour|sim card|immigration/.test(q);
    const wantsTransport =
      /taxi|louage|transport|midoun|houmt|airport\s*→|get to|fare|payment/.test(
        q,
      );
    const wantsPharmacy = /pharmac/.test(q);
    const wantsHospital = /hospital|clinic|doctor|emergency room/.test(q);
    const wantsFood = /restaurant|food|eat|café|cafe|coffee/.test(q);
    const wantsRules =
      /safe|scam|emergency|rule|police|dress|photo|cash|money/.test(q);
    const wantsSurvival = /survival|48h|first (two|2) days|checklist/.test(q);
    const asksUnknownPlace =
      /unicorn castle|atlantis disco|fake place|made-up|does .+ exist/.test(q);

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
    }

    if (wantsPharmacy) {
      const places = await this.searchPlaces({
        cityId: input.cityId,
        categoryKey: 'pharmacies',
        limit: 8,
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
        limit: 8,
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
        categoryKey: /cafe|café|coffee/.test(q) ? 'cafes' : 'restaurants',
        lat: input.lat,
        lng: input.lng,
        limit: 8,
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

    // Generic place search fallback when nothing matched but looks like a place query
    if (Object.keys(pack).length === 0 && !asksUnknownPlace) {
      const places = await this.searchPlaces({
        cityId: input.cityId,
        query: input.content,
        lat: input.lat,
        lng: input.lng,
        limit: 5,
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

    return {
      pack,
      citations: [...unique.values()],
      asksUnknownPlace,
    };
  }
}
