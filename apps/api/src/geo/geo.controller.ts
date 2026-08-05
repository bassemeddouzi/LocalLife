import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { GeoStatus } from '@prisma/client';
import { Auth } from '../auth/auth.decorators';
import { zoneForCitySlug } from '../admin/city-zones';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../shared/memory-cache.service';

@Controller('v1')
export class GeoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  @Get('countries')
  async listCountries(@Query('status') status?: string) {
    const key = `geo:countries:${status ?? 'ACTIVE'}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const where =
      status === 'ALL'
        ? {}
        : { status: (status as GeoStatus) ?? GeoStatus.ACTIVE };
    const rows = await this.prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        iso2: true,
        iso3: true,
        name: true,
        defaultLocale: true,
        defaultCurrency: true,
        status: true,
        packVersion: true,
      },
    });
    this.cache.set(key, rows, 120_000);
    return rows;
  }

  @Get('countries/:id/regions')
  async listRegions(@Param('id') countryId: string) {
    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
    });
    if (!country) throw new NotFoundException('Country not found');
    return this.prisma.region.findMany({
      where: { countryId, status: GeoStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        countryId: true,
        name: true,
        code: true,
        status: true,
      },
    });
  }

  @Get('countries/:id/cities')
  async listCities(
    @Param('id') countryId: string,
    @Query('status') status?: string,
  ) {
    const key = `geo:cities:${countryId}:${status ?? 'ACTIVE'}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
    });
    if (!country) throw new NotFoundException('Country not found');

    const where =
      status === 'ALL'
        ? { countryId }
        : { countryId, status: (status as GeoStatus) ?? GeoStatus.ACTIVE };

    const rows = await this.prisma.city.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        status: true,
        isFeatured: true,
        contentPackVersion: true,
        defaultLocale: true,
        countryId: true,
      },
    });
    this.cache.set(key, rows, 120_000);
    return rows;
  }

  @Get('cities/:id/zone')
  @Auth()
  async getCityZone(@Param('id') cityId: string) {
    const city = await this.prisma.city.findFirst({
      where: { id: cityId, status: GeoStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
    if (!city) throw new NotFoundException('City not found');

    const zone = zoneForCitySlug(city.slug);
    if (!zone) {
      return {
        cityId: city.id,
        slug: city.slug,
        name: city.name,
        center: [Number(city.longitude), Number(city.latitude)] as [
          number,
          number,
        ],
        zoom: 11,
        polygon: null,
      };
    }

    return {
      cityId: city.id,
      slug: zone.slug,
      name: zone.name,
      center: zone.center,
      zoom: zone.zoom,
      polygon: zone.polygon,
    };
  }

  @Get('cities/:id/districts')
  async listDistricts(@Param('id') cityId: string) {
    const key = `geo:districts:${cityId}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const city = await this.prisma.city.findFirst({
      where: { id: cityId, status: GeoStatus.ACTIVE },
    });
    if (!city) throw new NotFoundException('City not found');

    const rows = await this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        cityId: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
    const mapped = rows.map((d) => ({
      ...d,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
    }));
    this.cache.set(key, mapped, 120_000);
    return mapped;
  }

  @Get('districts/:id/hoods')
  async listHoods(@Param('id') districtId: string) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) throw new NotFoundException('District not found');
    const rows = await this.prisma.hood.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        districtId: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
    return rows.map((h) => ({
      ...h,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
    }));
  }

  @Get('cities/:id')
  async getCity(@Param('id') id: string) {
    const key = `geo:city:${id}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        country: {
          select: {
            id: true,
            iso2: true,
            iso3: true,
            name: true,
            defaultCurrency: true,
          },
        },
      },
    });
    if (!city || city.status !== GeoStatus.ACTIVE) {
      throw new NotFoundException('City not found');
    }
    this.cache.set(key, city, 120_000);
    return city;
  }

  @Get('categories')
  async listCategories(@Query('parentId') parentId?: string) {
    const key = `geo:categories:${parentId ?? 'root'}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const rows = await this.prisma.category.findMany({
      where: parentId ? { parentId } : { parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    this.cache.set(key, rows, 300_000);
    return rows;
  }

  @Get('cities/:id/categories')
  async cityCategories(@Param('id') cityId: string) {
    const city = await this.prisma.city.findFirst({
      where: { id: cityId, status: GeoStatus.ACTIVE },
    });
    if (!city) throw new NotFoundException('City not found');
    return this.listCategories();
  }
}
