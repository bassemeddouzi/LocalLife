import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RuleCategory, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

class ListRulesQuery {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @IsEnum(RuleCategory)
  category?: RuleCategory;

  @IsOptional()
  @IsString()
  audience?: string;
}

@Controller('v1/local-rules')
export class LocalRulesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: ListRulesQuery) {
    let countryId = query.countryId;
    if (query.cityId && !countryId) {
      const city = await this.prisma.city.findUnique({
        where: { id: query.cityId },
        select: { countryId: true },
      });
      countryId = city?.countryId;
    }

    return this.prisma.localRule.findMany({
      where: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(query.category ? { category: query.category } : {}),
        ...(query.audience ? { audience: query.audience } : {}),
        ...(query.cityId || countryId
          ? {
              OR: [
                ...(query.cityId ? [{ cityId: query.cityId }] : []),
                ...(countryId
                  ? [{ countryId, cityId: null as string | null }]
                  : []),
              ],
            }
          : {}),
      },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        scope: true,
        category: true,
        severity: true,
        audience: true,
        title: true,
        summary: true,
        sourceType: true,
        lastReviewedAt: true,
        cityId: true,
        countryId: true,
      },
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const rule = await this.prisma.localRule.findFirst({
      where: { id, verificationStatus: VerificationStatus.APPROVED },
    });
    if (!rule) throw new NotFoundException('Local rule not found');
    return rule;
  }
}
