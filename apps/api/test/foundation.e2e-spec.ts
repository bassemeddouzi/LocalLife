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
  user: { role: string; email?: string };
};

type HealthBody = { status: string };
type AdminPingBody = { ok: boolean };
type ErrorBody = { requestId?: string };
type MeBody = { email: string };

describe('Foundation Gate (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const email = `user_${suffix}@test.local`;
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
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('GET /v1/health returns ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);
    const body = res.body as HealthBody;
    expect(body.status).toBe('ok');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /v1/health/ready returns ready', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200);
    const body = res.body as HealthBody;
    expect(body.status).toBe('ready');
  });

  it('register + login + me + refresh flow', async () => {
    const register = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password, displayName: 'Test User', locale: 'en' })
      .expect(201);

    const registerBody = register.body as AuthTokens;
    expect(registerBody.accessToken).toBeDefined();
    expect(registerBody.refreshToken).toBeDefined();
    expect(registerBody.user.role).toBe('CLIENT');

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);

    const loginBody = login.body as AuthTokens;

    const me = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);
    const meBody = me.body as MeBody;
    expect(meBody.email).toBe(email);

    const refreshed = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(201);
    const refreshedBody = refreshed.body as AuthTokens;
    expect(refreshedBody.accessToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email, password, displayName: 'Dup' })
      .expect(409);
  });

  it('me without token returns 401', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });

  it('CLIENT cannot access admin ping', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const loginBody = login.body as AuthTokens;

    await request(app.getHttpServer())
      .get('/v1/admin/ping')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(403);
  });

  it('ADMIN can access admin ping', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@locallife.local', password: 'Admin123!' })
      .expect(201);
    const loginBody = login.body as AuthTokens;

    const res = await request(app.getHttpServer())
      .get('/v1/admin/ping')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);
    const body = res.body as AdminPingBody;
    expect(body.ok).toBe(true);
  });

  it('invalid register payload returns 400 with requestId', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: 'bad', password: 'short' })
      .expect(400);
    const body = res.body as ErrorBody;
    expect(body.requestId).toBeDefined();
  });

  it('google auth create + login (mocked verifier)', async () => {
    const googleEmail = `google_${suffix}@test.local`;
    const googleId = `google-sub-${suffix}`;
    const makeMockToken = (sub: string, email: string, name: string) =>
      `mock:${Buffer.from(
        JSON.stringify({
          sub,
          email,
          name,
          email_verified: true,
        }),
      ).toString('base64url')}`;

    const created = await request(app.getHttpServer())
      .post('/v1/auth/google')
      .send({
        idToken: makeMockToken(googleId, googleEmail, 'Google Traveler'),
        locale: 'fr',
      })
      .expect(201);
    const createdBody = created.body as AuthTokens;
    expect(createdBody.accessToken).toBeDefined();
    expect(createdBody.user.role).toBe('CLIENT');
    expect(createdBody.user.email).toBe(googleEmail);

    const again = await request(app.getHttpServer())
      .post('/v1/auth/google')
      .send({
        idToken: makeMockToken(googleId, googleEmail, 'Google Traveler'),
      })
      .expect(201);
    const againBody = again.body as AuthTokens;
    expect(againBody.accessToken).toBeDefined();
    expect(againBody.user.email).toBe(googleEmail);

    const me = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${againBody.accessToken}`)
      .expect(200);
    expect((me.body as MeBody).email).toBe(googleEmail);

    await prisma.user.deleteMany({ where: { email: googleEmail } });
  });

  it('google auth rejects invalid mock token', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/google')
      .send({ idToken: 'mock:not-valid-base64!!!' })
      .expect(401);
  });
});
