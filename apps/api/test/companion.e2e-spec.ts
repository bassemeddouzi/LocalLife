import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';

describe('Companion Vision 2.0 (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  const suffix = Date.now();
  const email = `companion_${suffix}@test.local`;
  const password = 'TestPass123!';

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

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password,
        displayName: 'Companion Tester',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    accessToken = (login.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists client plans', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/me/plans')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test plan',
        steps: [{ freeText: 'First step', durationMin: 30 }],
      })
      .expect(201);
    expect((created.body as { id: string }).id).toBeDefined();

    const list = await request(app.getHttpServer())
      .get('/v1/me/plans')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect((list.body as unknown[]).length).toBeGreaterThan(0);
  });

  it('lists avatar cues and plan packs', async () => {
    await request(app.getHttpServer())
      .get('/v1/me/avatar-cues')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/v1/me/plan-packs')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('search endpoint responds', async () => {
    await request(app.getHttpServer())
      .get('/v1/search?q=test')
      .expect(200);
  });
});
