import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  FavoriteTargetType,
  RatingTargetType,
  ReportReasonCode,
  ReportStatus,
  ReportTargetType,
  VerificationStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { clampPage, clampPageSize, paginateMeta } from '../shared/pagination';
import { ProfileMemoryService } from '../ai/profile-memory.service';
import { AiFeatureFlagsService, AI_FEATURE_KEYS } from '../ai/ai-feature-flags.service';

class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}

class CreateClientRatingDto {
  @IsEnum(RatingTargetType)
  targetType!: RatingTargetType;

  @IsUUID()
  targetId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;
}

class CreateFavoriteDto {
  @IsEnum(FavoriteTargetType)
  targetType!: FavoriteTargetType;

  @IsUUID()
  targetId!: string;
}

class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @IsUUID()
  targetId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason!: string;

  @IsOptional()
  @IsEnum(ReportReasonCode)
  reasonCode?: ReportReasonCode;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

@Controller('v1')
export class SocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileMemory: ProfileMemoryService,
    private readonly featureFlags: AiFeatureFlagsService,
  ) {}

  private async assertRatingTarget(
    targetType: RatingTargetType,
    targetId: string,
  ) {
    if (targetType === RatingTargetType.PLACE) {
      const place = await this.prisma.place.findFirst({
        where: {
          id: targetId,
          verificationStatus: VerificationStatus.APPROVED,
          deletedAt: null,
        },
        select: { id: true, name: true },
      });
      if (!place) throw new NotFoundException('Place not found');
      return { label: place.name };
    }
    if (targetType === RatingTargetType.CITY) {
      const city = await this.prisma.city.findFirst({
        where: { id: targetId },
        select: { id: true, name: true },
      });
      if (!city) throw new NotFoundException('City not found');
      return { label: city.name };
    }
    if (
      targetType === RatingTargetType.DISTRICT ||
      targetType === RatingTargetType.ZONE
    ) {
      const district = await this.prisma.district.findFirst({
        where: { id: targetId },
        select: { id: true, name: true },
      });
      if (!district) throw new NotFoundException('District / zone not found');
      return { label: district.name };
    }
    if (targetType === RatingTargetType.TRANSPORT_SYSTEM) {
      const sys = await this.prisma.transportSystem.findFirst({
        where: {
          id: targetId,
          verificationStatus: VerificationStatus.APPROVED,
        },
        select: { id: true, name: true },
      });
      if (!sys) throw new NotFoundException('Transport system not found');
      return { label: sys.name };
    }
    throw new NotFoundException('Unknown rating target');
  }

  @Get('ratings')
  async listClientRatings(
    @Query('targetType') targetTypeQ?: string,
    @Query('targetId') targetId?: string,
    @Query('page') pageQ?: string,
    @Query('pageSize') pageSizeQ?: string,
  ) {
    if (
      !targetTypeQ ||
      !targetId ||
      !Object.values(RatingTargetType).includes(
        targetTypeQ as RatingTargetType,
      )
    ) {
      throw new NotFoundException('targetType and targetId required');
    }
    return this.fetchRatings(
      targetTypeQ as RatingTargetType,
      targetId,
      pageQ,
      pageSizeQ,
    );
  }

  @Post('ratings')
  @Auth()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async upsertClientRating(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClientRatingDto,
  ) {
    return this.saveRating(user, dto);
  }

  @Get('me/ratings')
  @Auth()
  async myRatings(@CurrentUser() user: AuthUser) {
    return this.prisma.clientRating.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get('places/:id/reviews')
  async listReviews(
    @Param('id') placeId: string,
    @Query('page') pageQ?: string,
    @Query('pageSize') pageSizeQ?: string,
  ) {
    return this.fetchRatings(
      RatingTargetType.PLACE,
      placeId,
      pageQ,
      pageSizeQ,
    );
  }

  @Post('places/:id/reviews')
  @Auth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async upsertReview(
    @CurrentUser() user: AuthUser,
    @Param('id') placeId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.saveRating(user, {
      targetType: RatingTargetType.PLACE,
      targetId: placeId,
      rating: dto.rating,
      title: dto.title,
      body: dto.body,
    });
  }

  private async fetchRatings(
    targetType: RatingTargetType,
    targetId: string,
    pageQ?: string,
    pageSizeQ?: string,
  ) {
    await this.assertRatingTarget(targetType, targetId);
    const page = clampPage(Number(pageQ));
    const pageSize = clampPageSize(Number(pageSizeQ));
    const where = {
      targetType,
      targetId,
      status: VerificationStatus.APPROVED,
      deletedAt: null,
    };
    const [total, data, agg] = await Promise.all([
      this.prisma.clientRating.count({ where }),
      this.prisma.clientRating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.clientRating.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    return {
      data,
      meta: paginateMeta(total, page, pageSize),
      summary: {
        average: agg._avg.rating
          ? Math.round(agg._avg.rating * 10) / 10
          : null,
        count: agg._count.rating,
      },
    };
  }

  private async saveRating(user: AuthUser, dto: CreateClientRatingDto) {
    await this.assertRatingTarget(dto.targetType, dto.targetId);
    const row = await this.prisma.clientRating.upsert({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
      create: {
        userId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: VerificationStatus.APPROVED,
      },
      update: {
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        deletedAt: null,
        status: VerificationStatus.APPROVED,
      },
    });

    if (dto.targetType === RatingTargetType.PLACE) {
      await this.prisma.review.upsert({
        where: { placeId_userId: { placeId: dto.targetId, userId: user.id } },
        create: {
          placeId: dto.targetId,
          userId: user.id,
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          status: VerificationStatus.APPROVED,
        },
        update: {
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          deletedAt: null,
          status: VerificationStatus.APPROVED,
        },
      });
    }

    const memoryOn = await this.featureFlags.isEnabled(
      AI_FEATURE_KEYS.profileMemory,
      user.id,
    );
    if (memoryOn) {
      const patch: Record<string, unknown> = {
        lastRatedTarget: `${dto.targetType}:${dto.targetId}`,
        lastRating: dto.rating,
      };
      if (dto.rating <= 2 && dto.body) {
        patch.dislikes = [dto.body.slice(0, 120)];
      }
      if (dto.rating >= 4 && dto.body) {
        patch.likes = [dto.body.slice(0, 120)];
      }
      await this.profileMemory.mergeProfileCard(user.id, patch);
    }

    return row;
  }

  @Get('me/favorites')
  @Auth()
  async myFavorites(@CurrentUser() user: AuthUser) {
    return this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('favorites')
  @Auth()
  async addFavorite(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.prisma.favorite.upsert({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
      create: {
        userId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
      update: {},
    });
  }

  @Delete('favorites/:id')
  @Auth()
  async removeFavorite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const fav = await this.prisma.favorite.findUnique({ where: { id } });
    if (!fav || fav.userId !== user.id) {
      throw new NotFoundException('Favorite not found');
    }
    await this.prisma.favorite.delete({ where: { id } });
    return { ok: true };
  }

  @Post('reports')
  @Auth()
  async createReport(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReportDto,
  ) {
    const reasonCode = dto.reasonCode ?? ReportReasonCode.OTHER;
    const report = await this.prisma.report.create({
      data: {
        reporterUserId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        reasonCode,
        details: dto.details,
        status: ReportStatus.OPEN,
      },
    });

    if (
      dto.targetType === ReportTargetType.PLACE &&
      (reasonCode === ReportReasonCode.CLOSED ||
        reasonCode === ReportReasonCode.INACCURATE)
    ) {
      const place = await this.prisma.place.findFirst({
        where: { id: dto.targetId, deletedAt: null },
        select: { id: true, name: true, createdByUserId: true },
      });
      if (place?.createdByUserId) {
        const title =
          reasonCode === ReportReasonCode.CLOSED
            ? `Report: ${place.name} may be closed`
            : `Report: ${place.name} may be inaccurate`;
        const body =
          reasonCode === ReportReasonCode.CLOSED
            ? 'A traveler reported this place as closed. Please review and update.'
            : 'A traveler reported inaccurate info. Please review and update.';
        const notification = await this.prisma.notification.create({
          data: {
            userId: place.createdByUserId,
            type: 'place_report',
            title,
            body,
            data: {
              placeId: place.id,
              reportId: report.id,
              reasonCode,
            },
          },
        });
        await this.prisma.avatarCue.create({
          data: {
            userId: place.createdByUserId,
            animationHint: 'alert',
            deepLink: `/guide/places/${place.id}`,
            title,
            body,
            notificationId: notification.id,
          },
        });
      }
    }

    return report;
  }
}
