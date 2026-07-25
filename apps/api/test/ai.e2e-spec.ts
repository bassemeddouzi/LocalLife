import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type AuthTokens = {
  accessToken: string;
  user: { id: string; role: string };
};

describe('AI Grounding Gate (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cityId = '';
  let userAToken = '';
  let userBToken = '';
  let adminToken = '';
  const suffix = Date.now();

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
    if (!city) throw new Error('Djerba missing — run prisma:seed');
    cityId = city.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@locallife.local', password: 'Admin123!' })
      .expect(201);
    adminToken = (adminLogin.body as AuthTokens).accessToken;

    const a = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: `ai_a_${suffix}@test.local`,
        password: 'TestPass123!',
        displayName: 'AI User A',
      })
      .expect(201);
    userAToken = (a.body as AuthTokens).accessToken;

    const b = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: `ai_b_${suffix}@test.local`,
        password: 'TestPass123!',
        displayName: 'AI User B',
      })
      .expect(201);
    userBToken = (b.body as AuthTokens).accessToken;
  });

  afterAll(async () => {
    await prisma.messageCitation.deleteMany({
      where: {
        message: {
          conversation: {
            user: { email: { contains: `ai_a_${suffix}` } },
          },
        },
      },
    });
    await prisma.message.deleteMany({
      where: {
        conversation: {
          user: { email: { contains: `_` + `${suffix}@test.local` } },
        },
      },
    });
    // simpler cleanup by email prefix
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [`ai_a_${suffix}@test.local`, `ai_b_${suffix}@test.local`],
        },
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await prisma.report.deleteMany({
      where: { reporterUserId: { in: userIds } },
    });
    await prisma.aiActionLog.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.messageCitation.deleteMany({
      where: {
        message: { conversation: { userId: { in: userIds } } },
      },
    });
    await prisma.message.deleteMany({
      where: { conversation: { userId: { in: userIds } } },
    });
    await prisma.conversation.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  async function ask(token: string, content: string) {
    const conv = await request(app.getHttpServer())
      .post('/v1/ai/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ cityId, title: content.slice(0, 40) })
      .expect(201);
    const conversationId = (conv.body as { id: string }).id;

    const msg = await request(app.getHttpServer())
      .post(`/v1/ai/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content, cityId })
      .expect(201);

    return {
      conversationId,
      body: msg.body as {
        message: {
          id: string;
          content: string;
          citations: Array<{ entityType: string; entityId: string }>;
        };
        grounding: string;
        meta: { modelId: string; mode: string };
      },
    };
  }

  it('airport first hour returns arrival citations', async () => {
    const { body } = await ask(
      userAToken,
      'What should I do in my first hour after landing at Djerba airport?',
    );
    expect(body.grounding).toBe('grounded');
    expect(body.message.citations.length).toBeGreaterThanOrEqual(1);
    expect(
      body.message.citations.some((c) => c.entityType === 'arrival_guide'),
    ).toBe(true);
    expect(body.message.content.toLowerCase()).toMatch(/sim|taxi|cash|atm/);
  });

  it('airport → Midoun transport includes payment info', async () => {
    const { body } = await ask(
      userAToken,
      'How do I get from the airport to Midoun by taxi and how do I pay?',
    );
    expect(
      body.message.citations.some((c) => c.entityType === 'transport_system'),
    ).toBe(true);
    expect(body.message.content.toLowerCase()).toMatch(/taxi|cash|payment|tnd/);
  });

  it('pharmacy question cites APPROVED pharmacy places', async () => {
    const { body } = await ask(
      userAToken,
      'Where is a pharmacy in Houmt Souk?',
    );
    expect(body.message.citations.some((c) => c.entityType === 'place')).toBe(
      true,
    );
    const placeIds = body.message.citations
      .filter((c) => c.entityType === 'place')
      .map((c) => c.entityId);
    const places = await prisma.place.findMany({
      where: { id: { in: placeIds } },
      include: { primaryCategory: true },
    });
    expect(places.every((p) => p.verificationStatus === 'APPROVED')).toBe(true);
    expect(places.some((p) => p.primaryCategory?.key === 'pharmacies')).toBe(
      true,
    );
  });

  it('unknown place does not invent a venue name', async () => {
    const { body } = await ask(
      userAToken,
      'Does the Unicorn Castle Atlantis Disco exist in Djerba?',
    );
    expect(body.grounding).toBe('fallback');
    expect(body.message.content.toLowerCase()).toMatch(
      /could not find|do not invent|no verified|not find/,
    );
    expect(body.message.content).not.toMatch(/located at|open daily at/i);
  });

  it('user B cannot read user A conversation', async () => {
    const { conversationId } = await ask(
      userAToken,
      'Safety tips for Djerba nights',
    );
    await request(app.getHttpServer())
      .get(`/v1/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(403);
  });

  it('ADMIN can update AiModelConfig; CLIENT cannot', async () => {
    await request(app.getHttpServer())
      .patch('/v1/admin/ai-config')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ modelId: 'openai/gpt-4o-mini' })
      .expect(403);

    const updated = await request(app.getHttpServer())
      .patch('/v1/admin/ai-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ modelId: 'openai/gpt-4o-mini', enabled: true })
      .expect(200);
    expect((updated.body as { modelId: string }).modelId).toBe(
      'openai/gpt-4o-mini',
    );
    expect(
      (updated.body as { apiKeyConfigured: boolean }).apiKeyConfigured,
    ).toBeDefined();

    const { body } = await ask(userAToken, 'Djerba survival kit for 48 hours');
    expect(body.meta.modelId).toBeTruthy();
  });

  it('can report an assistant message', async () => {
    const { body } = await ask(userAToken, 'Emergency numbers in Tunisia?');
    const report = await request(app.getHttpServer())
      .post('/v1/ai/feedback')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        messageId: body.message.id,
        reason: 'unclear answer',
      })
      .expect(201);
    expect((report.body as { status: string }).status).toBe('OPEN');
  });
});
