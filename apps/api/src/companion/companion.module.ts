import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { NotificationsController } from './notifications.controller';
import { FreshnessJobsService } from './freshness-jobs.service';
import { FreshnessJobsController } from './freshness-jobs.controller';
import { PlanScoringService } from './plan-scoring.service';
import { PlanGeneratorService } from './plan-generator.service';
import { AiModule } from '../ai/ai.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [AiModule, WeatherModule],
  controllers: [
    PlansController,
    NotificationsController,
    FreshnessJobsController,
  ],
  providers: [FreshnessJobsService, PlanScoringService, PlanGeneratorService],
  exports: [FreshnessJobsService, PlanScoringService, PlanGeneratorService],
})
export class CompanionModule {}
