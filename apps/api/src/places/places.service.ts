import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SourceType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.decorators';
import {
  clampPage,
  clampPageSize,
  haversineMeters,
  paginateMeta,
  slugify,
} from '../shared/pagination';
import {
  AddPhotoDto,
  CreatePlaceDto,
  ListPlacesQueryDto,
  PlaceHourDto,
  UpdatePlaceDto,
} from './dto/places.dto';
import { assertGuidePointInScope } from '../guides/guide-scope';

const publicSelect = {
  id: true,
  cityId: true,
  slug: true,
  name: true,
  summary: true,
  description: true,
  latitude: true,
  longitude: true,
  addressText: true,
  phone: true,
  website: true,
  priceLevel: true,
  primaryCategoryId: true,
  verificationStatus: true,
  sourceType: true,
  isSponsored: true,
  sponsoredUntil: true,
  trustScore: true,
  popularityScore: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  audienceTags: true,
  typicalDurationMin: true,
  effortLevel: true,
  budgetBand: true,
  guideComment: true,
  lastReviewedAt: true,
  freshnessScore: true,
  accessDifficulty: true,
  paidEntry: true,
  prerequisitesText: true,
  precautionsText: true,
  checklistJson: true,
  bestArriveText: true,
  bestLeaveText: true,
  seasonNote: true,
  facebookUrl: true,
  instagramUrl: true,
  ticketUrl: true,
  ticketHowTo: true,
  ticketPriceText: true,
  primaryCategory: { select: { id: true, key: true, name: true, icon: true } },
  photos: {
    where: { status: VerificationStatus.APPROVED },
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, url: true, caption: true, sortOrder: true },
  },
  hours: {
    orderBy: { dayOfWeek: 'asc' as const },
    select: {
      id: true,
      dayOfWeek: true,
      opensAt: true,
      closesAt: true,
      isClosed: true,
    },
  },
} satisfies Prisma.PlaceSelect;

type HourRow = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

/** Compute whether a place is open now from PlaceHour rows (dayOfWeek 0=Sun..6=Sat). */
export function computeOpenNow(
  hours: HourRow[],
  now: Date = new Date(),
): boolean | null {
  if (!hours.length) return null;
  const day = now.getDay();
  const today = hours.filter((h) => h.dayOfWeek === day);
  if (!today.length) return null;
  if (today.every((h) => h.isClosed)) return false;

  const mins = now.getHours() * 60 + now.getMinutes();
  let sawOpenWindow = false;
  for (const h of today) {
    if (h.isClosed) continue;
    if (!h.opensAt || !h.closesAt) continue;
    sawOpenWindow = true;
    const [oh, om] = h.opensAt.split(':').map(Number);
    const [ch, cm] = h.closesAt.split(':').map(Number);
    if ([oh, om, ch, cm].some((n) => Number.isNaN(n))) continue;
    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    if (close <= open) {
      if (mins >= open || mins < close) return true;
    } else if (mins >= open && mins < close) {
      return true;
    }
  }
  if (!sawOpenWindow) return null;
  return false;
}

