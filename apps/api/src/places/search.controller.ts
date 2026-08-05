import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AudienceTag,
  VerificationStatus,
} from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AuthUser, CurrentUser } from '../auth/auth.decorators';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;
}

@Controller('v1/search')
export class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user?: AuthUser | null,
  ) {
    let blockAdultNightlife = false;
    if (user?.id) {
      const prefs = await this.prisma.userPreference.findUnique({
        where: { userId: user.id },
        select: { hardFiltersJson: true },
      });
      const hard = (prefs?.hardFiltersJson ?? {}) as Record<string, unknown>;
      blockAdultNightlife = Boolean(hard.blockAdultNightlife);
    }

    const q = query.q?.trim();
    const placeWhere = {
      verificationStatus: VerificationStatus.APPROVED,
      deletedAt: null as null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { summary: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(blockAdultNightlife
        ? { NOT: { audienceTags: { has: AudienceTag.ADULT_NIGHTLIFE } } }
        : {}),
    };

    const eventWhere = {
      verificationStatus: VerificationStatus.APPROVED,
      deletedAt: null as null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { summary: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [places, events] = await Promise.all([
      this.prisma.place.findMany({
        where: placeWhere,
        take: 30,
        orderBy: [
          { freshnessScore: 'desc' },
          { lastReviewedAt: 'desc' },
          { popularityScore: 'desc' },
          { name: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          summary: true,
          cityId: true,
          latitude: true,
          longitude: true,
          audienceTags: true,
          freshnessScore: true,
          lastReviewedAt: true,
          primaryCategory: {
            select: { id: true, key: true, name: true },
          },
        },
      }),
      this.prisma.event.findMany({
        where: eventWhere,
        take: 30,
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          summary: true,
          cityId: true,
          startsAt: true,
          endsAt: true,
          placeId: true,
        },
      }),
    ]);

    return {
      places: places.map((p) => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        freshnessScore:
          p.freshnessScore != null ? Number(p.freshnessScore) : null,
      })),
      events,
    };
  }
}
