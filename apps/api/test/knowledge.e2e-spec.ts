import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { GuideActionType, VerificationStatus } from '@prisma/client';

describe('Knowledge Gate (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cityId = '';

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

    const city = await prisma.city.findFirst({
      where: { slug: 'djerba', status: 'ACTIVE' },
    });
    if (!city) throw new Error('Djerba city missing — run prisma:seed');
    cityId = city.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('arrival guide steps cover SIM/money/taxi/reach city', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/arrival-guides?cityId=${cityId}`)
      .expect(200);
    const guides = res.body as Array<{
      steps: Array<{ actionType: string; stepOrder: number }>;
      lastReviewedAt: string | null;
    }>;
    expect(guides.length).toBeGreaterThan(0);
    const steps = guides[0].steps;
    expect(steps.length).toBeGreaterThanOrEqual(5);
    const orders = steps.map((s) => s.stepOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    const actions = new Set(steps.map((s) => s.actionType));
    expect(actions.has(GuideActionType.BUY_SIM)).toBe(true);
    expect(
      actions.has(GuideActionType.WITHDRAW_ATM) ||
        actions.has(GuideActionType.EXCHANGE_MONEY),
    ).toBe(true);
    expect(actions.has(GuideActionType.TAKE_TAXI)).toBe(true);
    expect(actions.has(GuideActionType.GO_TO_PLACE)).toBe(true);
    expect(guides[0].lastReviewedAt).toBeTruthy();
  });

  it('transport airport→Midoun style has payment + pricingType', async () => {
    const list = await request(app.getHttpServer())
      .get(`/v1/transport-systems?cityId=${cityId}`)
      .expect(200);
    const systems = list.body as Array<{
      id: string;
      name: string;
      mode: string;
      pricingType: string;
      paymentMethods: string[];
      lastReviewedAt: string | null;
    }>;
    expect(systems.length).toBeGreaterThanOrEqual(2);
    expect(systems.every((s) => s.paymentMethods.length > 0)).toBe(true);
    expect(systems.every((s) => Boolean(s.pricingType))).toBe(true);
    expect(systems.every((s) => Boolean(s.lastReviewedAt))).toBe(true);
    expect(systems.some((s) => s.mode === 'TAXI')).toBe(true);
    expect(systems.some((s) => s.mode === 'SHARED_TAXI')).toBe(true);
    expect(systems.some((s) => s.name.includes('PENDING'))).toBe(false);

    const taxi = systems.find((s) => s.mode === 'TAXI')!;
    const detail = await request(app.getHttpServer())
      .get(`/v1/transport-systems/${taxi.id}`)
      .expect(200);
    const routes = (
      detail.body as {
        routes: Array<{
          fromHub: { name: string };
          toHub: { name: string };
          priceMin: string | null;
        }>;
      }
    ).routes;
    expect(
      routes.some(
        (r) =>
          r.fromHub.name.toLowerCase().includes('taxi') ||
          r.toHub.name.toLowerCase().includes('midoun'),
      ),
    ).toBe(true);
  });

  it('emergency CRITICAL rules present; rejected hidden', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/local-rules?cityId=${cityId}`)
      .expect(200);
    const rules = res.body as Array<{
      title: string;
      severity: string;
      category: string;
      sourceType: string;
      lastReviewedAt: string | null;
    }>;
    expect(rules.some((r) => r.severity === 'CRITICAL')).toBe(true);
    expect(rules.some((r) => r.category === 'EMERGENCY')).toBe(true);
    expect(rules.every((r) => Boolean(r.sourceType))).toBe(true);
    expect(rules.every((r) => Boolean(r.lastReviewedAt))).toBe(true);
    expect(rules.some((r) => r.title.includes('REJECTED'))).toBe(false);

    const safety = await request(app.getHttpServer())
      .get(`/v1/local-rules?cityId=${cityId}&category=SAFETY`)
      .expect(200);
    expect(
      (safety.body as Array<{ category: string }>).every(
        (r) => r.category === 'SAFETY',
      ),
    ).toBe(true);
  });

  it('pharmacy and hospital places exist publicly', async () => {
    const pharmacyCat = await prisma.category.findUnique({
      where: { key: 'pharmacies' },
    });
    const hospitalCat = await prisma.category.findUnique({
      where: { key: 'hospitals' },
    });
    expect(pharmacyCat && hospitalCat).toBeTruthy();

    const pharmacies = await request(app.getHttpServer())
      .get(
        `/v1/places?cityId=${cityId}&categoryId=${pharmacyCat!.id}&pageSize=50`,
      )
      .expect(200);
    const hospitals = await request(app.getHttpServer())
      .get(
        `/v1/places?cityId=${cityId}&categoryId=${hospitalCat!.id}&pageSize=50`,
      )
      .expect(200);
    const all = await request(app.getHttpServer())
      .get(`/v1/places?cityId=${cityId}&pageSize=50`)
      .expect(200);

    const pharmData = (
      pharmacies.body as { data: Array<{ summary: string; name: string }> }
    ).data;
    const hospData = (
      hospitals.body as { data: Array<{ summary: string; name: string }> }
    ).data;
    const pageData = (
      all.body as { data: Array<{ summary: string; name: string }> }
    ).data;

    expect(pharmData.length).toBeGreaterThanOrEqual(2);
    expect(hospData.length).toBeGreaterThanOrEqual(2);
    expect(pageData.length).toBeGreaterThanOrEqual(30);
    expect(
      [...pharmData, ...hospData, ...pageData].every(
        (p) => p.summary && p.summary.length >= 5,
      ),
    ).toBe(true);
    expect(pageData.some((p) => p.name.includes('PENDING'))).toBe(false);
  });

  it('survival kit how-to guide is readable', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/how-to-guides?cityId=${cityId}&categoryKey=SURVIVAL_48H`)
      .expect(200);
    const guides = res.body as Array<{
      categoryKey: string;
      steps: unknown[];
      lastReviewedAt: string | null;
      verificationStatus?: string;
    }>;
    expect(guides.length).toBe(1);
    expect(guides[0].steps.length).toBeGreaterThanOrEqual(4);
    expect(guides[0].lastReviewedAt).toBeTruthy();
  });

  it('pending transport/place not publicly readable', async () => {
    const pendingPlace = await prisma.place.findFirst({
      where: {
        cityId,
        verificationStatus: VerificationStatus.PENDING,
      },
    });
    expect(pendingPlace).toBeTruthy();
    await request(app.getHttpServer())
      .get(`/v1/places/${pendingPlace!.id}`)
      .expect(404);

    const pendingTransport = await prisma.transportSystem.findFirst({
      where: { cityId, verificationStatus: VerificationStatus.PENDING },
    });
    expect(pendingTransport).toBeTruthy();
    await request(app.getHttpServer())
      .get(`/v1/transport-systems/${pendingTransport!.id}`)
      .expect(404);
  });
});