function richFieldsFromUpdate(dto: UpdatePlaceDto): Prisma.PlaceUpdateInput {
  const data: Prisma.PlaceUpdateInput = {};
  if (dto.guideComment !== undefined) data.guideComment = dto.guideComment;
  if (dto.typicalDurationMin !== undefined) {
    data.typicalDurationMin = dto.typicalDurationMin;
  }
  if (dto.audienceTags !== undefined) data.audienceTags = dto.audienceTags;
  if (dto.effortLevel !== undefined) data.effortLevel = dto.effortLevel;
  if (dto.budgetBand !== undefined) data.budgetBand = dto.budgetBand;
  if (dto.accessDifficulty !== undefined) {
    data.accessDifficulty = dto.accessDifficulty;
  }
  if (dto.paidEntry !== undefined) data.paidEntry = dto.paidEntry;
  if (dto.prerequisitesText !== undefined) {
    data.prerequisitesText = dto.prerequisitesText;
  }
  if (dto.precautionsText !== undefined) {
    data.precautionsText = dto.precautionsText;
  }
  if (dto.checklistJson !== undefined) {
    data.checklistJson = dto.checklistJson as Prisma.InputJsonValue;
  }
  if (dto.bestArriveText !== undefined) data.bestArriveText = dto.bestArriveText;
  if (dto.bestLeaveText !== undefined) data.bestLeaveText = dto.bestLeaveText;
  if (dto.seasonNote !== undefined) data.seasonNote = dto.seasonNote;
  if (dto.facebookUrl !== undefined) data.facebookUrl = dto.facebookUrl;
  if (dto.instagramUrl !== undefined) data.instagramUrl = dto.instagramUrl;
  if (dto.ticketUrl !== undefined) data.ticketUrl = dto.ticketUrl;
  if (dto.ticketHowTo !== undefined) data.ticketHowTo = dto.ticketHowTo;
  if (dto.ticketPriceText !== undefined) {
    data.ticketPriceText = dto.ticketPriceText;
  }
  return data;
}

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Alias for openNow helper used by public detail. */
  openNow(hours: HourRow[], now?: Date): boolean | null {
    return computeOpenNow(hours, now);
  }

  async listPublic(query: ListPlacesQueryDto) {
    const page = clampPage(query.page);
    const pageSize = clampPageSize(query.pageSize);
    const where: Prisma.PlaceWhereInput = {
      cityId: query.cityId,
      verificationStatus: VerificationStatus.APPROVED,
      deletedAt: null,
      ...(query.categoryId ? { primaryCategoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { summary: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.place.findMany({
      where,
      select: publicSelect,
      orderBy: [{ popularityScore: 'desc' }, { name: 'asc' }],
      take: 500,
    });

    let mapped = rows.map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      freshnessScore:
        p.freshnessScore != null ? Number(p.freshnessScore) : null,
      openNow: this.openNow(p.hours),
      distanceMeters:
        query.lat != null && query.lng != null
          ? haversineMeters(
              query.lat,
              query.lng,
              Number(p.latitude),
              Number(p.longitude),
            )
          : undefined,
    }));

    if (query.lat != null && query.lng != null) {
      mapped = mapped.sort(
        (a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0),
      );
      if (query.radiusMeters != null) {
        mapped = mapped.filter(
          (p) => (p.distanceMeters ?? 0) <= query.radiusMeters!,
        );
      }
    }

    const total = mapped.length;
    const start = (page - 1) * pageSize;
    const data = mapped.slice(start, start + pageSize);
    return { data, meta: paginateMeta(total, page, pageSize) };
  }

  async getPublic(id: string) {
    const place = await this.prisma.place.findFirst({
      where: {
        id,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
      select: publicSelect,
    });
    if (!place) throw new NotFoundException('Place not found');
    return {
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      freshnessScore:
        place.freshnessScore != null ? Number(place.freshnessScore) : null,
      openNow: this.openNow(place.hours),
      checklistJson: place.checklistJson,
      guideComment: place.guideComment,
      lastReviewedAt: place.lastReviewedAt,
    };
  }

  async getByIdAdmin(id: string) {
    const place = await this.prisma.place.findFirst({
      where: { id, deletedAt: null },
      select: publicSelect,
    });
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  async create(user: AuthUser, dto: CreatePlaceDto) {
    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Clients cannot create places');
    }

    if (user.role === UserRole.GUIDE) {
      const profile = await this.prisma.guideProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile || profile.status !== 'APPROVED') {
        throw new ForbiddenException('Guide not approved');
      }
      await assertGuidePointInScope(
        this.prisma,
        user.id,
        dto.latitude,
        dto.longitude,
      );
    }

    let status: VerificationStatus = VerificationStatus.PENDING;
    if (user.role === UserRole.ADMIN) {
      status = dto.verificationStatus ?? VerificationStatus.PENDING;
    }

    const baseSlug = slugify(dto.slug ?? dto.name) || `place-${Date.now()}`;
    let slug = baseSlug;
    let i = 1;
    while (
      await this.prisma.place.findUnique({
        where: { cityId_slug: { cityId: dto.cityId, slug } },
      })
    ) {
      slug = `${baseSlug}-${i++}`;
    }

    let primaryCategoryId = dto.primaryCategoryId;
    if (!primaryCategoryId && dto.categoryKey) {
      const cat = await this.prisma.category.findUnique({
        where: { key: dto.categoryKey },
      });
      if (!cat) {
        throw new NotFoundException(`Unknown categoryKey: ${dto.categoryKey}`);
      }
      primaryCategoryId = cat.id;
    }

    const metadata =
      dto.attributes && Object.keys(dto.attributes).length > 0
        ? { attributes: dto.attributes }
        : undefined;

    return this.prisma.place.create({
      data: {
        cityId: dto.cityId,
        name: dto.name,
        slug,
        summary: dto.summary,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        addressText: dto.addressText,
        phone: dto.phone,
        website: dto.website,
        priceLevel: dto.priceLevel,
        primaryCategoryId,
        metadata: metadata ?? undefined,
        audienceTags: dto.audienceTags ?? [],
        typicalDurationMin: dto.typicalDurationMin,
        effortLevel: dto.effortLevel,
        budgetBand: dto.budgetBand,
        guideComment: dto.guideComment,
        accessDifficulty: dto.accessDifficulty,
        paidEntry: dto.paidEntry,
        prerequisitesText: dto.prerequisitesText,
        precautionsText: dto.precautionsText,
        checklistJson:
          dto.checklistJson !== undefined
            ? (dto.checklistJson as Prisma.InputJsonValue)
            : undefined,
        bestArriveText: dto.bestArriveText,
        bestLeaveText: dto.bestLeaveText,
        seasonNote: dto.seasonNote,
        facebookUrl: dto.facebookUrl,
        instagramUrl: dto.instagramUrl,
        ticketUrl: dto.ticketUrl,
        ticketHowTo: dto.ticketHowTo,
        ticketPriceText: dto.ticketPriceText,
        lastReviewedAt:
          user.role === UserRole.GUIDE || user.role === UserRole.ADMIN
            ? new Date()
            : undefined,
        verificationStatus: status,
        sourceType:
          user.role === UserRole.GUIDE
            ? SourceType.GUIDE_VERIFIED
            : SourceType.ADMIN,
        createdByUserId: user.id,
        publishedAt: status === VerificationStatus.APPROVED ? new Date() : null,
      },
      select: publicSelect,
    });
  }

  async update(user: AuthUser, id: string, dto: UpdatePlaceDto) {
    const place = await this.prisma.place.findFirst({
      where: { id, deletedAt: null },
    });
    if (!place) throw new NotFoundException('Place not found');

    const isAdmin = user.role === UserRole.ADMIN;
    const isCreator = place.createdByUserId === user.id;
    const biz = await this.prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });
    const isBusinessOwner = Boolean(biz && place.ownedByBusinessId === biz.id);

    if (!isAdmin && !isCreator && !isBusinessOwner) {
      throw new ForbiddenException('Not allowed to update this place');
    }

    // Business owners (non-admin): limited fields only
    const data: Prisma.PlaceUpdateInput =
      isBusinessOwner && !isAdmin && !isCreator
        ? {
            phone: dto.phone,
            website: dto.website,
            addressText: dto.addressText,
          }
        : {
            name: dto.name,
            summary: dto.summary,
            description: dto.description,
            latitude: dto.latitude,
            longitude: dto.longitude,
            addressText: dto.addressText,
            phone: dto.phone,
            website: dto.website,
            priceLevel: dto.priceLevel,
            primaryCategory: dto.primaryCategoryId
              ? { connect: { id: dto.primaryCategoryId } }
              : undefined,
            isSponsored: isAdmin ? dto.isSponsored : undefined,
            ...richFieldsFromUpdate(dto),
            ...((user.role === UserRole.GUIDE || isAdmin) &&
            (isCreator || isAdmin)
              ? { lastReviewedAt: new Date() }
              : {}),
          };

    return this.prisma.place.update({
      where: { id },
      data,
      select: publicSelect,
    });
  }

  async replaceHours(
    user: AuthUser,
    placeId: string,
    hours: PlaceHourDto[],
  ) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, deletedAt: null },
    });
    if (!place) throw new NotFoundException('Place not found');

    const isAdmin = user.role === UserRole.ADMIN;
    const isCreator = place.createdByUserId === user.id;
    if (!isAdmin && !isCreator) {
      throw new ForbiddenException('Not allowed to update hours for this place');
    }
    if (user.role === UserRole.GUIDE) {
      const profile = await this.prisma.guideProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile || profile.status !== 'APPROVED') {
        throw new ForbiddenException('Guide not approved');
      }
    }

    await this.prisma.$transaction([
      this.prisma.placeHour.deleteMany({ where: { placeId } }),
      this.prisma.placeHour.createMany({
        data: hours.map((h) => ({
          placeId,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt ?? null,
          closesAt: h.closesAt ?? null,
          isClosed: h.isClosed ?? false,
        })),
      }),
      this.prisma.place.update({
        where: { id: placeId },
        data: { lastReviewedAt: new Date() },
      }),
    ]);

    return this.prisma.placeHour.findMany({
      where: { placeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async addPhoto(user: AuthUser, placeId: string, dto: AddPhotoDto) {
    const found = await this.prisma.place.findFirst({
      where: { id: placeId, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Place not found');

    const isAdmin = user.role === UserRole.ADMIN;
    const isCreator = found.createdByUserId === user.id;
    if (!isAdmin && !isCreator) {
      const biz = await this.prisma.businessProfile.findUnique({
        where: { userId: user.id },
      });
      if (!biz || found.ownedByBusinessId !== biz.id) {
        throw new ForbiddenException('Not allowed to add photos');
      }
    }

    return this.prisma.placePhoto.create({
      data: {
        placeId,
        url: dto.url,
        caption: dto.caption,
        sortOrder: dto.sortOrder ?? 0,
        uploadedByUserId: user.id,
        status:
          user.role === UserRole.ADMIN
            ? VerificationStatus.APPROVED
            : VerificationStatus.PENDING,
      },
    });
  }
}
