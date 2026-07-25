import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

class ArrivalQuery {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  airportPlaceId?: string;
}

class HowToQuery {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  categoryKey?: string;
}

@Controller('v1')
export class KnowledgeGuidesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('arrival-guides')
  async listArrival(@Query() query: ArrivalQuery) {
    if (!query.cityId && !query.airportPlaceId) {
      return [];
    }
    return this.prisma.arrivalGuide.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(query.cityId ? { cityId: query.cityId } : {}),
        ...(query.airportPlaceId
          ? { airportPlaceId: query.airportPlaceId }
          : {}),
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('arrival-guides/:id')
  async getArrival(@Param('id') id: string) {
    const guide = await this.prisma.arrivalGuide.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!guide) throw new NotFoundException('Arrival guide not found');
    return guide;
  }

  @Get('how-to-guides')
  async listHowTo(@Query() query: HowToQuery) {
    return this.prisma.howToGuide.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(query.cityId ? { cityId: query.cityId } : {}),
        ...(query.categoryKey ? { categoryKey: query.categoryKey } : {}),
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { title: 'asc' },
    });
  }

  @Get('how-to-guides/:id')
  async getHowTo(@Param('id') id: string) {
    const guide = await this.prisma.howToGuide.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!guide) throw new NotFoundException('How-to guide not found');
    return guide;
  }
}
