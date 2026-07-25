import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { GeoStatus } from '@prisma/client';
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
