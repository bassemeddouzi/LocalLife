import { PrismaClient, RatingTargetType, UserRole, VerificationStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { importDjerbaReal } from './import-djerba-real';
import { seedDjerbaP0 } from './seed-djerba-p0';

const prisma = new PrismaClient();

const CATEGORIES: Array<{
  key: string;
  name: string;
  icon?: string;
  sortOrder: number;
}> = [
  { key: 'restaurants', name: 'Restaurants', icon: 'utensils', sortOrder: 10 },
  { key: 'cafes', name: 'Cafés', icon: 'coffee', sortOrder: 20 },
  { key: 'beaches', name: 'Beaches', icon: 'beach', sortOrder: 30 },
  { key: 'hotels', name: 'Hotels', icon: 'bed', sortOrder: 40 },
  { key: 'museums', name: 'Museums', icon: 'landmark', sortOrder: 50 },
  { key: 'supermarkets', name: 'Supermarkets', icon: 'cart', sortOrder: 60 },
  { key: 'pharmacies', name: 'Pharmacies', icon: 'pill', sortOrder: 70 },
  { key: 'hospitals', name: 'Hospitals', icon: 'hospital', sortOrder: 80 },
  { key: 'parks', name: 'Parks', icon: 'tree', sortOrder: 90 },
  { key: 'shops_souks', name: 'Shops & Souks', icon: 'store', sortOrder: 100 },
  { key: 'activities', name: 'Activities', icon: 'activity', sortOrder: 110 },
  { key: 'nightlife', name: 'Nightlife', icon: 'moon', sortOrder: 120 },
  { key: 'transport_hubs', name: 'Transport', icon: 'bus', sortOrder: 130 },
  { key: 'banks', name: 'Banks & ATMs', icon: 'bank', sortOrder: 140 },
  { key: 'phone_repair', name: 'Phone repair', icon: 'phone', sortOrder: 150 },
  { key: 'car_repair', name: 'Car repair', icon: 'wrench', sortOrder: 160 },
  { key: 'budget_shops', name: 'Budget shops', icon: 'tag', sortOrder: 170 },
  { key: 'camping', name: 'Camping', icon: 'tent', sortOrder: 180 },
  { key: 'car_rental', name: 'Car rental', icon: 'car', sortOrder: 190 },
];

async function main() {
  const adminPassword = await argon2.hash('Admin123!');
  const guidePassword = await argon2.hash('Guide123!');
  const businessPassword = await argon2.hash('Business123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@locallife.local' },
    update: { role: UserRole.ADMIN, passwordHash: adminPassword },
    create: {
      email: 'admin@locallife.local',
      displayName: 'LocalLife Admin',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      preference: { create: {} },
    },
  });

  const guide = await prisma.user.upsert({
    where: { email: 'guide@locallife.local' },
    update: { role: UserRole.GUIDE, passwordHash: guidePassword },
    create: {
      email: 'guide@locallife.local',
      displayName: 'Djerba Guide',
      role: UserRole.GUIDE,
      passwordHash: guidePassword,
      preference: { create: {} },
      guideProfile: {
        create: {
          bio: 'Seed guide account for Djerba content',
          languages: ['en', 'fr', 'ar'],
          status: 'APPROVED',
        },
      },
    },
  });

  const business = await prisma.user.upsert({
    where: { email: 'business@locallife.local' },
    update: { role: UserRole.BUSINESS, passwordHash: businessPassword },
    create: {
      email: 'business@locallife.local',
      displayName: 'Djerba Fake Cafe',
      role: UserRole.BUSINESS,
      passwordHash: businessPassword,
      preference: { create: {} },
      businessProfile: {
        create: {
          displayName: 'Djerba Fake Cafe',
          legalName: 'Djerba Fake Cafe SARL',
          contactEmail: 'business@locallife.local',
          verificationStatus: 'APPROVED',
        },
      },
    },
  });

  await prisma.aiModelConfig.deleteMany();
  await prisma.aiModelConfig.create({
    data: {
      provider: 'openrouter',
      modelId: 'openai/gpt-4o-mini',
      fallbackModelId: 'anthropic/claude-3.5-sonnet',
      enabled: true,
      updatedByAdminId: admin.id,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'FF_AI_AGENT' },
    update: { enabledGlobal: false },
    create: {
      key: 'FF_AI_AGENT',
      description: 'Proactive AI agent (future)',
      enabledGlobal: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'FF_GUIDE_SELF_APPLY' },
    update: { enabledGlobal: false },
    create: {
      key: 'FF_GUIDE_SELF_APPLY',
      description: 'Allow clients to self-apply as guides',
      enabledGlobal: false,
    },
  });

  const aiFlags = [
    {
      key: 'ai.profileMemory',
      description: 'Long-term compressed client profile card for AI',
    },
    {
      key: 'ai.sessionContext',
      description: 'Per-trip/session context overrides for planning',
    },
    {
      key: 'ai.digestRead',
      description: 'Prefer compressed place/zone/transport digests in AI context',
    },
    {
      key: 'ai.issueDetector',
      description: 'Detect issues in chat and notify guides',
    },
    {
      key: 'ai.tokenGovernor',
      description: 'Token budgets, truncation, and usage accounting',
    },
  ];
  for (const flag of aiFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description, enabledGlobal: true },
      create: { ...flag, enabledGlobal: true },
    });
  }

  const country = await prisma.country.upsert({
    where: { iso2: 'TN' },
    update: { status: 'ACTIVE', packVersion: 'tn-v1' },
    create: {
      iso2: 'TN',
      iso3: 'TUN',
      name: 'Tunisia',
      defaultLocale: 'fr',
      defaultCurrency: 'TND',
      status: 'ACTIVE',
      packVersion: 'tn-v1',
      emergencyNumbersJson: { police: '197', ambulance: '190', fire: '198' },
    },
  });

  await prisma.region.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: { name: 'Medenine', status: 'ACTIVE' },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      countryId: country.id,
      name: 'Medenine',
      code: 'ME',
      status: 'ACTIVE',
    },
  }).catch(async () => {
    // id may collide across reseed — upsert by name fallback
    const existing = await prisma.region.findFirst({
      where: { countryId: country.id, name: 'Medenine' },
    });
    if (!existing) {
      await prisma.region.create({
        data: {
          countryId: country.id,
          name: 'Medenine',
          code: 'ME',
          status: 'ACTIVE',
        },
      });
    }
  });

  const region = await prisma.region.findFirst({
    where: { countryId: country.id, name: 'Medenine' },
  });

  const city = await prisma.city.upsert({
    where: { countryId_slug: { countryId: country.id, slug: 'djerba' } },
    update: {
      status: 'ACTIVE',
      isFeatured: true,
      contentPackVersion: 'djerba-fake-v2',
      regionId: region?.id,
    },
    create: {
      countryId: country.id,
      regionId: region?.id,
      name: 'Djerba',
      slug: 'djerba',
      latitude: 33.8075,
      longitude: 10.8451,
      status: 'ACTIVE',
      isFeatured: true,
      contentPackVersion: 'djerba-fake-v2',
      defaultLocale: 'fr',
    },
  });

  const DJERBA_DISTRICTS: Array<{
    slug: string;
    name: string;
    latitude: number;
    longitude: number;
  }> = [
    { slug: 'houmt-souk', name: 'Houmt Souk', latitude: 33.8758, longitude: 10.8575 },
    { slug: 'midoun', name: 'Midoun', latitude: 33.8081, longitude: 11.0014 },
    { slug: 'ajim', name: 'Ajim', latitude: 33.724, longitude: 10.752 },
    { slug: 'aghir', name: 'Aghir', latitude: 33.748, longitude: 11.013 },
    { slug: 'erriadh', name: 'Erriadh', latitude: 33.8206, longitude: 10.8539 },
    { slug: 'guellala', name: 'Guellala', latitude: 33.728, longitude: 10.86 },
  ];

  for (const d of DJERBA_DISTRICTS) {
    await prisma.district.upsert({
      where: { cityId_slug: { cityId: city.id, slug: d.slug } },
      update: {
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
      },
      create: {
        cityId: city.id,
        name: d.name,
        slug: d.slug,
        latitude: d.latitude,
        longitude: d.longitude,
      },
    });
  }

  const houmtSouk = await prisma.district.findUnique({
    where: { cityId_slug: { cityId: city.id, slug: 'houmt-souk' } },
  });

  const midounDistrict = await prisma.district.findUnique({
    where: { cityId_slug: { cityId: city.id, slug: 'midoun' } },
  });

  const HOODS: Array<{
    districtId: string | undefined;
    slug: string;
    name: string;
    latitude: number;
    longitude: number;
  }> = [
    {
      districtId: houmtSouk?.id,
      slug: 'souk-center',
      name: 'Souk Center',
      latitude: 33.8762,
      longitude: 10.8568,
    },
    {
      districtId: houmtSouk?.id,
      slug: 'port-area',
      name: 'Port Area',
      latitude: 33.881,
      longitude: 10.862,
    },
    {
      districtId: midounDistrict?.id,
      slug: 'midoun-center',
      name: 'Midoun Center',
      latitude: 33.8085,
      longitude: 11.001,
    },
    {
      districtId: midounDistrict?.id,
      slug: 'yasmin-hammamet-side',
      name: 'Zone Touristique',
      latitude: 33.815,
      longitude: 11.02,
    },
  ];

  for (const h of HOODS) {
    if (!h.districtId) continue;
    await prisma.hood.upsert({
      where: {
        districtId_slug: { districtId: h.districtId, slug: h.slug },
      },
      update: {
        name: h.name,
        latitude: h.latitude,
        longitude: h.longitude,
      },
      create: {
        districtId: h.districtId,
        name: h.name,
        slug: h.slug,
        latitude: h.latitude,
        longitude: h.longitude,
      },
    });
  }

  await prisma.city.upsert({
    where: { countryId_slug: { countryId: country.id, slug: 'draft-city' } },
    update: { status: 'DISABLED' },
    create: {
      countryId: country.id,
      name: 'Draft City',
      slug: 'draft-city',
      status: 'DISABLED',
    },
  });

  const cats: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { key: cat.key },
      update: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: cat,
    });
    cats[cat.key] = row.id;
  }

  await prisma.guideProfile.upsert({
    where: { userId: guide.id },
    update: {
      status: 'APPROVED',
      assignmentLevel: 'DISTRICT',
      countryId: country.id,
      regionId: region?.id,
      baseCityId: city.id,
      primaryDistrictId: houmtSouk?.id,
      hoodId: null,
    },
    create: {
      userId: guide.id,
      bio: 'Seed guide account for Djerba content',
      languages: ['en', 'fr', 'ar'],
      status: 'APPROVED',
      assignmentLevel: 'DISTRICT',
      countryId: country.id,
      regionId: region?.id,
      baseCityId: city.id,
      primaryDistrictId: houmtSouk?.id,
    },
  });

  const midoun = midounDistrict;

  await prisma.businessProfile.upsert({
    where: { userId: business.id },
    update: {
      verificationStatus: 'APPROVED',
      displayName: 'Djerba Fake Cafe',
      baseCityId: city.id,
      primaryDistrictId: midoun?.id ?? houmtSouk?.id,
    },
    create: {
      userId: business.id,
      displayName: 'Djerba Fake Cafe',
      legalName: 'Djerba Fake Cafe SARL',
      contactEmail: 'business@locallife.local',
      verificationStatus: 'APPROVED',
      baseCityId: city.id,
      primaryDistrictId: midoun?.id ?? houmtSouk?.id,
    },
  });

  // Backfill any existing Guides missing a base city (district stays optional until Admin edits)
  await prisma.guideProfile.updateMany({
    where: { baseCityId: null },
    data: { baseCityId: city.id },
  });

  await prisma.businessProfile.updateMany({
    where: { baseCityId: null },
    data: { baseCityId: city.id },
  });

  // Clear dependent rows that block place deletes from prior packs
  await prisma.clientPlan.deleteMany({
    where: {
      OR: [{ cityId: city.id }, { user: { email: 'client@locallife.local' } }],
    },
  });
  await prisma.review.deleteMany({ where: { place: { cityId: city.id } } });
  await prisma.favorite.deleteMany({
    where: {
      targetType: 'PLACE',
      targetId: { in: (await prisma.place.findMany({ where: { cityId: city.id }, select: { id: true } })).map((p) => p.id) },
    },
  });
  await prisma.businessPlaceClaim.deleteMany({
    where: { place: { cityId: city.id } },
  });
  await prisma.report.deleteMany({
    where: {
      targetType: 'PLACE',
      targetId: { in: (await prisma.place.findMany({ where: { cityId: city.id }, select: { id: true } })).map((p) => p.id) },
    },
  });

  const pack = await seedDjerbaP0(prisma, {
    countryId: country.id,
    cityId: city.id,
    adminUserId: admin.id,
    guideUserId: guide.id,
    cats,
  });

  // OSM + curated real pack (places/districts/zone safety; knowledge skipped if P0 already seeded it)
  const realPack = await importDjerbaReal(prisma, {
    countryId: country.id,
    cityId: city.id,
    adminUserId: admin.id,
    guideUserId: guide.id,
    cats,
  });
  console.log(
    `Djerba real pack ${realPack.pack}: ${realPack.placeUpserts} places, ${realPack.zoneUpserts} zone safety`,
  );

  // --- Vision 2.0 demo data for app testing ---
  const clientPassword = await argon2.hash('Client123!');
  const client = await prisma.user.upsert({
    where: { email: 'client@locallife.local' },
    update: {
      role: UserRole.CLIENT,
      passwordHash: clientPassword,
      personaType: 'TOURIST',
      onboardingCompletedAt: new Date(),
      locale: 'en',
    },
    create: {
      email: 'client@locallife.local',
      displayName: 'Demo Traveler',
      role: UserRole.CLIENT,
      passwordHash: clientPassword,
      personaType: 'TOURIST',
      onboardingCompletedAt: new Date(),
      locale: 'en',
      preference: {
        create: {
          budgetBand: 'MEDIUM',
          homeCityId: city.id,
          conservatismLevel: 'MODERATE',
          walksOk: true,
          hasVehicle: false,
          vibe: 'CALM',
          settingPref: 'MIDDLE',
          groupSize: 'COUPLE',
          hardFiltersJson: { blockAdultNightlife: false },
          consentAnalytics: true,
          consentPersonalization: true,
        },
      },
    },
  });
  await prisma.userPreference.upsert({
    where: { userId: client.id },
    update: {
      budgetBand: 'MEDIUM',
      homeCityId: city.id,
      conservatismLevel: 'MODERATE',
      walksOk: true,
      hasVehicle: false,
      vibe: 'CALM',
      settingPref: 'MIDDLE',
      groupSize: 'COUPLE',
      hardFiltersJson: { blockAdultNightlife: false },
      consentPersonalization: true,
    },
    create: {
      userId: client.id,
      budgetBand: 'MEDIUM',
      homeCityId: city.id,
      conservatismLevel: 'MODERATE',
      walksOk: true,
      hasVehicle: false,
      vibe: 'CALM',
      settingPref: 'MIDDLE',
      groupSize: 'COUPLE',
      hardFiltersJson: { blockAdultNightlife: false },
    },
  });

  await prisma.place.updateMany({
    where: { cityId: city.id, verificationStatus: 'APPROVED', deletedAt: null },
    data: {
      lastReviewedAt: new Date(),
      freshnessScore: 88,
    },
  });

  const samplePlace = await prisma.place.findFirst({
    where: { cityId: city.id, verificationStatus: 'APPROVED', deletedAt: null },
    orderBy: { name: 'asc' },
  });
  if (samplePlace) {
    await prisma.place.update({
      where: { id: samplePlace.id },
      data: {
        guideComment:
          'Friendly for couples and families during the day. Ask for the terrace if available.',
        audienceTags: ['COUPLE', 'FAMILY_CONSERVATIVE', 'ALL'],
        typicalDurationMin: 75,
        effortLevel: 'EASY',
        budgetBand: 'MEDIUM',
        ambienceTags: ['quiet', 'local'],
        lastReviewedAt: new Date(),
        freshnessScore: 95,
      },
    });
    await prisma.placeHour.deleteMany({ where: { placeId: samplePlace.id } });
    for (let day = 0; day < 7; day++) {
      await prisma.placeHour.create({
        data: {
          placeId: samplePlace.id,
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: '22:00',
          isClosed: false,
        },
      });
    }
  }

  await prisma.zoneSafetyAssessment.deleteMany({
    where: { cityId: city.id },
  });
  if (houmtSouk) {
    await prisma.zoneSafetyAssessment.createMany({
      data: [
        {
          cityId: city.id,
          districtId: houmtSouk.id,
          timeContext: 'DAY',
          safetyLevel: 'VERY_GOOD',
          reason: 'Busy market streets, many locals and visitors.',
          guideComment: 'Fine to walk and shop; keep usual pickpocket awareness.',
          zoneCharacter: 'TOURIST',
          howToArrive: 'Walk from town center or short taxi.',
          createdByUserId: guide.id,
          verificationStatus: 'APPROVED',
          lastReviewedAt: new Date(),
          freshnessScore: 90,
        },
        {
          cityId: city.id,
          districtId: houmtSouk.id,
          timeContext: 'NIGHT',
          safetyLevel: 'GOOD',
          reason: 'Quieter side streets after 23:00.',
          guideComment: 'Prefer well-lit main roads; use a known taxi app/driver.',
          zoneCharacter: 'MIXED',
          howToArrive: 'Taxi recommended late evening.',
          createdByUserId: guide.id,
          verificationStatus: 'APPROVED',
          lastReviewedAt: new Date(),
          freshnessScore: 90,
        },
      ],
    });
  }

  await prisma.transportScenario.deleteMany({
    where: { cityId: city.id },
  });
  await prisma.transportScenario.create({
    data: {
      cityId: city.id,
      fromLabel: 'Djerba airport (Zarzis)',
      toLabel: 'Houmt Souk center',
      stepsJson: [
        {
          mode: 'TAXI',
          note: 'Official airport taxi — ask fixed price before leaving',
        },
        { mode: 'WALK', note: 'Drop near old souk entrance' },
      ],
      estCostMin: 25,
      estCostMax: 40,
      currency: 'TND',
      estMinutes: 35,
      pricingModes: ['FIXED', 'METERED'],
      guideComment:
        'Fixed price is usual from airport. Confirm before departure.',
      verificationStatus: 'APPROVED',
      lastReviewedAt: new Date(),
      createdByUserId: guide.id,
    },
  });

  const planPackDefs = [
    {
      code: 'arrival_kit',
      title: 'First hour after landing',
      summary: 'Airport → cash/SIM → hotel → first calm meal',
      personaHints: ['TOURIST', 'VISITING'] as const,
      stepsJson: [
        {
          sortOrder: 0,
          kind: 'TRANSPORT',
          freeText: 'Exit airport & take official taxi / louage',
          transportNote: 'FIXED price taxi from airport rank — confirm before leaving',
          durationMin: 35,
          placeId: pack.airportPlaceId,
        },
        {
          sortOrder: 1,
          kind: 'SHOP',
          freeText: 'SIM / cash if needed',
          transportNote: 'Short walk inside arrivals / nearby ATM',
          durationMin: 30,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'atm-stb-airport' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 2,
          kind: 'PLACE',
          freeText: 'Check in / drop bags',
          durationMin: 40,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'hotel-zone-touristique' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 3,
          kind: 'PLACE',
          freeText: 'Light local meal nearby',
          durationMin: 60,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'restaurant-el-houd' },
              select: { id: true },
            })
          )?.id,
        },
      ],
    },
    {
      code: 'student_essentials',
      title: 'Student living kit',
      summary: 'Pharmacy, cheap lunch, study cafe, bus hub',
      personaHints: ['STUDENT'] as const,
      stepsJson: [
        {
          sortOrder: 0,
          kind: 'SHOP',
          freeText: 'Nearest pharmacy',
          durationMin: 20,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'pharmacie-centrale-hs' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 1,
          kind: 'PLACE',
          freeText: 'Budget lunch spot',
          durationMin: 45,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'restaurant-midoun-grill' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 2,
          kind: 'PLACE',
          freeText: 'Quiet study cafe',
          durationMin: 90,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'cafe-place-publique' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 3,
          kind: 'TRANSPORT',
          freeText: 'Main transport hub',
          transportNote: 'Louage / taxi hub — ask FIXED vs METER',
          durationMin: 30,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'houmt-souk-louage' },
              select: { id: true },
            })
          )?.id,
        },
      ],
    },
    {
      code: 'transport_only',
      title: 'Transport-only plan',
      summary: 'Best ways to move in the zone (fixed vs meter pricing)',
      personaHints: ['TOURIST', 'STUDENT', 'WORKER', 'LOCAL'] as const,
      stepsJson: [
        {
          sortOrder: 0,
          kind: 'TRANSPORT',
          freeText: 'Choose FIXED vs METER for your trip',
          transportNote: 'Airport→town is usually FIXED; in-town may be METER',
          durationMin: 10,
          placeId: pack.airportPlaceId,
        },
        {
          sortOrder: 1,
          kind: 'TRANSPORT',
          freeText: 'Hub / pickup point',
          transportNote: 'Houmt Souk louage station',
          durationMin: 15,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'houmt-souk-louage' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 2,
          kind: 'TRANSPORT',
          freeText: 'Confirm return / last option',
          transportNote: 'Ask last departure time before leaving',
          durationMin: 10,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'midoun-taxi-hub' },
              select: { id: true },
            })
          )?.id,
        },
      ],
    },
    {
      code: 'family_day',
      title: 'Family calm day',
      summary: 'Kid-friendly stops, no nightlife, easy walking',
      personaHints: ['FAMILY', 'TOURIST'] as const,
      stepsJson: [
        {
          sortOrder: 0,
          kind: 'PLACE',
          freeText: 'Breakfast at a calm cafe',
          durationMin: 45,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'cafe-midoun-corner' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 1,
          kind: 'PLACE',
          freeText: 'Beach or park with shade',
          durationMin: 120,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'plage-sejoumi' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 2,
          kind: 'PLACE',
          freeText: 'Early dinner — family restaurant',
          durationMin: 75,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'restaurant-el-houd' },
              select: { id: true },
            })
          )?.id,
        },
      ],
    },
    {
      code: 'care_day',
      title: 'Care day pack',
      summary: 'Clinic / pharmacy / calm cafe / return transport',
      personaHints: ['TREATMENT', 'LOCAL'] as const,
      stepsJson: [
        {
          sortOrder: 0,
          kind: 'PLACE',
          freeText: 'Clinic or hospital desk',
          durationMin: 60,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'hopital-houmt-souk' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 1,
          kind: 'SHOP',
          freeText: 'Pharmacy nearby',
          durationMin: 20,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'pharmacie-centrale-hs' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 2,
          kind: 'PLACE',
          freeText: 'Quiet cafe to rest',
          durationMin: 40,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'cafe-place-publique' },
              select: { id: true },
            })
          )?.id,
        },
        {
          sortOrder: 3,
          kind: 'TRANSPORT',
          freeText: 'Trusted taxi back',
          transportNote: 'Prefer known driver / FIXED short hop',
          durationMin: 25,
          placeId: (
            await prisma.place.findFirst({
              where: { cityId: city.id, slug: 'airport-taxi-rank' },
              select: { id: true },
            })
          )?.id,
        },
      ],
    },
  ];

  for (const p of planPackDefs) {
    await prisma.planPack.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        cityId: city.id,
        title: p.title,
        summary: p.summary,
        personaHints: [...p.personaHints],
        stepsJson: p.stepsJson,
        enabled: true,
      },
      update: {
        cityId: city.id,
        title: p.title,
        summary: p.summary,
        personaHints: [...p.personaHints],
        stepsJson: p.stepsJson,
        enabled: true,
      },
    });
  }

  const arrivalPack = await prisma.planPack.findUnique({
    where: { code: 'arrival_kit' },
  });
  await prisma.clientPlan.deleteMany({ where: { userId: client.id } });
  const demoPlan = await prisma.clientPlan.create({
    data: {
      userId: client.id,
      cityId: city.id,
      title: 'My Djerba first afternoon',
      status: 'ACTIVE',
      source: 'PACK',
      planPackId: arrivalPack?.id,
      offlinePayloadJson: {
        emergency: { police: '197', ambulance: '190', fire: '198' },
        cityName: 'Djerba',
      },
      steps: {
        create: [
          {
            sortOrder: 0,
            freeText: 'Arrive & settle at lodging',
            durationMin: 40,
            transportNote: 'Taxi from airport — FIXED price',
            placeId: (
              await prisma.place.findFirst({
                where: { cityId: city.id, slug: 'hotel-zone-touristique' },
                select: { id: true },
              })
            )?.id,
            whyJson: { reason: 'Start rested before exploring', kind: 'PLACE' },
            status: 'DONE',
          },
          {
            sortOrder: 1,
            freeText: 'Walk Houmt Souk main streets (daytime)',
            durationMin: 90,
            transportNote: 'Walk or short taxi',
            placeId: samplePlace?.id,
            whyJson: {
              reason: 'Fits calm couple vibe + good daytime safety',
              kind: 'PLACE',
            },
            status: 'PENDING',
          },
          {
            sortOrder: 2,
            freeText: 'Pharmacy stop if needed',
            durationMin: 20,
            placeId: (
              await prisma.place.findFirst({
                where: { cityId: city.id, slug: 'pharmacie-centrale-hs' },
                select: { id: true },
              })
            )?.id,
            whyJson: { kind: 'SHOP' },
            status: 'PENDING',
          },
          {
            sortOrder: 3,
            freeText: 'Calm dinner',
            durationMin: 75,
            placeId: (
              await prisma.place.findFirst({
                where: { cityId: city.id, slug: 'restaurant-el-houd' },
                select: { id: true },
              })
            )?.id,
            whyJson: { kind: 'PLACE' },
            status: 'PENDING',
          },
        ],
      },
    },
  });

  await prisma.notification.deleteMany({ where: { userId: client.id } });
  await prisma.avatarCue.deleteMany({ where: { userId: client.id } });
  await prisma.notification.create({
    data: {
      userId: client.id,
      type: 'SUGGESTION',
      title: 'Welcome to Djerba',
      body: 'Your demo plan is active. Open Home to see the timeline.',
      data: { planId: demoPlan.id },
    },
  });
  await prisma.avatarCue.create({
    data: {
      userId: client.id,
      animationHint: 'celebrate',
      title: 'Plan ready',
      body: 'Tap Chat anytime — I can adjust your afternoon plan.',
      deepLink: `plan:${demoPlan.id}`,
    },
  });

  await prisma.subGuideApplication.deleteMany({
    where: { mainGuideUserId: guide.id, email: 'subguide@locallife.local' },
  });
  if (houmtSouk) {
    const lat = Number(houmtSouk.latitude);
    const lng = Number(houmtSouk.longitude);
    const radiusM = 900;
    const ring: [number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * 2 * Math.PI;
      const dLat = (radiusM * Math.sin(theta)) / 111_320;
      const dLng =
        (radiusM * Math.cos(theta)) / (111_320 * Math.cos((lat * Math.PI) / 180));
      ring.push([lng + dLng, lat + dLat]);
    }
    await prisma.subGuideApplication.create({
      data: {
        mainGuideUserId: guide.id,
        email: 'subguide@locallife.local',
        displayName: 'Houmt Souk SubGuide (pending)',
        phone: '+21620000000',
        formationNote:
          'Demo: formation/entretien done — waiting Admin confirmation to test Approve flow.',
        borderGeoJson: { type: 'Polygon', coordinates: [ring] },
        status: 'PENDING_ADMIN',
      },
    });
  }

  await prisma.guideProfile.update({
    where: { userId: guide.id },
    data: { lastContentReviewAt: new Date() },
  });

  // Demo client ratings (place / city / district / transport)
  await prisma.clientRating.deleteMany({ where: { userId: client.id } });
  const taxiSys = await prisma.transportSystem.findFirst({
    where: { cityId: city.id, mode: 'TAXI', verificationStatus: 'APPROVED' },
    select: { id: true },
  });
  const ratingTargets: Array<{
    targetType: RatingTargetType;
    targetId: string;
    rating: number;
    body: string;
  }> = [];
  if (samplePlace?.id) {
    ratingTargets.push({
      targetType: RatingTargetType.PLACE,
      targetId: samplePlace.id,
      rating: 5,
      body: 'Loved the terrace — calm and local. Guide tip was spot on.',
    });
  }
  ratingTargets.push({
    targetType: RatingTargetType.CITY,
    targetId: city.id,
    rating: 4,
    body: 'Djerba is easy once you know taxi vs louage. Seed demo review.',
  });
  if (houmtSouk?.id) {
    ratingTargets.push({
      targetType: RatingTargetType.DISTRICT,
      targetId: houmtSouk.id,
      rating: 5,
      body: 'Houmt Souk daytime is great for walking and shopping.',
    });
    ratingTargets.push({
      targetType: RatingTargetType.ZONE,
      targetId: houmtSouk.id,
      rating: 4,
      body: 'Zone feels safe in the day; prefer main streets at night.',
    });
  }
  if (taxiSys?.id) {
    ratingTargets.push({
      targetType: RatingTargetType.TRANSPORT_SYSTEM,
      targetId: taxiSys.id,
      rating: 4,
      body: 'Official airport taxi was fair once we agreed FIXED price.',
    });
  }
  for (const r of ratingTargets) {
    await prisma.clientRating.create({
      data: {
        userId: client.id,
        targetType: r.targetType,
        targetId: r.targetId,
        rating: r.rating,
        body: r.body,
        status: 'APPROVED',
      },
    });
  }

  console.log('Seed complete');
  console.log('ADMIN:', admin.email, 'Admin123!');
  console.log('GUIDE:', guide.email, 'Guide123!', '· DISTRICT · Houmt Souk');
  console.log('BUSINESS:', business.email, 'Business123!');
  console.log('CLIENT:', client.email, 'Client123!', '· active demo plan + Avatar cue');
  console.log('Admin SubGuides queue: pending subguide@locallife.local');
  console.log('Plan packs: arrival_kit, student_essentials, transport_only, family_day, care_day');
  console.log('Djerba pack:', pack);
  void VerificationStatus;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
