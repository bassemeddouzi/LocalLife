import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import * as argon2 from 'argon2';
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
];

async function main() {
  const adminPassword = await argon2.hash('Admin123!');
  const guidePassword = await argon2.hash('Guide123!');

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
      baseCityId: city.id,
      primaryDistrictId: houmtSouk?.id,
    },
    create: {
      userId: guide.id,
      bio: 'Seed guide account for Djerba content',
      languages: ['en', 'fr', 'ar'],
      status: 'APPROVED',
      baseCityId: city.id,
      primaryDistrictId: houmtSouk?.id,
    },
  });

  // Backfill any existing Guides missing a base city (district stays optional until Admin edits)
  await prisma.guideProfile.updateMany({
    where: { baseCityId: null },
    data: { baseCityId: city.id },
  });

  // Clear dependent rows that block place deletes from prior packs
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
    cats,
  });

  console.log('Seed complete');
  console.log('ADMIN:', admin.email, 'Admin123!');
  console.log('GUIDE:', guide.email, 'Guide123!');
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
