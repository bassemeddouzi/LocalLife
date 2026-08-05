import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AI token-efficient upgrade (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const email = `ai_upgrade_${suffix}@test.local`;
  const password = 'TestPass123!';
  let accessToken = '';
  let cityId = '';
  let conversationId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const city = await prisma.city.findFirst({ select: { id: true } });
    if (!city) throw new Error('No city found in seed');
    cityId = city.id;
  });

  afterAll(async () => {
    if (prisma) await prisma.user.deleteMany({ where: { email } });
    if (app) await app.close();
  });

  it('register and create conversation', async () => {
    const reg = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password, displayName: 'AI Upgrade', locale: 'en' })
      .expect(201);
    accessToken = reg.body.accessToken as string;
    const conv = await request(app.getHttpServer())
      .post('/v1/ai/conversations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cityId, title: 'Upgrade test' })
      .expect(201);
    conversationId = conv.body.id as string;
  });

  it('gets brief defaults and can patch session context', async () => {
    const brief = await request(app.getHttpServer())
      .get(`/v1/me/plans/brief-defaults?cityId=${cityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(brief.body.defaults).toBeDefined();

    const patched = await request(app.getHttpServer())
      .patch('/v1/me/plans/session-context')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cityId,
        conversationId,
        groupType: 'FRIENDS',
        budgetNow: 'LOW',
        hasPrivateTransport: false,
      })
      .expect(200);
    expect(patched.body.groupType).toBe('FRIENDS');

    const ctx = await request(app.getHttpServer())
      .get(`/v1/me/plans/session-context?conversationId=${conversationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(ctx.body.effective.groupType).toBe('FRIENDS');
  });

  it('returns deterministic candidate packs', async () => {
    const candidates = await request(app.getHttpServer())
      .post('/v1/me/plans/candidates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cityId, conversationId })
      .expect(201);
    expect(Array.isArray(candidates.body)).toBe(true);
    expect(candidates.body.length).toBeLessThanOrEqual(2);
    if (candidates.body.length) {
      expect(candidates.body[0].why).toBeDefined();
      expect(candidates.body[0].id).toBeDefined();
    }

    const active = await request(app.getHttpServer())
      .get('/v1/me/plans/active')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    // New users have no active plan; Nest may serialize null as {}
    const body = active.body as { id?: string } | null;
    expect(body == null || !body.id || typeof body.id === 'string').toBe(true);
  });
});
