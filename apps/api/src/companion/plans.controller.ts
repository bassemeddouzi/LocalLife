import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BudgetBand,
  ClientPlanSource,
  ClientPlanStatus,
  ConservatismLevel,
  TransportMode,
  VerificationStatus,
} from '@prisma/client';
import { Auth, AuthUser, CurrentUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContextService } from '../ai/session-context.service';
import { ProfileMemoryService } from '../ai/profile-memory.service';
import { PlanScoringService } from './plan-scoring.service';
import { PlanGeneratorService } from './plan-generator.service';
import { WeatherService } from '../weather/weather.service';

class PlanStepDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dayIndex?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsUUID()
  placeId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  freeText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  transportNote?: string;

  @IsOptional()
  whyJson?: Record<string, unknown>;
}

class CreatePlanDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsEnum(ClientPlanSource)
  source?: ClientPlanSource;

  @IsOptional()
  @IsUUID()
  planPackId?: string;

  @IsOptional()
  @IsString()
  tripStartsOn?: string;

  @IsOptional()
  @IsString()
  tripEndsOn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  dailyStartLocal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  dailyEndLocal?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanStepDto)
  steps?: PlanStepDto[];

  @IsOptional()
  offlinePayloadJson?: Record<string, unknown>;
}

class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(ClientPlanStatus)
  status?: ClientPlanStatus;

  @IsOptional()
  @IsString()
  tripStartsOn?: string;

  @IsOptional()
  @IsString()
  tripEndsOn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  dailyStartLocal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  dailyEndLocal?: string;

  @IsOptional()
  offlinePayloadJson?: Record<string, unknown>;
}

class LegOptionsDto {
  @IsUUID()
  cityId!: string;

  @Type(() => Number)
  @IsNumber()
  fromLat!: number;

  @Type(() => Number)
  @IsNumber()
  fromLng!: number;

  @IsOptional()
  @IsUUID()
  toPlaceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  toLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  toLng?: number;

  @Type(() => Boolean)
  @IsBoolean()
  hasPrivateTransport!: boolean;
}

class ReplaceStepsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanStepDto)
  steps!: PlanStepDto[];

  @IsOptional()
  offlinePayloadJson?: Record<string, unknown>;
}

class PlanBriefDefaultsDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;
}

class SessionContextPatchDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  groupType?: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsEnum(BudgetBand)
  budgetNow?: BudgetBand;

  @IsOptional()
  @IsEnum(ConservatismLevel)
  conservatismNow?: ConservatismLevel;

  @IsOptional()
  @IsBoolean()
  hasPrivateTransport?: boolean;

  @IsOptional()
  @IsBoolean()
  walksOkNow?: boolean;

  @IsOptional()
  @IsString()
  maxEndTimeIso?: string;

  @IsOptional()
  contextJson?: Record<string, unknown>;
}

class CandidatePlansDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

class PlanActionDto {
  @IsString()
  action!: 'add_step' | 'remove_step' | 'swap_transport' | 'reorder_steps';

  @IsOptional()
  index?: number;

  @IsOptional()
  fromIndex?: number;

  @IsOptional()
  toIndex?: number;

  @IsOptional()
  @Type(() => PlanStepDto)
  step?: PlanStepDto;

