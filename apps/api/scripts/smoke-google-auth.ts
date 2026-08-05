/**
 * One-off smoke for Google auth (mocked tokens).
 * Usage: pnpm exec ts-node -r tsconfig-paths/register scripts/smoke-google-auth.ts
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

function mockToken(sub: string, email: string, name: string) {
  return `mock:${Buffer.from(
    JSON.stringify({ sub, email, name, email_verified: true }),
  ).toString('base64url')}`;
}

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_AUTH_MOCK = '1';

  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  const suffix = Date.now();
  const email = `smoke_google_${suffix}@test.local`;
  const googleId = `smoke-sub-${suffix}`;
  const server = app.getHttpServer();

  const { default: request } = await import('supertest');

  const created = await request(server)
    .post('/v1/auth/google')
    .send({ idToken: mockToken(googleId, email, 'Smoke User'), locale: 'en' });
  if (created.status >= 400) {
    throw new Error(`create failed ${created.status}: ${JSON.stringify(created.body)}`);
  }
  if (!created.body.accessToken || created.body.user.role !== 'CLIENT') {
    throw new Error(`unexpected create body: ${JSON.stringify(created.body)}`);
  }

  const again = await request(server)
    .post('/v1/auth/google')
    .send({ idToken: mockToken(googleId, email, 'Smoke User') });
  if (again.status >= 400) {
    throw new Error(`login failed ${again.status}: ${JSON.stringify(again.body)}`);
  }

  const me = await request(server)
    .get('/v1/auth/me')
    .set('Authorization', `Bearer ${again.body.accessToken}`);
  if (me.status !== 200 || me.body.email !== email) {
    throw new Error(`me failed: ${JSON.stringify(me.body)}`);
  }

  await prisma.user.deleteMany({ where: { email } });
  await app.close();
  console.log('smoke-google-auth: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
