import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from '@nestjs/common';
import {
  GuideApplicationStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
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
      },
    });
  }

  @Get('me/submissions')
  @Auth(UserRole.GUIDE, UserRole.ADMIN)
  async mySubmissions(@CurrentUser() user: AuthUser) {
    if (user.role !== UserRole.ADMIN) {
      await this.requireApprovedGuide(user.id);
    }
    const places = await this.prisma.place.findMany({
      where: { createdByUserId: user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Tips are not user-linked in schema yet — return places for MVP
    return { places, tips: [] as unknown[] };
  }
}
