import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: string; email?: string };
};

describe('Core API Gate (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  let cityId = '';
  let districtId = '';
  let countryId = '';
  let categoryId = '';
  let adminToken = '';
  let guideToken = '';
  let clientToken = '';
  let clientEmail = '';
  let pendingPlaceId = '';
  let approvedPlaceId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const country = await prisma.country.findUnique({ where: { iso2: 'TN' } });
    const city = await prisma.city.findFirst({
      where: { slug: 'djerba', status: 'ACTIVE' },
    });
    const category = await prisma.category.findFirst({
      where: { key: 'restaurants' },
    });
    if (!country || !city || !category) {
      throw new Error('Seed missing TN/Djerba/categories — run prisma:seed');
    }
    countryId = country.id;
    cityId = city.id;
    categoryId = category.id;

    const district = await prisma.district.findFirst({
      where: { cityId: city.id, slug: 'houmt-souk' },
    });
    if (!district) {
      throw new Error('Seed missing Djerba districts — run prisma:seed');
    }
    districtId = district.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@locallife.local', password: 'Admin123!' })
      .expect(201);
    adminToken = (adminLogin.body as AuthTokens).accessToken;

    const guideLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'guide@locallife.local', password: 'Guide123!' })
      .expect(201);
    guideToken = (guideLogin.body as AuthTokens).accessToken;

    clientEmail = `core_client_${suffix}@test.local`;
    const reg = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: clientEmail,
        password: 'TestPass123!',
        displayName: 'Core Client',
      })
      .expect(201);
    clientToken = (reg.body as AuthTokens).accessToken;
  });

  afterAll(async () => {
    await prisma.report.deleteMany({
      where: { reporter: { email: clientEmail } },
    });
    await prisma.favorite.deleteMany({
      where: { user: { email: clientEmail } },
    });
    await prisma.review.deleteMany({
      where: { user: { email: clientEmail } },
    });
    await prisma.businessPlaceClaim.deleteMany({
      where: { business: { user: { email: clientEmail } } },
    });
    await prisma.businessProfile.deleteMany({
      where: { user: { email: clientEmail } },
    });
    await prisma.guideProfile.deleteMany({
      where: { user: { email: clientEmail } },
    });
    await prisma.place.deleteMany({
      where: {
        createdBy: { email: { in: [clientEmail, 'guide@locallife.local'] } },
      },
    });
    // keep seed places if any; cleanup test places by name prefix
    await prisma.place.deleteMany({
      where: { name: { startsWith: `CoreTest-${suffix}` } },
    });
    await prisma.user.deleteMany({ where: { email: clientEmail } });
    await app.close();
  });

  it('city and categories available', async () => {
    const city = await request(app.getHttpServer())
      .get(`/v1/cities/${cityId}`)
      .expect(200);
    expect((city.body as { country: { iso2: string } }).country.iso2).toBe(
      'TN',
    );

    const cats = await request(app.getHttpServer())
      .get('/v1/categories')
      .expect(200);
    expect(Array.isArray(cats.body)).toBe(true);
    expect((cats.body as unknown[]).length).toBeGreaterThan(0);

    const cities = await request(app.getHttpServer())
      .get(`/v1/countries/${countryId}/cities`)
      .expect(200);
    const names = (cities.body as Array<{ slug: string }>).map((c) => c.slug);
    expect(names).toContain('djerba');
    expect(names).not.toContain('draft-city');
  });

  it('guide creates PENDING place hidden from public; admin approves', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/places')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        cityId,
        name: `CoreTest-${suffix}-Place`,
        summary: 'A test place for core gate',
        latitude: 33.81,
        longitude: 10.85,
        primaryCategoryId: categoryId,
      })
      .expect(201);
    const body = created.body as {
      id: string;
      verificationStatus: string;
    };
    pendingPlaceId = body.id;
    expect(body.verificationStatus).toBe('PENDING');

    const listBefore = await request(app.getHttpServer())
      .get(`/v1/places?cityId=${cityId}`)
      .expect(200);
    const idsBefore = (
      listBefore.body as { data: Array<{ id: string }> }
    ).data.map((p) => p.id);
    expect(idsBefore).not.toContain(pendingPlaceId);

    await request(app.getHttpServer())
      .get(`/v1/places/${pendingPlaceId}`)
      .expect(404);

    const mapOverview = await request(app.getHttpServer())
      .get('/v1/admin/map-overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const mapBody = mapOverview.body as {
      activeCities: Array<{ slug: string; zone: unknown }>;
      guidePlaces: Array<{ id: string }>;
      guides: Array<{ userId: string; districtName: string }>;
    };
    expect(mapBody.activeCities.some((c) => c.slug === 'djerba' && c.zone)).toBe(
      true,
    );
    expect(mapBody.guidePlaces.some((p) => p.id === pendingPlaceId)).toBe(true);
    expect(
      mapBody.guides.some(
        (g) => g.districtName === 'Houmt Souk' || g.userId.length > 0,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post(`/v1/admin/content/place/${pendingPlaceId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const publicPlace = await request(app.getHttpServer())
      .get(`/v1/places/${pendingPlaceId}`)
      .expect(200);
    expect((publicPlace.body as { id: string }).id).toBe(pendingPlaceId);
    approvedPlaceId = pendingPlaceId;

    const audit = await prisma.auditLog.findFirst({
      where: { entityType: 'place', entityId: pendingPlaceId },
    });
    expect(audit).toBeTruthy();
  });

  it('CLIENT cannot create place or approve content', async () => {
    await request(app.getHttpServer())
      .post('/v1/places')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        cityId,
        name: `CoreTest-${suffix}-Client`,
        summary: 'Should fail create',
        latitude: 33.8,
        longitude: 10.8,
      })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/v1/admin/content/place/${approvedPlaceId}/approve`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
  });

  it('client review + favorite + report', async () => {
    const review = await request(app.getHttpServer())
      .post(`/v1/places/${approvedPlaceId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 5, title: 'Great', body: 'Loved it' })
      .expect(201);
    expect((review.body as { rating: number }).rating).toBe(5);

    // upsert again
    await request(app.getHttpServer())
      .post(`/v1/places/${approvedPlaceId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ rating: 4, body: 'Updated' })
      .expect(201);

    const fav1 = await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ targetType: 'PLACE', targetId: approvedPlaceId })
      .expect(201);
    const favId = (fav1.body as { id: string }).id;

    await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ targetType: 'PLACE', targetId: approvedPlaceId })
      .expect(201);

    const favs = await request(app.getHttpServer())
      .get('/v1/me/favorites')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect((favs.body as unknown[]).length).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .post('/v1/reports')
      .send({
        targetType: 'PLACE',
        targetId: approvedPlaceId,
        reason: 'spam',
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/v1/reports')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        targetType: 'PLACE',
        targetId: approvedPlaceId,
        reason: 'inaccurate info',
      })
      .expect(201);

    void favId;
  });

  it('admin creates guide + suspend blocks login; self-apply disabled', async () => {
    const applicantEmail = `guide_app_${suffix}@test.local`;
    const reg = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: applicantEmail,
        password: 'TestPass123!',
        displayName: 'Wanna Guide',
      })
      .expect(201);
    const clientTok = (reg.body as AuthTokens).accessToken;

    await request(app.getHttpServer())
      .post('/v1/guides/apply')
      .set('Authorization', `Bearer ${clientTok}`)
      .send({ bio: 'Local expert', languages: ['fr', 'ar'] })
      .expect(403);

    const districts = await request(app.getHttpServer())
      .get(`/v1/cities/${cityId}/districts`)
      .expect(200);
    expect(
      (districts.body as Array<{ slug: string }>).some(
        (d) => d.slug === 'midoun',
      ),
    ).toBe(true);

    const createdEmail = `guide_prov_${suffix}@test.local`;
    const created = await request(app.getHttpServer())
      .post('/v1/admin/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: createdEmail,
        displayName: 'Provisioned Guide',
        languages: ['en', 'fr'],
        baseCityId: cityId,
        primaryDistrictId: districtId,
      })
      .expect(201);
    const body = created.body as {
      user: {
        id: string;
        role: string;
        guideProfile?: { primaryDistrictId?: string };
      };
      temporaryPassword: string;
    };
    expect(body.user.role).toBe('GUIDE');
    expect(body.temporaryPassword.length).toBeGreaterThan(8);
    expect(body.user.guideProfile?.primaryDistrictId).toBe(districtId);

    const mapAfter = await request(app.getHttpServer())
      .get('/v1/admin/map-overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (
        mapAfter.body as { guides: Array<{ userId: string }> }
      ).guides.some((g) => g.userId === body.user.id),
    ).toBe(true);

    const loginGuide = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: createdEmail, password: body.temporaryPassword })
      .expect(201);
    const guideTok = (loginGuide.body as AuthTokens).accessToken;

    const tip = await request(app.getHttpServer())
      .post('/v1/guides/tips')
      .set('Authorization', `Bearer ${guideTok}`)
      .send({
        cityId,
        title: 'How to get around',
        summary: 'Use louage and taxis',
      })
      .expect(201);
    expect(
      (tip.body as { verificationStatus: string }).verificationStatus,
    ).toBe('PENDING');

    await request(app.getHttpServer())
      .post(`/v1/admin/users/${body.user.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: createdEmail, password: body.temporaryPassword })
      .expect(401);

    await request(app.getHttpServer())
      .post(`/v1/admin/users/${body.user.id}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: createdEmail, password: body.temporaryPassword })
      .expect(201);

    await prisma.howToGuide.deleteMany({
      where: { id: (tip.body as { id: string }).id },
    });
    await prisma.guideProfile.deleteMany({
      where: { userId: body.user.id },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [applicantEmail, createdEmail] } },
    });
  });

  it('business claim → admin verify → limited edit', async () => {
    await request(app.getHttpServer())
      .post('/v1/business/claims')
      .send({ placeId: approvedPlaceId })
      .expect(401);

    const profile = await request(app.getHttpServer())
      .post('/v1/business/profile')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        displayName: 'Test Biz',
        contactEmail: clientEmail,
      })
      .expect(201);

    // re-login to refresh role in JWT (optional); claims allowed with profile
    const claim = await request(app.getHttpServer())
      .post('/v1/business/claims')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ placeId: approvedPlaceId, evidenceUrl: 'https://example.com/ev' })
      .expect(201);
    const claimId = (claim.body as { id: string }).id;

    await request(app.getHttpServer())
      .patch(`/v1/places/${approvedPlaceId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ phone: '+21600000000' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/v1/admin/content/claim/${claimId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const edited = await request(app.getHttpServer())
      .patch(`/v1/places/${approvedPlaceId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ phone: '+21611111111' })
      .expect(200);
    expect((edited.body as { phone: string }).phone).toBe('+21611111111');

    void profile;
  });

  it('guide submits event → admin approve; guide proposes business → admin approve', async () => {
    const event = await request(app.getHttpServer())
      .post('/v1/guides/events')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        cityId,
        title: `Guide event ${suffix}`,
        summary: 'Sunset walk demo event from Guide',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);
    const eventId = (event.body as { id: string }).id;
    expect((event.body as { verificationStatus: string }).verificationStatus).toBe(
      'PENDING',
    );

    await request(app.getHttpServer())
      .post(`/v1/admin/content/event/${eventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const bizEmail = `guide-biz-${suffix}@example.com`;
    const appRes = await request(app.getHttpServer())
      .post('/v1/guides/business-applications')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        email: bizEmail,
        displayName: 'Guide Proposed Cafe',
        baseCityId: cityId,
        primaryDistrictId: districtId,
        note: 'Friendly Midoun cafe',
      })
      .expect(201);
    const appId = (appRes.body as { id: string }).id;

    const approved = await request(app.getHttpServer())
      .post(`/v1/admin/business-applications/${appId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    const temp = (approved.body as { temporaryPassword: string }).temporaryPassword;
    expect(temp).toBeTruthy();

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: bizEmail, password: temp })
      .expect(201);

    const guideUser = await prisma.user.findUnique({
      where: { email: 'guide@locallife.local' },
    });
    const historic = await request(app.getHttpServer())
      .get(`/v1/admin/guides/${guideUser!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const h = (
      historic.body as {
        historic: { eventCount: number; businessApplicationCount: number };
      }
    ).historic;
    expect(h.eventCount).toBeGreaterThanOrEqual(1);
    expect(h.businessApplicationCount).toBeGreaterThanOrEqual(1);

    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.businessApplication.deleteMany({ where: { id: appId } });
    await prisma.businessProfile.deleteMany({
      where: { user: { email: bizEmail } },
    });
    await prisma.user.deleteMany({ where: { email: bizEmail } });
  });
});
