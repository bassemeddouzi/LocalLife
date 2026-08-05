import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { AdminModule } from './admin/admin.module';
import { GeoModule } from './geo/geo.module';
import { PlacesModule } from './places/places.module';
import { SocialModule } from './social/social.module';
import { GuidesModule } from './guides/guides.module';
import { BusinessModule } from './business/business.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AiModule } from './ai/ai.module';
import { MediaModule } from './media/media.module';
import { CompanionModule } from './companion/companion.module';
import { WeatherModule } from './weather/weather.module';
import { CacheModule } from './shared/cache.module';
import { RequestIdMiddleware } from './shared/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 120),
      },
    ]),
    CacheModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    GeoModule,
    PlacesModule,
    SocialModule,
    GuidesModule,
    BusinessModule,
    KnowledgeModule,
    AiModule,
    MediaModule,
    CompanionModule,
    WeatherModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
