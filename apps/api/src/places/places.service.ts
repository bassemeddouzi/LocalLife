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
  UpdatePlaceDto,
} from './dto/places.dto';

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

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const place = await this.prisma.place.create({
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

    return place;
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
          };

    return this.prisma.place.update({
      where: { id },
      data,
      select: publicSelect,
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
