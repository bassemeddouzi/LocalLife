import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from '@nestjs/common';
import {
  BusinessApplicationStatus,
  GuideApplicationStatus,
  PriceLevel,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';

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
    return this.prisma.guideProfile.findUnique({ where: { userId: user.id } });
  }

  @Post('tips')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async submitTip(@CurrentUser() user: AuthUser, @Body() dto: SubmitTipDto) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
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
    }
    if (dto.placeId) {
      const place = await this.prisma.place.findFirst({
        where: { id: dto.placeId, deletedAt: null },
      });
      if (!place) throw new BadRequestException('placeId not found');
    }
    return this.prisma.event.create({
      data: {
        cityId: dto.cityId,
        placeId: dto.placeId,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
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
        status: BusinessApplicationStatus.PENDING,
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
            verificationStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.howToGuide.findMany({
          where: { createdByUserId: user.id },
          select: {
            id: true,
            title: true,
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
            verificationStatus: true,
            createdAt: true,
            startsAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.experience.findMany({
          where: { createdByUserId: user.id, deletedAt: null },
          select: {
            id: true,
            title: true,
            verificationStatus: true,
            createdAt: true,
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
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
    return { places, tips, events, experiences, businessApplications };
  }
}
