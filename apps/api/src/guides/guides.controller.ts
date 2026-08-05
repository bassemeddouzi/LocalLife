import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
} from '@nestjs/common';
import {
  BusinessApplicationStatus,
  GuideApplicationStatus,
  PriceLevel,
  PricingType,
  SafetyLevel,
  SubGuideApplicationStatus,
  TimeContext,
  UserRole,
  VerificationStatus,
  ZoneCharacter,
} from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertGuideCityInScope,
  assertGuidePointInScope,
  guideProfileScopeInclude,
  pointInScope,
  resolveGuideScope,
  scopeCircleGeoJson,
} from './guide-scope';

class ApplyGuideDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cityIds?: string[];
}

class UpdateMeDto {
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

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;
}

class SubmitTipDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryKey?: string;
}

class SubmitEventDto {
  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  placeId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prerequisites?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PriceLevel)
  priceLevel?: PriceLevel;
}

class ExperienceStepDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUUID()
  placeId?: string;
}

class SubmitExperienceDto {
  @IsUUID()
  cityId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(PriceLevel)
  priceLevel?: PriceLevel;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  audience?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceStepDto)
  steps?: ExperienceStepDto[];
}

class ProposeBusinessDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsUUID()
  baseCityId!: string;

  @IsUUID()
  primaryDistrictId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryKey?: string;
}

class ZoneSafetyDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  districtId?: string;

  @IsOptional()
  @IsUUID()
  hoodId?: string;

  @IsEnum(TimeContext)
  timeContext!: TimeContext;

  @IsEnum(SafetyLevel)
  safetyLevel!: SafetyLevel;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guideComment?: string;

  @IsOptional()
  @IsEnum(ZoneCharacter)
  zoneCharacter?: ZoneCharacter;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  howToArrive?: string;
}

class TransportScenarioDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fromLabel!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  toLabel!: string;

  /** One or more route steps; array or object accepted */
  @IsOptional()
  stepsJson?: Record<string, unknown> | unknown[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estCostMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estCostMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  estMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(PricingType, { each: true })
  pricingModes?: PricingType[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guideComment?: string;
}

class ProposeSubGuideDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  formationNote?: string;

  /** GeoJSON Polygon or Feature drawn inside main Guide zone */
  borderGeoJson!: Record<string, unknown>;
}

@Controller('v1/guides')
export class GuidesController {
  constructor(private readonly prisma: PrismaService) {}

  private async requireApprovedGuide(userId: string) {
    const profile = await this.prisma.guideProfile.findUnique({
      where: { userId },
    });
    if (!profile || profile.status !== GuideApplicationStatus.APPROVED) {
      throw new ForbiddenException('Guide not approved');
    }
    return profile;
  }

