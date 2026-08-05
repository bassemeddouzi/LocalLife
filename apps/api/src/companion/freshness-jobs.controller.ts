import { Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth } from '../auth/auth.decorators';
import { FreshnessJobsService } from './freshness-jobs.service';

@Controller('v1/admin/jobs')
export class FreshnessJobsController {
  constructor(private readonly jobs: FreshnessJobsService) {}

  @Post('guide-refresh-nudge')
  @Auth(UserRole.ADMIN)
  nudge() {
    return this.jobs.runMonthlyGuideRefreshNudge();
  }

  @Post('recompute-freshness')
  @Auth(UserRole.ADMIN)
  recompute() {
    return this.jobs.recomputePlaceFreshnessScores();
  }
}
