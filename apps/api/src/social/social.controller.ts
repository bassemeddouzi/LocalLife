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
  @IsString()
  @MaxLength(2000)
  details?: string;
}

@Controller('v1')
export class SocialController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('places/:id/reviews')
  async listReviews(
    @Param('id') placeId: string,
    @Query('page') pageQ?: string,
    @Query('pageSize') pageSizeQ?: string,
  ) {
    const place = await this.prisma.place.findFirst({
      where: {
        id: placeId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!place) throw new NotFoundException('Place not found');

    const page = clampPage(Number(pageQ));
    const pageSize = clampPageSize(Number(pageSizeQ));
    const where = {
      placeId,
      status: VerificationStatus.APPROVED,
      deletedAt: null,
    };
    const [total, data] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
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
    ]);
    return { data, meta: paginateMeta(total, page, pageSize) };
  }

  @Post('places/:id/reviews')
  @Auth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async upsertReview(
    @CurrentUser() user: AuthUser,
    @Param('id') placeId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const place = await this.prisma.place.findFirst({
      where: {
        id: placeId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!place) throw new NotFoundException('Place not found');

    return this.prisma.review.upsert({
      where: { placeId_userId: { placeId, userId: user.id } },
      create: {
        placeId,
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
    return this.prisma.report.create({
      data: {
        reporterUserId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
        status: ReportStatus.OPEN,
      },
    });
  }
}