  @IsOptional()
  whyJson?: Record<string, unknown>;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const MODE_SPEED_KMH: Partial<Record<TransportMode, number>> = {
  WALK: 4.5,
  BIKE: 14,
  SCOOTER: 28,
  TAXI: 32,
  RIDE_HAILING: 30,
  SHARED_TAXI: 28,
  BUS: 22,
  AIRPORT_SHUTTLE: 35,
  CAR_RENTAL: 40,
  FERRY: 12,
  OTHER: 38,
  BOAT: 15,
};

@Controller('v1/me')
export class PlansController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionContext: SessionContextService,
    private readonly profileMemory: ProfileMemoryService,
    private readonly planScoring: PlanScoringService,
    private readonly planGenerator: PlanGeneratorService,
    private readonly weather: WeatherService,
  ) {}

  @Get('plans/brief-defaults')
  @Auth()
  async briefDefaults(
    @CurrentUser() user: AuthUser,
    @Query() query: PlanBriefDefaultsDto,
  ) {
    const [profile, effective] = await Promise.all([
      this.profileMemory.getProfileCard(user.id),
      this.sessionContext.getEffectiveContext(user.id),
    ]);
    return {
      cityId: query.cityId ?? null,
      defaults: {
        ...effective,
        profileCard: profile.card,
      },
      askOnceKey: `${user.id}:${query.cityId ?? 'global'}`,
    };
  }

  @Patch('plans/session-context')
  @Auth()
  async patchSessionContext(
    @CurrentUser() user: AuthUser,
    @Body() dto: SessionContextPatchDto,
  ) {
    return this.sessionContext.upsertSessionContext(user.id, dto);
  }

  @Get('plans/session-context')
  @Auth()
  async getSessionContext(
    @CurrentUser() user: AuthUser,
    @Query('conversationId') conversationId?: string,
    @Query('planId') planId?: string,
  ) {
    const effective = await this.sessionContext.getEffectiveContext(
      user.id,
      conversationId,
    );
    return { effective, conversationId: conversationId ?? null, planId: planId ?? null };
  }

  @Post('plans/candidates')
  @Auth()
  async candidatePlans(
    @CurrentUser() user: AuthUser,
    @Body() dto: CandidatePlansDto,
  ) {
    const effective = await this.sessionContext.getEffectiveContext(
      user.id,
      dto.conversationId,
    );
    const ctx = effective.contextJson ?? {};
    const needsText =
      typeof ctx.needsText === 'string' ? ctx.needsText : undefined;
    const weatherPrefs =
      ctx.weatherPrefs && typeof ctx.weatherPrefs === 'object'
        ? (ctx.weatherPrefs as {
            hatesCold?: boolean;
            hatesHeat?: boolean;
            avoidRainOutdoors?: boolean;
          })
        : undefined;
    const prefs = {
      hasPrivateTransport: Boolean(effective.hasPrivateTransport),
      budgetBand: effective.budgetBand as 'LOW' | 'MEDIUM' | 'HIGH',
      conservatismLevel: String(effective.conservatismLevel),
      groupType: String(effective.groupType),
      mood: String(effective.mood),
      needsText,
      weatherPrefs,
    };
    const situation = this.planGenerator.detectSituation(needsText);

    const today = new Date();
    const todayNoon = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12),
    );
    const tripStartsOn =
      typeof ctx.tripStartsOn === 'string'
        ? new Date(ctx.tripStartsOn)
        : todayNoon;
    const tripEndsOn =
      typeof ctx.tripEndsOn === 'string'
        ? new Date(ctx.tripEndsOn)
        : tripStartsOn;
    const dailyStartLocal =
      typeof ctx.dailyStartLocal === 'string' && ctx.dailyStartLocal
        ? ctx.dailyStartLocal
        : '10:30';
    const dailyEndLocal =
      typeof ctx.dailyEndLocal === 'string' && ctx.dailyEndLocal
        ? ctx.dailyEndLocal
        : '22:00';

    if (dto.cityId && situation === 'on_island_day') {
      const weather = await this.weather
        .getCityForecast(dto.cityId, 14)
        .catch(() => null);
      const generated = await this.planGenerator.generateCandidates({
        cityId: dto.cityId,
        userId: user.id,
        prefs,
        window: {
          tripStartsOn: Number.isFinite(tripStartsOn.getTime())
            ? tripStartsOn
            : todayNoon,
          tripEndsOn: Number.isFinite(tripEndsOn.getTime())
            ? tripEndsOn
            : todayNoon,
          dailyStartLocal,
          dailyEndLocal,
        },
        weather,
        lat: dto.lat,
        lng: dto.lng,
      });
      if (generated.length) return generated;
    }

    return this.planScoring.suggestCandidatePacks({
      cityId: dto.cityId,
      userId: user.id,
      prefs: {
        hasPrivateTransport: prefs.hasPrivateTransport,
        budgetBand: prefs.budgetBand,
        conservatismLevel: effective.conservatismLevel,
        groupType: prefs.groupType,
        mood: prefs.mood,
      },
      situation,
    });
  }

  @Get('plan-packs')
  @Auth()
  listPacks(@Query('cityId') cityId?: string) {
    return this.prisma.planPack.findMany({
      where: {
        enabled: true,
        OR: cityId ? [{ cityId: null }, { cityId }] : [{ cityId: null }],
      },
      orderBy: { title: 'asc' },
    });
  }

  @Get('plan-packs/:id')
  @Auth()
  async getPack(@Param('id') id: string) {
    const pack = await this.prisma.planPack.findFirst({
      where: { id, enabled: true },
    });
    if (!pack) throw new NotFoundException('Plan pack not found');
    return this.enrichPackSteps(pack);
  }

  @Get('plans')
  @Auth()
  async listPlans(@CurrentUser() user: AuthUser) {
    const plans = await this.prisma.clientPlan.findMany({
      where: { userId: user.id },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return Promise.all(plans.map((p) => this.enrichPlanSteps(p)));
  }

  @Get('plans/active')
  @Auth()
  async getActivePlan(@CurrentUser() user: AuthUser) {
    const plan = await this.prisma.clientPlan.findFirst({
      where: { userId: user.id, status: ClientPlanStatus.ACTIVE },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!plan) return null;
    return this.enrichPlanSteps(plan);
  }

  @Get('plans/:id')
  @Auth()
  async getPlan(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const plan = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.enrichPlanSteps(plan);
  }

  @Post('plans/leg-options')
  @Auth()
  async legOptions(@Body() dto: LegOptionsDto) {
    let toLat = dto.toLat;
    let toLng = dto.toLng;
    let toLabel = 'Destination';
    if (dto.toPlaceId) {
      const place = await this.prisma.place.findFirst({
        where: { id: dto.toPlaceId },
        select: { name: true, latitude: true, longitude: true },
      });
      if (!place) throw new NotFoundException('Place not found');
      toLat = toNum(place.latitude) ?? toLat;
      toLng = toNum(place.longitude) ?? toLng;
      toLabel = place.name;
    }
    if (toLat == null || toLng == null) {
      throw new NotFoundException('Destination coordinates missing');
    }

    const distanceKm = haversineKm(dto.fromLat, dto.fromLng, toLat, toLng);
    const systems = await this.prisma.transportSystem.findMany({
      where: {
        cityId: dto.cityId,
        verificationStatus: VerificationStatus.APPROVED,
      },
      orderBy: { name: 'asc' },
    });

    const options = systems
      .map((sys) => {
        const speed = MODE_SPEED_KMH[sys.mode] ?? 25;
        let estMinutes = Math.max(3, Math.round((distanceKm / speed) * 60));
        if (sys.mode === TransportMode.SHARED_TAXI) estMinutes += 12;
        if (sys.mode === TransportMode.BUS) estMinutes += 15;
        if (sys.mode === TransportMode.AIRPORT_SHUTTLE) estMinutes += 10;

        const pMin = toNum(sys.priceMin) ?? 0;
        const pMax = toNum(sys.priceMax) ?? pMin;
        let estCostMin = pMin;
        let estCostMax = pMax;
        if (
          sys.mode === TransportMode.TAXI ||
          sys.mode === TransportMode.RIDE_HAILING
        ) {
          estCostMin = Math.round((pMin * 0.35 + distanceKm * 2.2) * 10) / 10;
          estCostMax = Math.round((pMax * 0.45 + distanceKm * 3.2) * 10) / 10;
        } else if (sys.mode === TransportMode.SHARED_TAXI) {
          estCostMin = Math.min(
            pMax,
            Math.max(pMin, Math.round(distanceKm * 0.6)),
          );
          estCostMax = Math.min(
            pMax,
            Math.max(estCostMin, Math.round(distanceKm * 1.1)),
          );
        } else if (sys.mode === TransportMode.BUS) {
          estCostMin = pMin;
          estCostMax = Math.min(pMax, pMin + 2);
        } else if (
          sys.mode === TransportMode.BIKE ||
          sys.mode === TransportMode.SCOOTER ||
          sys.mode === TransportMode.CAR_RENTAL
        ) {
          const slice = distanceKm < 5 ? 0.25 : distanceKm < 15 ? 0.4 : 0.55;
          estCostMin = Math.round(pMin * slice);
          estCostMax = Math.round(pMax * slice);
        } else if (
          sys.mode === TransportMode.WALK ||
          (sys.mode === TransportMode.OTHER && pMax <= 15)
        ) {
          estCostMin = 0;
          estCostMax =
            sys.mode === TransportMode.OTHER ? Math.min(8, distanceKm) : 0;
        }

        let score = 50;
        if (dto.hasPrivateTransport) {
          if (sys.mode === TransportMode.OTHER) score += 40;
          if (sys.mode === TransportMode.CAR_RENTAL) score += 10;
          if (sys.mode === TransportMode.WALK && distanceKm < 1.2) score += 25;
          if (sys.mode === TransportMode.TAXI) score -= 10;
        } else {
          if (sys.mode === TransportMode.OTHER) score -= 30;
          if (sys.mode === TransportMode.CAR_RENTAL) score -= 15;
          if (distanceKm < 1.2 && sys.mode === TransportMode.WALK) score += 45;
          if (distanceKm >= 1.2 && distanceKm < 8) {
            if (sys.mode === TransportMode.SHARED_TAXI) score += 30;
            if (sys.mode === TransportMode.TAXI) score += 25;
            if (sys.mode === TransportMode.BIKE) score += 15;
            if (sys.mode === TransportMode.SCOOTER) score += 18;
            if (sys.mode === TransportMode.BUS) score += 20;
          }
          if (distanceKm >= 8) {
            if (sys.mode === TransportMode.TAXI) score += 35;
            if (sys.mode === TransportMode.SHARED_TAXI) score += 28;
            if (sys.mode === TransportMode.AIRPORT_SHUTTLE) score += 15;
            if (sys.mode === TransportMode.WALK) score -= 40;
          }
        }
        if (sys.mode === TransportMode.FERRY) score -= 50;
        if (distanceKm > 2 && sys.mode === TransportMode.WALK) score -= 25;

        return {
          systemId: sys.id,
          mode: sys.mode,
          name: sys.name,
          summary: sys.summary,
          pricingType: sys.pricingType,
          estMinutes,
          estCostMin,
          estCostMax,
          currency: sys.currency,
          score,
          reason: sys.howItWorks ?? sys.summary,
        };
      })
      .filter((o) => o.score > 10)
      .sort((a, b) => b.score - a.score)
      .map((o, i) => ({
        ...o,
        recommended: i === 0,
      }));

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      toLabel,
      toLat,
      toLng,
      hasPrivateTransport: dto.hasPrivateTransport,
      options,
      recommended: options[0] ?? null,
    };
  }

  @Post('plans')
  @Auth()
  async createPlan(@CurrentUser() user: AuthUser, @Body() dto: CreatePlanDto) {
    let steps = dto.steps ?? [];
    if (dto.planPackId) {
      const pack = await this.prisma.planPack.findFirst({
        where: { id: dto.planPackId, enabled: true },
      });
      if (!pack) throw new NotFoundException('Plan pack not found');
      const packSteps = Array.isArray(pack.stepsJson)
        ? (pack.stepsJson as PlanStepDto[])
        : [];
      if (!steps.length) steps = packSteps;
    }
    return this.enrichPlanSteps(
      await this.prisma.clientPlan.create({
        data: {
          userId: user.id,
          title: dto.title.trim(),
          cityId: dto.cityId,
          source: dto.source ?? ClientPlanSource.MANUAL,
          planPackId: dto.planPackId,
          status: ClientPlanStatus.DRAFT,
          tripStartsOn: dto.tripStartsOn
            ? new Date(dto.tripStartsOn)
            : undefined,
          tripEndsOn: dto.tripEndsOn ? new Date(dto.tripEndsOn) : undefined,
          dailyStartLocal: dto.dailyStartLocal,
          dailyEndLocal: dto.dailyEndLocal,
          offlinePayloadJson:
            (dto.offlinePayloadJson as object | undefined) ?? undefined,
          steps: {
            create: steps.map((s, i) => ({
              sortOrder: s.sortOrder ?? i,
              dayIndex: s.dayIndex ?? 0,
              startsAt: s.startsAt ? new Date(s.startsAt) : undefined,
              placeId: s.placeId,
              eventId: s.eventId,
              freeText: s.freeText,
              durationMin: s.durationMin,
              transportNote: s.transportNote,
              whyJson: (s.whyJson as object | undefined) ?? undefined,
            })),
          },
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
  }

  @Patch('plans/:id')
  @Auth()
  async updatePlan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const existing = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    return this.enrichPlanSteps(
      await this.prisma.clientPlan.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          status: dto.status,
          tripStartsOn: dto.tripStartsOn
            ? new Date(dto.tripStartsOn)
            : undefined,
          tripEndsOn: dto.tripEndsOn ? new Date(dto.tripEndsOn) : undefined,
          dailyStartLocal: dto.dailyStartLocal,
          dailyEndLocal: dto.dailyEndLocal,
          offlinePayloadJson:
            (dto.offlinePayloadJson as object | undefined) ?? undefined,
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
  }

  @Put('plans/:id/steps')
  @Auth()
  async replaceSteps(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReplaceStepsDto,
  ) {
    const existing = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    await this.prisma.clientPlanStep.deleteMany({ where: { planId: id } });
    return this.enrichPlanSteps(
      await this.prisma.clientPlan.update({
        where: { id },
        data: {
          offlinePayloadJson:
            (dto.offlinePayloadJson as object | undefined) ??
            (existing.offlinePayloadJson as object | undefined),
          steps: {
            create: dto.steps.map((s, i) => ({
              sortOrder: s.sortOrder ?? i,
              dayIndex: s.dayIndex ?? 0,
              startsAt: s.startsAt ? new Date(s.startsAt) : undefined,
              placeId: s.placeId,
              eventId: s.eventId,
              freeText: s.freeText,
              durationMin: s.durationMin,
              transportNote: s.transportNote,
              whyJson: (s.whyJson as object | undefined) ?? undefined,
            })),
          },
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
  }

  @Post('plans/:id/actions')
  @Auth()
  async applyAction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PlanActionDto,
  ) {
    const existing = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    const steps = existing.steps.map((s) => ({
      sortOrder: s.sortOrder,
      startsAt: s.startsAt?.toISOString(),
      placeId: s.placeId ?? undefined,
      eventId: s.eventId ?? undefined,
      freeText: s.freeText ?? undefined,
      durationMin: s.durationMin ?? undefined,
      transportNote: s.transportNote ?? undefined,
      whyJson:
        (s.whyJson as Record<string, unknown> | undefined) ?? undefined,
    }));
    if (dto.action === 'add_step' && dto.step) {
      const at = typeof dto.index === 'number' ? dto.index : steps.length;
      steps.splice(at, 0, {
        sortOrder: dto.step.sortOrder ?? at,
        startsAt: dto.step.startsAt,
        placeId: dto.step.placeId,
        eventId: dto.step.eventId,
        freeText: dto.step.freeText,
        durationMin: dto.step.durationMin,
        transportNote: dto.step.transportNote,
        whyJson: dto.step.whyJson,
      });
    } else if (dto.action === 'remove_step') {
      const at = typeof dto.index === 'number' ? dto.index : -1;
      if (at >= 0) steps.splice(at, 1);
    } else if (dto.action === 'swap_transport') {
      const at = typeof dto.index === 'number' ? dto.index : -1;
      if (at >= 0 && steps[at]) {
        steps[at] = { ...steps[at], whyJson: dto.whyJson ?? steps[at].whyJson };
      }
    } else if (dto.action === 'reorder_steps') {
      const from = typeof dto.fromIndex === 'number' ? dto.fromIndex : -1;
      const to = typeof dto.toIndex === 'number' ? dto.toIndex : -1;
      if (from >= 0 && to >= 0 && from !== to && from < steps.length && to < steps.length) {
        const [row] = steps.splice(from, 1);
        steps.splice(to, 0, row);
      }
    }
    return this.replaceSteps(user, id, {
      steps: steps.map((s, i) => ({ ...s, sortOrder: i })),
      offlinePayloadJson:
        (existing.offlinePayloadJson as Record<string, unknown> | undefined) ??
        undefined,
    });
  }

  @Post('plans/:id/activate')
  @Auth()
  async activate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const existing = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    await this.prisma.clientPlan.updateMany({
      where: { userId: user.id, status: ClientPlanStatus.ACTIVE },
      data: { status: ClientPlanStatus.DRAFT },
    });
    return this.enrichPlanSteps(
      await this.prisma.clientPlan.update({
        where: { id },
        data: { status: ClientPlanStatus.ACTIVE },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      }),
    );
  }

  @Delete('plans/:id')
  @Auth()
  async deletePlan(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const existing = await this.prisma.clientPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Plan not found');
    await this.prisma.clientPlan.delete({ where: { id } });
    return { ok: true };
  }

  private async loadPlacesByIds(placeIds: string[]) {
    const ids = [...new Set(placeIds.filter(Boolean))];
    if (!ids.length) {
      return new Map<
        string,
        {
          id: string;
          name: string;
          summary: string;
          description: string | null;
          latitude: unknown;
          longitude: unknown;
          addressText: string | null;
          phone: string | null;
          photos: Array<{ url: string }>;
          primaryCategory: { key: string; name: string } | null;
        }
      >();
    }
    const places = await this.prisma.place.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        summary: true,
        description: true,
        latitude: true,
        longitude: true,
        addressText: true,
        phone: true,
        photos: { take: 1, select: { url: true } },
        primaryCategory: { select: { key: true, name: true } },
      },
    });
    return new Map(places.map((p) => [p.id, p]));
  }

  private async enrichPlanSteps<
    T extends {
      steps: Array<{
        placeId?: string | null;
        durationMin?: number | null;
        whyJson?: unknown;
        [k: string]: unknown;
      }>;
      offlinePayloadJson?: unknown;
    },
  >(plan: T) {
    const byId = await this.loadPlacesByIds(
      plan.steps.map((s) => s.placeId).filter(Boolean) as string[],
    );
    const steps = plan.steps.map((s) => ({
      ...s,
      place: s.placeId ? (byId.get(s.placeId) ?? null) : null,
    }));
    let travelMin = 0;
    let stayMin = 0;
    let costMin = 0;
    let costMax = 0;
    for (const s of steps) {
      stayMin += s.durationMin ?? 0;
      const why =
        s.whyJson && typeof s.whyJson === 'object'
          ? (s.whyJson as Record<string, unknown>)
          : {};
      const leg =
        why.leg && typeof why.leg === 'object'
          ? (why.leg as Record<string, unknown>)
          : null;
      if (leg) {
        travelMin += Number(leg.estMinutes ?? 0) || 0;
        costMin += Number(leg.estCostMin ?? 0) || 0;
        costMax += Number(leg.estCostMax ?? 0) || 0;
      }
    }
    return {
      ...plan,
      steps,
      totals: {
        travelMin,
        stayMin,
        totalMin: travelMin + stayMin,
        costMin: Math.round(costMin * 10) / 10,
        costMax: Math.round(costMax * 10) / 10,
        currency: 'TND',
      },
    };
  }

  private async enrichPackSteps(pack: {
    id: string;
    stepsJson: unknown;
    [k: string]: unknown;
  }) {
    const raw = Array.isArray(pack.stepsJson) ? pack.stepsJson : [];
    const steps = raw as Array<{
      placeId?: string;
      sortOrder?: number;
      freeText?: string;
      transportNote?: string;
      durationMin?: number;
      kind?: string;
    }>;
    const byId = await this.loadPlacesByIds(
      steps.map((s) => s.placeId).filter(Boolean) as string[],
    );
    const mapped = steps
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((s, i) => ({
        id: `pack-step-${i}`,
        sortOrder: s.sortOrder ?? i,
        freeText: s.freeText ?? null,
        transportNote: s.transportNote ?? null,
        durationMin: s.durationMin ?? null,
        placeId: s.placeId ?? null,
        kind: s.kind ?? null,
        place: s.placeId ? (byId.get(s.placeId) ?? null) : null,
      }));
    return {
      ...pack,
      steps: mapped,
      totals: {
        travelMin: 0,
        stayMin: mapped.reduce((a, s) => a + (s.durationMin ?? 0), 0),
        totalMin: mapped.reduce((a, s) => a + (s.durationMin ?? 0), 0),
        costMin: 0,
        costMax: 0,
        currency: 'TND',
      },
    };
  }
}
