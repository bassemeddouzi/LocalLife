import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../shared/memory-cache.service';

class ListTransportQuery {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}

@Controller('v1/transport-systems')
export class TransportController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  @Get()
  async list(@Query() query: ListTransportQuery) {
    const key = `transport:list:${query.cityId ?? ''}:${query.countryId ?? ''}`;
    const cached = this.cache.get<unknown>(key);
    if (cached) return cached;

    const rows = await this.prisma.transportSystem.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(query.cityId ? { cityId: query.cityId } : {}),
        ...(query.countryId ? { countryId: query.countryId } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        mode: true,
        summary: true,
        pricingType: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        paymentMethods: true,
        warnings: true,
        lastReviewedAt: true,
        cityId: true,
        countryId: true,
      },
    });
    this.cache.set(key, rows, 90_000);
    return rows;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const system = await this.prisma.transportSystem.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
      include: {
        hubs: {
          include: {
            place: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                addressText: true,
              },
            },
          },
        },
        routes: {
          where: { verificationStatus: VerificationStatus.APPROVED },
          include: {
            fromHub: { select: { id: true, name: true } },
            toHub: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!system) throw new NotFoundException('Transport system not found');
    return system;
  }

  @Get(':id/hubs')
  async hubs(@Param('id') id: string) {
    const system = await this.prisma.transportSystem.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
    });
    if (!system) throw new NotFoundException('Transport system not found');
    return this.prisma.transportHub.findMany({
      where: { transportSystemId: id },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            addressText: true,
          },
        },
      },
    });
  }

  @Get(':id/routes')
  async routes(@Param('id') id: string) {
    const system = await this.prisma.transportSystem.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
    });
    if (!system) throw new NotFoundException('Transport system not found');
    return this.prisma.transportRoute.findMany({
      where: {
        transportSystemId: id,
        verificationStatus: VerificationStatus.APPROVED,
      },
      include: {
        fromHub: { select: { id: true, name: true } },
        toHub: { select: { id: true, name: true } },
      },
    });
  }
}