  @Post('apply')
  @Auth()
  async apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyGuideDto) {
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin cannot apply as guide');
    }
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'FF_GUIDE_SELF_APPLY' },
    });
    if (!flag?.enabledGlobal) {
      throw new ForbiddenException(
        'Guide self-apply is disabled — ask Admin to create your account',
      );
    }
    const existing = await this.prisma.guideProfile.findUnique({
      where: { userId: user.id },
    });
    if (existing?.status === GuideApplicationStatus.APPROVED) {
      return existing;
    }

    return this.prisma.guideProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: dto.bio,
        languages: dto.languages,
        status: GuideApplicationStatus.APPLIED,
      },
      update: {
        bio: dto.bio,
        languages: dto.languages,
        status: GuideApplicationStatus.APPLIED,
      },
    });
  }

  @Get('me')
  @Auth()
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.prisma.guideProfile.findUnique({
      where: { userId: user.id },
      include: guideProfileScopeInclude,
    });
    return profile;
  }

  @Get('me/zone')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async myZone(@CurrentUser() user: AuthUser) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
    }
    const profile = await this.prisma.guideProfile.findUnique({
      where: { userId: user.id },
      include: guideProfileScopeInclude,
    });
    if (!profile) {
      throw new ForbiddenException('Guide profile not found');
    }
    const scope = await resolveGuideScope(this.prisma, profile);
    const circleGeoJson = scopeCircleGeoJson(scope.center, scope.radiusMeters);

    const [places, events, businessApplications] = await Promise.all([
      this.prisma.place.findMany({
        where: { createdByUserId: user.id, deletedAt: null },
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          latitude: true,
          longitude: true,
        },
      }),
      this.prisma.event.findMany({
        where: { createdByUserId: user.id, deletedAt: null },
        select: {
          id: true,
          title: true,
          verificationStatus: true,
          placeId: true,
          place: {
            select: { latitude: true, longitude: true, name: true },
          },
        },
      }),
      this.prisma.businessApplication.findMany({
        where: { proposedByGuideUserId: user.id },
        select: {
          id: true,
          displayName: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      }),
    ]);

    const pins: Array<{
      id: string;
      kind: string;
      title: string;
      status: string;
      latitude: number;
      longitude: number;
    }> = [];

    for (const p of places) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (pointInScope(lat, lng, scope)) {
        pins.push({
          id: `place-${p.id}`,
          kind: 'place',
          title: p.name,
          status: p.verificationStatus,
          latitude: lat,
          longitude: lng,
        });
      }
    }
    for (const e of events) {
      if (!e.place) continue;
      const lat = Number(e.place.latitude);
      const lng = Number(e.place.longitude);
      if (pointInScope(lat, lng, scope)) {
        pins.push({
          id: `event-${e.id}`,
          kind: 'event',
          title: e.title,
          status: e.verificationStatus,
          latitude: lat,
          longitude: lng,
        });
      }
    }
    for (const a of businessApplications) {
      if (a.latitude == null || a.longitude == null) continue;
      const lat = Number(a.latitude);
      const lng = Number(a.longitude);
      if (pointInScope(lat, lng, scope)) {
        pins.push({
          id: `biz-${a.id}`,
          kind: 'business',
          title: a.displayName,
          status: a.status,
          latitude: lat,
          longitude: lng,
        });
      }
    }

    return {
      ...scope,
      circleGeoJson,
      pins,
    };
  }

  @Patch('me')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      if (dto.baseCityId !== undefined || dto.primaryDistrictId !== undefined) {
        throw new ForbiddenException(
          'Only Admin can change guide city/district assignment',
        );
      }
    }
    if (dto.baseCityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: dto.baseCityId },
      });
      if (!city) throw new BadRequestException('baseCityId not found');
    }
    if (dto.primaryDistrictId) {
      const district = await this.prisma.district.findUnique({
        where: { id: dto.primaryDistrictId },
      });
      if (!district) {
        throw new BadRequestException('primaryDistrictId not found');
      }
      const cityId = dto.baseCityId ?? (
        await this.prisma.guideProfile.findUnique({ where: { userId: user.id } })
      )?.baseCityId;
      if (cityId && district.cityId !== cityId) {
        throw new BadRequestException(
          'primaryDistrictId must belong to baseCityId',
        );
      }
    }
    if (dto.displayName?.trim()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { displayName: dto.displayName.trim() },
      });
    }
    return this.prisma.guideProfile.update({
      where: { userId: user.id },
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
      include: guideProfileScopeInclude,
    });
  }

  @Post('tips')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitTip(@CurrentUser() user: AuthUser, @Body() dto: SubmitTipDto) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      await assertGuideCityInScope(this.prisma, user.id, dto.cityId);
    }
    return this.prisma.howToGuide.create({
      data: {
        cityId: dto.cityId,
        title: dto.title,
        summary: dto.summary,
        categoryKey: dto.categoryKey ?? 'local_tip',
        verificationStatus: VerificationStatus.PENDING,
        createdByUserId: user.id,
      },
    });
  }

  @Post('events')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitEvent(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitEventDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      await assertGuideCityInScope(this.prisma, user.id, dto.cityId);
    }
    if (dto.placeId) {
      const place = await this.prisma.place.findFirst({
        where: { id: dto.placeId, deletedAt: null },
      });
      if (!place) throw new BadRequestException('placeId not found');
      if (user.role !== UserRole.ADMIN) {
        await assertGuidePointInScope(
          this.prisma,
          user.id,
          Number(place.latitude),
          Number(place.longitude),
        );
      }
    }
    return this.prisma.event.create({
      data: {
        cityId: dto.cityId,
        placeId: dto.placeId,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        prerequisites: dto.prerequisites,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        categoryId: dto.categoryId,
        priceLevel: dto.priceLevel,
        verificationStatus: VerificationStatus.PENDING,
        createdByUserId: user.id,
      },
    });
  }

  @Post('experiences')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitExperience(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitExperienceDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      await assertGuideCityInScope(this.prisma, user.id, dto.cityId);
    }
    return this.prisma.experience.create({
      data: {
        cityId: dto.cityId,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        priceLevel: dto.priceLevel,
        audience: dto.audience,
        verificationStatus: VerificationStatus.PENDING,
        createdByUserId: user.id,
        steps: dto.steps?.length
          ? {
              create: dto.steps.map((s, i) => ({
                stepOrder: i + 1,
                title: s.title,
                description: s.description,
                placeId: s.placeId,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  @Post('business-applications')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async proposeBusiness(
    @CurrentUser() user: AuthUser,
    @Body() dto: ProposeBusinessDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      await assertGuideCityInScope(this.prisma, user.id, dto.baseCityId);
      if (dto.latitude != null && dto.longitude != null) {
        await assertGuidePointInScope(
          this.prisma,
          user.id,
          dto.latitude,
          dto.longitude,
        );
      }
    }
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const pending = await this.prisma.businessApplication.findFirst({
      where: {
        email,
        status: BusinessApplicationStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('Pending application already exists for email');
    }
    const district = await this.prisma.district.findUnique({
      where: { id: dto.primaryDistrictId },
    });
    if (!district || district.cityId !== dto.baseCityId) {
      throw new BadRequestException(
        'primaryDistrictId must belong to baseCityId',
      );
    }
    return this.prisma.businessApplication.create({
      data: {
        proposedByGuideUserId: user.id,
        email,
        displayName: dto.displayName.trim(),
        baseCityId: dto.baseCityId,
        primaryDistrictId: dto.primaryDistrictId,
        note: dto.note,
        phone: dto.phone,
        addressText: dto.addressText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        photoUrl: dto.photoUrl,
        categoryKey: dto.categoryKey,
        status: BusinessApplicationStatus.PENDING,
      },
    });
  }

  @Post('zone-safety')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitZoneSafety(
    @CurrentUser() user: AuthUser,
    @Body() dto: ZoneSafetyDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      if (dto.cityId) {
        await assertGuideCityInScope(this.prisma, user.id, dto.cityId);
      }
    }
    return this.prisma.zoneSafetyAssessment.create({
      data: {
        cityId: dto.cityId,
        districtId: dto.districtId,
        hoodId: dto.hoodId,
        timeContext: dto.timeContext,
        safetyLevel: dto.safetyLevel,
        reason: dto.reason,
        guideComment: dto.guideComment,
        zoneCharacter: dto.zoneCharacter,
        howToArrive: dto.howToArrive,
        createdByUserId: user.id,
        verificationStatus: VerificationStatus.PENDING,
        lastReviewedAt: new Date(),
      },
    });
  }

  @Post('transport-scenarios')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitTransportScenario(
    @CurrentUser() user: AuthUser,
    @Body() dto: TransportScenarioDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
      if (dto.cityId) {
        await assertGuideCityInScope(this.prisma, user.id, dto.cityId);
      }
    }
    return this.prisma.transportScenario.create({
      data: {
        cityId: dto.cityId,
        fromLabel: dto.fromLabel,
        toLabel: dto.toLabel,
        stepsJson: (dto.stepsJson ?? [
          { order: 0, label: `${dto.fromLabel} → ${dto.toLabel}` },
        ]) as object,
        estCostMin: dto.estCostMin,
        estCostMax: dto.estCostMax,
        estMinutes: dto.estMinutes,
        pricingModes: dto.pricingModes ?? [],
        guideComment: dto.guideComment,
        createdByUserId: user.id,
        verificationStatus: VerificationStatus.PENDING,
        lastReviewedAt: new Date(),
      },
    });
  }

  @Get('me/submissions')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async mySubmissions(@CurrentUser() user: AuthUser) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
    }
    const [places, tips, events, experiences, businessApplications] =
      await Promise.all([
        this.prisma.place.findMany({
          where: { createdByUserId: user.id, deletedAt: null },
          select: {
            id: true,
            name: true,
            summary: true,
            verificationStatus: true,
            createdAt: true,
            latitude: true,
            longitude: true,
            addressText: true,
            phone: true,
            priceLevel: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.howToGuide.findMany({
          where: { createdByUserId: user.id },
          select: {
            id: true,
            title: true,
            summary: true,
            verificationStatus: true,
            createdAt: true,
            categoryKey: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.event.findMany({
          where: { createdByUserId: user.id, deletedAt: null },
          select: {
            id: true,
            title: true,
            summary: true,
            description: true,
            prerequisites: true,
            verificationStatus: true,
            createdAt: true,
            startsAt: true,
            endsAt: true,
            placeId: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.experience.findMany({
          where: { createdByUserId: user.id, deletedAt: null },
          select: {
            id: true,
            title: true,
            summary: true,
            description: true,
            verificationStatus: true,
            createdAt: true,
            audience: true,
            priceLevel: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.businessApplication.findMany({
          where: { proposedByGuideUserId: user.id },
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            note: true,
            phone: true,
            addressText: true,
            latitude: true,
            longitude: true,
            photoUrl: true,
            categoryKey: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const placeIds = [
      ...new Set(
        events
          .map((e) => e.placeId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const linkedPlaces = placeIds.length
      ? await this.prisma.place.findMany({
          where: { id: { in: placeIds }, deletedAt: null },
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        })
      : [];
    const placeById = new Map(
      linkedPlaces.map((p) => [
        p.id,
        {
          id: p.id,
          name: p.name,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
        },
      ]),
    );

    return {
      places: places.map((p) => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      })),
      tips,
      events: events.map((e) => ({
        ...e,
        place: e.placeId ? (placeById.get(e.placeId) ?? null) : null,
      })),
      experiences,
      businessApplications: businessApplications.map((a) => ({
        ...a,
        latitude: a.latitude != null ? Number(a.latitude) : null,
        longitude: a.longitude != null ? Number(a.longitude) : null,
      })),
    };
  }

  @Get('me/subguides')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async listSubGuides(@CurrentUser() user: AuthUser) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
    }
    return this.prisma.subGuideApplication.findMany({
      where: { mainGuideUserId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('me/subguides')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async proposeSubGuide(
    @CurrentUser() user: AuthUser,
    @Body() dto: ProposeSubGuideDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
    }
    const main = await this.prisma.guideProfile.findUnique({
      where: { userId: user.id },
    });
    if (!main) throw new ForbiddenException('Guide profile not found');
    if (main.parentGuideId) {
      throw new ForbiddenException('SubGuides cannot recruit other SubGuides');
    }
    if (!dto.borderGeoJson || typeof dto.borderGeoJson !== 'object') {
      throw new BadRequestException('borderGeoJson is required');
    }
    return this.prisma.subGuideApplication.create({
      data: {
        mainGuideUserId: user.id,
        email: dto.email.trim().toLowerCase(),
        displayName: dto.displayName.trim(),
        phone: dto.phone?.trim(),
        formationNote: dto.formationNote?.trim(),
        borderGeoJson: dto.borderGeoJson as object,
        status: SubGuideApplicationStatus.PENDING_ADMIN,
      },
    });
  }
}
