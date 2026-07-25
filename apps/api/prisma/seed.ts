import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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
      emergencyNumbersJson: { police: '197', ambulance: '190' },
    },
  });

  await prisma.city.upsert({
    where: { countryId_slug: { countryId: country.id, slug: 'djerba' } },
    update: { status: 'ACTIVE', isFeatured: true, contentPackVersion: 'djerba-fake-v1' },
    create: {
      countryId: country.id,
      name: 'Djerba',
      slug: 'djerba',
      latitude: 33.8075,
      longitude: 10.8451,
      status: 'ACTIVE',
      isFeatured: true,
      contentPackVersion: 'djerba-fake-v1',
      defaultLocale: 'fr',
    },
  });

  // ensure guide profile exists if user was updated path
  await prisma.guideProfile.upsert({
    where: { userId: guide.id },
    update: { status: 'APPROVED' },
    create: {
      userId: guide.id,
      bio: 'Seed guide account for Djerba content',
      languages: ['en', 'fr', 'ar'],
      status: 'APPROVED',
    },
  });

  console.log('Seed complete');
  console.log('ADMIN:', admin.email, 'Admin123!');
  console.log('GUIDE:', guide.email, 'Guide123!');
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
