import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  BadRequestException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ClaimStatus,
  GuideApplicationStatus,
  ReportStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../shared/audit.service';
import { MemoryCacheService } from '../shared/memory-cache.service';
import { zoneForCitySlug } from './city-zones';
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

class CreateGuideDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsUUID()
  baseCityId!: string;

  @IsUUID()
  primaryDistrictId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}

class UpdateGuideDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsUUID()
  baseCityId?: string;

  @IsOptional()
  @IsUUID()
  primaryDistrictId?: string;
}

class CreateBusinessDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  legalName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

function tempPassword() {
  return `Ll-${randomBytes(5).toString('base64url')}!`;
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
  async listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role ? { role: role as UserRole } : {}),
        ...(status ? { status: status as UserStatus } : {}),
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
        guideProfile: {
          select: {
            id: true,
            status: true,
            languages: true,
            baseCityId: true,
            primaryDistrictId: true,
            baseCity: { select: { id: true, name: true, slug: true } },
            primaryDistrict: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        businessProfile: {
          select: { id: true, displayName: true, verificationStatus: true },
        },
      },
    });
  }

  @Post('users/:id/suspend')
  @Auth(UserRole.ADMIN)
  async suspendUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    if (id === admin.id) {
      throw new ForbiddenException('Cannot suspend yourself');
    }
    const before = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('User not found');
    if (before.role === UserRole.ADMIN) {
      const activeAdmins = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
      });
      if (activeAdmins <= 1) {
        throw new ForbiddenException('Cannot suspend the last active admin');
      }
    }
    const after = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      actorUserId: admin.id,
      action: 'user.suspend',
      entityType: 'user',
      entityId: id,
      beforeJson: { status: before.status },
      afterJson: { status: after.status },
      requestId: req.requestId,
    });
    return {
      id: after.id,
      email: after.email,
      role: after.role,
      status: after.status,
    };
  }

  @Post('users/:id/reactivate')
  @Auth(UserRole.ADMIN)
  async reactivateUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    const before = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('User not found');
    const after = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });
    await this.audit.log({
      actorUserId: admin.id,
      action: 'user.reactivate',
      entityType: 'user',
      entityId: id,
      beforeJson: { status: before.status },
      afterJson: { status: after.status },
      requestId: req.requestId,
    });
    return {
      id: after.id,
      email: after.email,
      role: after.role,
      status: after.status,
    };
  }

  @Post('guides')
  @Auth(UserRole.ADMIN)
  async createGuide(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateGuideDto,
    @Req() req: Request & { requestId?: string },
  ) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const district = await this.prisma.district.findUnique({
      where: { id: dto.primaryDistrictId },
    });
    if (!district || district.cityId !== dto.baseCityId) {
      throw new BadRequestException(
        'primaryDistrictId must belong to baseCityId',
      );
    }
    const city = await this.prisma.city.findUnique({
      where: { id: dto.baseCityId },
    });
    if (!city) throw new BadRequestException('baseCityId not found');

    const password = tempPassword();
    const passwordHash = await argon2.hash(password);
    const languages = dto.languages?.length ? dto.languages : ['en', 'fr'];
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: dto.displayName.trim(),
        role: UserRole.GUIDE,
        passwordHash,
        status: UserStatus.ACTIVE,
        preference: { create: {} },
        guideProfile: {
          create: {
            bio: dto.bio,
            languages,
            status: GuideApplicationStatus.APPROVED,
            baseCityId: dto.baseCityId,
            primaryDistrictId: dto.primaryDistrictId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        guideProfile: {
          select: {
            id: true,
            status: true,
            languages: true,
            baseCityId: true,
            primaryDistrictId: true,
            baseCity: { select: { id: true, name: true, slug: true } },
            primaryDistrict: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });
    await this.audit.log({
      actorUserId: admin.id,
      action: 'guide.create',
      entityType: 'user',
      entityId: user.id,
      afterJson: {
        email: user.email,
        role: user.role,
        baseCityId: dto.baseCityId,
        primaryDistrictId: dto.primaryDistrictId,
      },
      requestId: req.requestId,
    });
    return { user, temporaryPassword: password };
  }

  @Patch('guides/:id')
  @Auth(UserRole.ADMIN)
  async updateGuide(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGuideDto,
    @Req() req: Request & { requestId?: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.GUIDE, deletedAt: null },
      include: { guideProfile: true },
    });
    if (!user?.guideProfile) throw new NotFoundException('Guide not found');

    const nextCityId = dto.baseCityId ?? user.guideProfile.baseCityId;
    const nextDistrictId =
      dto.primaryDistrictId ?? user.guideProfile.primaryDistrictId;

    if (dto.baseCityId || dto.primaryDistrictId) {
      if (!nextCityId || !nextDistrictId) {
        throw new BadRequestException(
          'baseCityId and primaryDistrictId are both required when updating location',
        );
      }
      const district = await this.prisma.district.findUnique({
        where: { id: nextDistrictId },
      });
      if (!district || district.cityId !== nextCityId) {
        throw new BadRequestException(
          'primaryDistrictId must belong to baseCityId',
        );
      }
    }

    const before = user.guideProfile;
    const after = await this.prisma.guideProfile.update({
      where: { userId: id },
      data: {
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.languages !== undefined ? { languages: dto.languages } : {}),
        ...(dto.baseCityId !== undefined
          ? { baseCityId: dto.baseCityId }
          : {}),
        ...(dto.primaryDistrictId !== undefined
          ? { primaryDistrictId: dto.primaryDistrictId }
          : {}),
      },
      include: {
        baseCity: { select: { id: true, name: true, slug: true } },
        primaryDistrict: {
          select: {
            id: true,
            name: true,
            slug: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
    await this.audit.log({
      actorUserId: admin.id,
      action: 'guide.update',
      entityType: 'guide',
      entityId: id,
      beforeJson: {
        baseCityId: before.baseCityId,
        primaryDistrictId: before.primaryDistrictId,
      },
      afterJson: {
        baseCityId: after.baseCityId,
        primaryDistrictId: after.primaryDistrictId,
      },
      requestId: req.requestId,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        guideProfile: after,
      },
    };
  }

  @Get('guides/:id')
  @Auth(UserRole.ADMIN)
  async guideDetail(@Param('id') id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.GUIDE, deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        guideProfile: {
          include: {
            baseCity: { select: { id: true, name: true, slug: true } },
            primaryDistrict: {
              select: {
                id: true,
                name: true,
                slug: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Guide not found');
    const places = await this.prisma.place.findMany({
      where: { createdByUserId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
    const placeCount = await this.prisma.place.count({
      where: { createdByUserId: id, deletedAt: null },
    });
    return {
      user,
      historic: {
        placeCount,
        tipCount: 0,
        recentPlaces: places,
        recentTips: [] as unknown[],
      },
    };
  }

  @Post('businesses')
  @Auth(UserRole.ADMIN)
  async createBusiness(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateBusinessDto,
    @Req() req: Request & { requestId?: string },
  ) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const password = tempPassword();
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: dto.displayName.trim(),
        role: UserRole.BUSINESS,
        passwordHash,
        status: UserStatus.ACTIVE,
        preference: { create: {} },
        businessProfile: {
          create: {
            displayName: dto.displayName.trim(),
            legalName: dto.legalName,
            contactEmail: dto.contactEmail ?? email,
            verificationStatus: VerificationStatus.APPROVED,
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        businessProfile: {
          select: { id: true, displayName: true, verificationStatus: true },
        },
      },
    });
    await this.audit.log({
      actorUserId: admin.id,
      action: 'business.create',
      entityType: 'user',
      entityId: user.id,
      afterJson: { email: user.email, role: user.role },
      requestId: req.requestId,
    });
    return { user, temporaryPassword: password };
  }

  @Get('businesses/:id')
  @Auth(UserRole.ADMIN)
  async businessDetail(@Param('id') id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.BUSINESS, deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        businessProfile: true,
      },
    });
    if (!user?.businessProfile) {
      throw new NotFoundException('Business not found');
    }
    const claims = await this.prisma.businessPlaceClaim.findMany({
      where: { businessId: user.businessProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        place: { select: { id: true, name: true } },
      },
    });
    const ownedPlaces = await this.prisma.place.findMany({
      where: {
        ownedByBusinessId: user.businessProfile.id,
        deletedAt: null,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, verificationStatus: true },
    });
    return {
      user,
      historic: {
        claimCount: await this.prisma.businessPlaceClaim.count({
          where: { businessId: user.businessProfile.id },
        }),
        ownedPlaceCount: ownedPlaces.length,
        recentClaims: claims,
        ownedPlaces,
      },
    };
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

  @Get('map-overview')
  @Auth(UserRole.ADMIN)
  async mapOverview() {
    const [cities, guidePlaces, businessPlaces, guideProfiles] =
      await Promise.all([
        this.prisma.city.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            latitude: true,
            longitude: true,
            status: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.place.findMany({
          where: {
            deletedAt: null,
            createdBy: { role: UserRole.GUIDE },
          },
          take: 500,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            verificationStatus: true,
            cityId: true,
            createdByUserId: true,
            createdBy: {
              select: { id: true, displayName: true, email: true },
            },
          },
        }),
        this.prisma.place.findMany({
          where: {
            deletedAt: null,
            ownedByBusinessId: { not: null },
          },
          take: 500,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            verificationStatus: true,
            cityId: true,
            ownedByBusinessId: true,
            ownedByBusiness: {
              select: { id: true, displayName: true },
            },
          },
        }),
        this.prisma.guideProfile.findMany({
          where: {
            user: { deletedAt: null, role: UserRole.GUIDE },
            OR: [
              { primaryDistrictId: { not: null } },
              { baseCityId: { not: null } },
            ],
          },
          take: 500,
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                status: true,
              },
            },
            baseCity: {
              select: {
                id: true,
                name: true,
                slug: true,
                latitude: true,
                longitude: true,
              },
            },
            primaryDistrict: {
              select: {
                id: true,
                name: true,
                slug: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        }),
      ]);

    return {
      activeCities: cities.map((c) => {
        const zone = zoneForCitySlug(c.slug);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          latitude: c.latitude != null ? Number(c.latitude) : null,
          longitude: c.longitude != null ? Number(c.longitude) : null,
          status: c.status,
          zone: zone
            ? {
                center: zone.center,
                zoom: zone.zoom,
                polygon: zone.polygon,
              }
            : null,
        };
      }),
      guides: guideProfiles
        .map((g) => {
          const lat = g.primaryDistrict
            ? Number(g.primaryDistrict.latitude)
            : g.baseCity?.latitude != null
              ? Number(g.baseCity.latitude)
              : null;
          const lng = g.primaryDistrict
            ? Number(g.primaryDistrict.longitude)
            : g.baseCity?.longitude != null
              ? Number(g.baseCity.longitude)
              : null;
          if (lat == null || lng == null) return null;
          return {
            userId: g.userId,
            displayName: g.user.displayName,
            email: g.user.email,
            status: g.user.status,
            latitude: lat,
            longitude: lng,
            districtId: g.primaryDistrict?.id ?? null,
            districtName: g.primaryDistrict?.name ?? 'Unassigned zone',
            cityId: g.baseCity?.id ?? null,
            citySlug: g.baseCity?.slug ?? null,
            cityName: g.baseCity?.name ?? null,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g != null),
      guidePlaces: guidePlaces.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        verificationStatus: p.verificationStatus,
        cityId: p.cityId,
        kind: 'guide' as const,
        guide: p.createdBy
          ? {
              userId: p.createdBy.id,
              displayName: p.createdBy.displayName,
              email: p.createdBy.email,
            }
          : null,
      })),
      businessPlaces: businessPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        verificationStatus: p.verificationStatus,
        cityId: p.cityId,
        kind: 'business' as const,
        business: p.ownedByBusiness
          ? {
              id: p.ownedByBusiness.id,
              displayName: p.ownedByBusiness.displayName,
            }
          : null,
      })),
    };
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
