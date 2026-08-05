import {
  GuideActionType,
  GuideParentType,
  PaymentMethod,
  PriceLevel,
  PricingType,
  PrismaClient,
  RuleCategory,
  RuleScope,
  RuleSeverity,
  SafetyLevel,
  SourceType,
  TimeContext,
  TransportMode,
  VerificationStatus,
  ZoneCharacter,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export const DJERBA_REAL_PACK = 'djerba-real-v1';

const DATA_DIR = path.resolve(__dirname, '../../../data/djerba');

const CATEGORY_MAP: Record<string, string> = {
  shops: 'shops_souks',
  attractions: 'activities',
};

type CatMap = Record<string, string>;

type PlaceRow = {
  slug: string;
  name: string;
  summary: string;
  categoryKey: string;
  latitude: number;
  longitude: number;
  addressText?: string | null;
  phone?: string | null;
  website?: string | null;
  priceLevel?: string | null;
  sourceType?: string;
  verificationStatus?: string;
  osmId?: string | null;
  openingHours?: string | null;
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as T;
}

function asEnum<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
  if (!value) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function mapSource(value?: string): SourceType {
  return asEnum(value, Object.values(SourceType) as SourceType[]) ?? SourceType.IMPORTED;
}

function mapPrice(value?: string | null): PriceLevel | null {
  return asEnum(value, Object.values(PriceLevel) as PriceLevel[]);
}

export async function importDjerbaReal(
  prisma: PrismaClient,
  opts: {
    countryId: string;
    cityId: string;
    adminUserId: string;
    guideUserId?: string;
    cats: CatMap;
    /** When false, skip transport/rules/guides if city already has any (P0). Default true skip. */
    forceKnowledge?: boolean;
  },
) {
  const { countryId, cityId, adminUserId, cats } = opts;
  const forceKnowledge = opts.forceKnowledge === true;
  const reviewedAt = new Date();

  const districtsFile = readJson<{ districts: Array<{ slug: string; name: string; latitude: number; longitude: number }> }>(
    'districts.json',
  );
  const placesFile = readJson<{ places: PlaceRow[]; count: number }>('places.json');
  const rulesFile = readJson<{
    rules: Array<{
      category: string;
      severity: string;
      title: string;
      summary: string;
      details?: string | null;
    }>;
  }>('rules.json');
  const transportFile = readJson<{
    transportSystems: Array<{
      code: string;
      name: string;
      mode: string;
      summary: string;
      howItWorks?: string;
      pricingType: string;
      priceMin?: number;
      priceMax?: number;
      paymentMethods: string[];
      warnings: string[];
    }>;
  }>('transport.json');
  const guidesFile = readJson<{
    arrivalGuide: {
      title: string;
      summary: string;
      estimatedTotalTimeMin?: number;
      steps: Array<{
        stepOrder: number;
        title: string;
        actionType: string;
        description: string;
        estimatedTimeMin?: number;
      }>;
    };
    howToGuides: Array<{
      title: string;
      summary: string;
      categoryKey?: string;
      steps: Array<{
        stepOrder: number;
        title: string;
        actionType: string;
        description: string;
      }>;
    }>;
  }>('guides.json');
  const zoneFile = readJson<{
    zoneSafety: Array<{
      districtSlug: string;
      timeContext: string;
      safetyLevel: string;
      reason: string;
      zoneCharacter?: string;
      guideComment?: string;
    }>;
  }>('zone-safety.json');

  for (const d of districtsFile.districts) {
    await prisma.district.upsert({
      where: { cityId_slug: { cityId, slug: d.slug } },
      update: {
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
      },
      create: {
        cityId,
        slug: d.slug,
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
      },
    });
  }

  let placeUpserts = 0;
  let placeSkipped = 0;
  for (const row of placesFile.places) {
    const mappedKey = CATEGORY_MAP[row.categoryKey] ?? row.categoryKey;
    const categoryId = cats[mappedKey];
    if (!categoryId) {
      placeSkipped += 1;
      continue;
    }

    const metadata = {
      pack: DJERBA_REAL_PACK,
      osmId: row.osmId ?? null,
      openingHours: row.openingHours ?? null,
      rawCategoryKey: row.categoryKey,
    };

    await prisma.place.upsert({
      where: { cityId_slug: { cityId, slug: row.slug } },
      update: {
        name: row.name,
        summary: row.summary,
        latitude: row.latitude,
        longitude: row.longitude,
        addressText: row.addressText ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        priceLevel: mapPrice(row.priceLevel),
        primaryCategoryId: categoryId,
        verificationStatus: VerificationStatus.APPROVED,
        sourceType: mapSource(row.sourceType),
        publishedAt: reviewedAt,
        lastReviewedAt: reviewedAt,
        metadata,
      },
      create: {
        cityId,
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        latitude: row.latitude,
        longitude: row.longitude,
        addressText: row.addressText ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        priceLevel: mapPrice(row.priceLevel),
        primaryCategoryId: categoryId,
        verificationStatus: VerificationStatus.APPROVED,
        sourceType: mapSource(row.sourceType),
        createdByUserId: adminUserId,
        publishedAt: reviewedAt,
        lastReviewedAt: reviewedAt,
        metadata,
      },
    });
    placeUpserts += 1;
  }

  const districtRows = await prisma.district.findMany({ where: { cityId } });
  const districtBySlug = Object.fromEntries(districtRows.map((d) => [d.slug, d.id]));

  let zoneUpserts = 0;
  for (const z of zoneFile.zoneSafety) {
    const districtId = districtBySlug[z.districtSlug];
    if (!districtId) continue;
    const timeContext =
      asEnum(z.timeContext, Object.values(TimeContext) as TimeContext[]) ?? TimeContext.DAY;
    const safetyLevel =
      asEnum(z.safetyLevel, Object.values(SafetyLevel) as SafetyLevel[]) ?? SafetyLevel.GOOD;
    const zoneCharacter = asEnum(
      z.zoneCharacter,
      Object.values(ZoneCharacter) as ZoneCharacter[],
    );

    const existing = await prisma.zoneSafetyAssessment.findFirst({
      where: { districtId, timeContext },
    });
    const data = {
      cityId,
      districtId,
      timeContext,
      safetyLevel,
      reason: z.reason,
      guideComment: z.guideComment ?? null,
      zoneCharacter: zoneCharacter ?? null,
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: reviewedAt,
      createdByUserId: adminUserId,
    };
    if (existing) {
      await prisma.zoneSafetyAssessment.update({ where: { id: existing.id }, data });
    } else {
      await prisma.zoneSafetyAssessment.create({ data });
    }
    zoneUpserts += 1;
  }

  const existingTransport = await prisma.transportSystem.count({ where: { cityId } });
  const existingRules = await prisma.localRule.count({ where: { cityId } });
  const existingArrival = await prisma.arrivalGuide.count({ where: { cityId } });
  const shouldSeedKnowledge =
    forceKnowledge || (existingTransport === 0 && existingRules === 0 && existingArrival === 0);

  let transportCreated = 0;
  let rulesCreated = 0;
  let guidesCreated = 0;

  if (shouldSeedKnowledge) {
    // Remove prior real-pack transport rows (tagged via appsJson.pack)
    const prior = await prisma.transportSystem.findMany({
      where: { cityId },
      select: { id: true, appsJson: true },
    });
    const priorRealIds = prior
      .filter((t) => {
        const apps = t.appsJson as { pack?: string } | null;
        return apps?.pack === DJERBA_REAL_PACK;
      })
      .map((t) => t.id);
    if (priorRealIds.length) {
      await prisma.transportRoute.deleteMany({
        where: { transportSystemId: { in: priorRealIds } },
      });
      await prisma.transportHub.deleteMany({
        where: { transportSystemId: { in: priorRealIds } },
      });
      await prisma.transportSystem.deleteMany({ where: { id: { in: priorRealIds } } });
    }

    for (const t of transportFile.transportSystems) {
      const mode = asEnum(t.mode, Object.values(TransportMode) as TransportMode[]) ?? TransportMode.OTHER;
      const pricingType =
        asEnum(t.pricingType, Object.values(PricingType) as PricingType[]) ?? PricingType.UNKNOWN;
      const paymentMethods = (t.paymentMethods || [])
        .map((p) => asEnum(p, Object.values(PaymentMethod) as PaymentMethod[]))
        .filter((p): p is PaymentMethod => !!p);

      await prisma.transportSystem.create({
        data: {
          countryId,
          cityId,
          name: t.name,
          mode,
          summary: t.summary,
          howItWorks: t.howItWorks ?? null,
          pricingType,
          priceMin: t.priceMin ?? null,
          priceMax: t.priceMax ?? null,
          paymentMethods,
          warnings: t.warnings ?? [],
          verificationStatus: VerificationStatus.APPROVED,
          sourceType: SourceType.GUIDE_VERIFIED,
          lastReviewedAt: reviewedAt,
          appsJson: { pack: DJERBA_REAL_PACK, code: t.code },
        },
      });
      transportCreated += 1;
    }

    for (const r of rulesFile.rules) {
      const category =
        asEnum(r.category, Object.values(RuleCategory) as RuleCategory[]) ?? RuleCategory.OTHER;
      const severity =
        asEnum(r.severity, Object.values(RuleSeverity) as RuleSeverity[]) ?? RuleSeverity.INFO;
      const existing = await prisma.localRule.findFirst({
        where: { cityId, title: r.title },
      });
      const data = {
        scope: RuleScope.CITY,
        countryId,
        cityId,
        category,
        severity,
        title: r.title,
        summary: r.summary,
        details: r.details ?? null,
        sourceType: SourceType.GUIDE_VERIFIED,
        verificationStatus: VerificationStatus.APPROVED,
        lastReviewedAt: reviewedAt,
        createdByUserId: adminUserId,
      };
      if (existing) {
        await prisma.localRule.update({ where: { id: existing.id }, data });
      } else {
        await prisma.localRule.create({ data });
      }
      rulesCreated += 1;
    }

    const arrivalExisting = await prisma.arrivalGuide.findFirst({
      where: { cityId, title: guidesFile.arrivalGuide.title },
    });
    if (arrivalExisting) {
      await prisma.guideStep.deleteMany({ where: { arrivalGuideId: arrivalExisting.id } });
      await prisma.arrivalGuide.delete({ where: { id: arrivalExisting.id } });
    }
    const arrival = await prisma.arrivalGuide.create({
      data: {
        cityId,
        title: guidesFile.arrivalGuide.title,
        summary: guidesFile.arrivalGuide.summary,
        estimatedTotalTimeMin: guidesFile.arrivalGuide.estimatedTotalTimeMin ?? null,
        verificationStatus: VerificationStatus.APPROVED,
        lastReviewedAt: reviewedAt,
      },
    });
    for (const step of guidesFile.arrivalGuide.steps) {
      const actionType =
        asEnum(step.actionType, Object.values(GuideActionType) as GuideActionType[]) ??
        GuideActionType.OTHER;
      await prisma.guideStep.create({
        data: {
          parentType: GuideParentType.ARRIVAL_GUIDE,
          arrivalGuideId: arrival.id,
          stepOrder: step.stepOrder,
          title: step.title,
          actionType,
          description: step.description,
          estimatedTimeMin: step.estimatedTimeMin ?? null,
        },
      });
    }
    guidesCreated += 1;

    for (const g of guidesFile.howToGuides) {
      const existingHowTo = await prisma.howToGuide.findFirst({
        where: { cityId, title: g.title },
      });
      if (existingHowTo) {
        await prisma.guideStep.deleteMany({ where: { howToGuideId: existingHowTo.id } });
        await prisma.howToGuide.delete({ where: { id: existingHowTo.id } });
      }
      const howTo = await prisma.howToGuide.create({
        data: {
          cityId,
          countryId,
          title: g.title,
          summary: g.summary,
          categoryKey: g.categoryKey ?? null,
          verificationStatus: VerificationStatus.APPROVED,
          lastReviewedAt: reviewedAt,
          createdByUserId: adminUserId,
        },
      });
      for (const step of g.steps) {
        const actionType =
          asEnum(step.actionType, Object.values(GuideActionType) as GuideActionType[]) ??
          GuideActionType.OTHER;
        await prisma.guideStep.create({
          data: {
            parentType: GuideParentType.HOW_TO_GUIDE,
            howToGuideId: howTo.id,
            stepOrder: step.stepOrder,
            title: step.title,
            actionType,
            description: step.description,
          },
        });
      }
      guidesCreated += 1;
    }
  }

  await prisma.city.update({
    where: { id: cityId },
    data: { contentPackVersion: `${DJERBA_REAL_PACK}+djerba-fake-v2` },
  });

  return {
    pack: DJERBA_REAL_PACK,
    placeUpserts,
    placeSkipped,
    zoneUpserts,
    knowledgeSeeded: shouldSeedKnowledge,
    transportCreated,
    rulesCreated,
    guidesCreated,
  };
}

async function standalone() {
  const prisma = new PrismaClient();
  try {
    const city = await prisma.city.findFirst({
      where: { slug: 'djerba' },
      include: { country: true },
    });
    if (!city) {
      throw new Error('Djerba city not found — run prisma seed first');
    }
    const catsRows = await prisma.category.findMany();
    const cats: CatMap = Object.fromEntries(catsRows.map((c) => [c.key, c.id]));
    const admin = await prisma.user.findFirst({ where: { email: 'admin@locallife.local' } });
    if (!admin) throw new Error('admin@locallife.local not found');

    const forceKnowledge = process.env.FORCE_DJERBA_KNOWLEDGE === '1';
    const result = await importDjerbaReal(prisma, {
      countryId: city.countryId,
      cityId: city.id,
      adminUserId: admin.id,
      cats,
      forceKnowledge,
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  standalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
