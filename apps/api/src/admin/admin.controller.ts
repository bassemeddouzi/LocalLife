import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ClaimStatus,
  GuideApplicationStatus,
  ReportStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../shared/audit.service';
import { MemoryCacheService } from '../shared/memory-cache.service';
import type { Request } from 'express';

class RejectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

class ResolveReportDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}

@Controller('v1/admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly cache: MemoryCacheService,
  ) {}

  @Get('ping')
  @Auth(UserRole.ADMIN)
  ping() {
    return { ok: true, scope: 'admin' };
  }

  @Get('moderation/queue')
  @Auth(UserRole.ADMIN)
  async queue(@Query('type') type?: string) {
    const [places, reviews, tips, reports, guideApps, claims] =
      await Promise.all([
        !type || type === 'place'
          ? this.prisma.place.findMany({
              where: {
                verificationStatus: VerificationStatus.PENDING,
                deletedAt: null,
              },
              take: 100,
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                name: true,
                cityId: true,
                verificationStatus: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
        !type || type === 'review'
          ? this.prisma.review.findMany({
              where: {
                status: VerificationStatus.PENDING,
                deletedAt: null,
              },
              take: 100,
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        !type || type === 'tip'
          ? this.prisma.howToGuide.findMany({
              where: { verificationStatus: VerificationStatus.PENDING },
              take: 100,
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        !type || type === 'report'
          ? this.prisma.report.findMany({
              where: { status: ReportStatus.OPEN },
              take: 100,
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        !type || type === 'guide'
          ? this.prisma.guideProfile.findMany({
              where: {
                status: {
                  in: [
                    GuideApplicationStatus.APPLIED,
                    GuideApplicationStatus.UNDER_REVIEW,
                  ],
                },
              },
              take: 100,
              include: {
                user: {
                  select: { id: true, email: true, displayName: true },
                },
              },
            })
          : Promise.resolve([]),
        !type || type === 'claim'
          ? this.prisma.businessPlaceClaim.findMany({
              where: { status: ClaimStatus.PENDING },
              take: 100,
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
      ]);

    return { places, reviews, tips, reports, guideApps, claims };
  }

  @Post('content/:type/:id/approve')
  @Auth(UserRole.ADMIN)
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('type') type: string,
    @Param('id') id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.decide(user, type, id, 'approve', undefined, req.requestId);
  }

  @Post('content/:type/:id/reject')
  @Auth(UserRole.ADMIN)
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.decide(user, type, id, 'reject', dto.reason, req.requestId);
  }

  @Post('reports/:id/resolve')
  @Auth(UserRole.ADMIN)
  async resolveReport(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @Req() req: Request & { requestId?: string },
  ) {
    if (
      dto.status !== ReportStatus.RESOLVED &&
      dto.status !== ReportStatus.DISMISSED
    ) {
      throw new NotFoundException('Invalid resolution status');
    }
    const before = await this.prisma.report.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Report not found');
    const after = await this.prisma.report.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        resolvedByAdminId: user.id,
      },
    });
    await this.audit.log({
      actorUserId: user.id,
      action: `report.${dto.status.toLowerCase()}`,
      entityType: 'report',
      entityId: id,
      beforeJson: before,
      afterJson: after,
      requestId: req.requestId,
    });
    return after;
  }

  private async decide(
    user: AuthUser,
    type: string,
    id: string,
    decision: 'approve' | 'reject',
    reason?: string,
    requestId?: string,
  ) {
    const approved = decision === 'approve';
    const status = approved
      ? VerificationStatus.APPROVED
      : VerificationStatus.REJECTED;

    if (type === 'place') {
      const before = await this.prisma.place.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Place not found');
      const after = await this.prisma.place.update({
        where: { id },
        data: {
          verificationStatus: status,
          publishedAt: approved ? new Date() : null,
          metadata: reason
            ? { ...(before.metadata as object), rejectReason: reason }
            : (before.metadata ?? undefined),
        },
      });
      await this.audit.log({
        actorUserId: user.id,
        action: `place.${decision}`,
        entityType: 'place',
        entityId: id,
        beforeJson: {
          verificationStatus: before.verificationStatus,
        },
        afterJson: { verificationStatus: after.verificationStatus, reason },
        requestId,
      });
      this.cache.delPrefix('transport:');
      this.cache.delPrefix('geo:');
      return after;
    }

    if (type === 'review') {
      const before = await this.prisma.review.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Review not found');
      const after = await this.prisma.review.update({
        where: { id },
        data: { status },
      });
      await this.audit.log({
        actorUserId: user.id,
        action: `review.${decision}`,
        entityType: 'review',
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: after.status, reason },
        requestId,
      });
      return after;
    }

    if (type === 'tip') {
      const before = await this.prisma.howToGuide.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Tip not found');
      const after = await this.prisma.howToGuide.update({
        where: { id },
        data: { verificationStatus: status },
      });
      await this.audit.log({
        actorUserId: user.id,
        action: `tip.${decision}`,
        entityType: 'tip',
        entityId: id,
        beforeJson: { verificationStatus: before.verificationStatus },
        afterJson: { verificationStatus: after.verificationStatus, reason },
        requestId,
      });
      return after;
    }

    if (type === 'guide') {
      const before = await this.prisma.guideProfile.findUnique({
        where: { id },
      });
      if (!before) throw new NotFoundException('Guide application not found');
      const after = await this.prisma.guideProfile.update({
        where: { id },
        data: {
          status: approved
            ? GuideApplicationStatus.APPROVED
            : GuideApplicationStatus.REJECTED,
        },
      });
      if (approved) {
        await this.prisma.user.update({
          where: { id: before.userId },
          data: { role: UserRole.GUIDE },
        });
      }
      await this.audit.log({
        actorUserId: user.id,
        action: `guide.${decision}`,
        entityType: 'guide',
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: after.status, reason },
        requestId,
      });
      return after;
    }

    if (type === 'claim') {
      const before = await this.prisma.businessPlaceClaim.findUnique({
        where: { id },
      });
      if (!before) throw new NotFoundException('Claim not found');
      const after = await this.prisma.businessPlaceClaim.update({
        where: { id },
        data: {
          status: approved ? ClaimStatus.VERIFIED : ClaimStatus.REJECTED,
          reviewedByAdminId: user.id,
          reviewedAt: new Date(),
        },
      });
      if (approved) {
        await this.prisma.place.update({
          where: { id: before.placeId },
          data: { ownedByBusinessId: before.businessId },
        });
      }
      await this.audit.log({
        actorUserId: user.id,
        action: `claim.${decision}`,
        entityType: 'claim',
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: after.status, reason },
        requestId,
      });
      return after;
    }

    throw new NotFoundException(`Unknown content type: ${type}`);
  }

  @Get('users')
  @Auth(UserRole.ADMIN)
  async listUsers(@Query('role') role?: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role ? { role: role as UserRole } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        locale: true,
        createdAt: true,
        lastLoginAt: true,
        guideProfile: { select: { id: true, status: true } },
        businessProfile: {
          select: { id: true, displayName: true, verificationStatus: true },
        },
      },
    });
  }

  @Get('feature-flags')
  @Auth(UserRole.ADMIN)
  listFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  @Post('feature-flags/:key')
  @Auth(UserRole.ADMIN)
  async upsertFlag(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string,
    @Body()
    body: { enabledGlobal?: boolean; description?: string },
    @Req() req: Request & { requestId?: string },
  ) {
    const before = await this.prisma.featureFlag.findUnique({ where: { key } });
    const after = await this.prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        description: body.description ?? key,
        enabledGlobal: body.enabledGlobal ?? false,
      },
      update: {
        ...(body.enabledGlobal !== undefined
          ? { enabledGlobal: body.enabledGlobal }
          : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
      },
    });
    await this.audit.log({
      actorUserId: user.id,
      action: 'feature_flag.upsert',
      entityType: 'feature_flag',
      entityId: key,
      beforeJson: before ?? undefined,
      afterJson: after,
      requestId: req.requestId,
    });
    return after;
  }

  @Get('seed-status')
  @Auth(UserRole.ADMIN)
  async seedStatus() {
    const [countries, cities, places, transport, arrival, rules] =
      await Promise.all([
        this.prisma.country.count(),
        this.prisma.city.count({ where: { status: 'ACTIVE' } }),
        this.prisma.place.count({
          where: { verificationStatus: VerificationStatus.APPROVED },
        }),
        this.prisma.transportSystem.count({
          where: { verificationStatus: VerificationStatus.APPROVED },
        }),
        this.prisma.arrivalGuide.count({
          where: { verificationStatus: VerificationStatus.APPROVED },
        }),
        this.prisma.localRule.count({
          where: { verificationStatus: VerificationStatus.APPROVED },
        }),
      ]);
    return {
      countries,
      activeCities: cities,
      approvedPlaces: places,
      transportSystems: transport,
      arrivalGuides: arrival,
      localRules: rules,
      hint: 'Reseed with: pnpm --filter @locallife/api prisma:seed',
      supportFormUrl:
        process.env.SUPPORT_FORM_URL ??
        'https://forms.gle/locallife-support-placeholder',
    };
  }
}
