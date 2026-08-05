import { Injectable } from '@nestjs/common';
import { PriceLevel, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CityWeather,
  WeatherDay,
  WeatherLabel,
} from '../weather/weather.service';

export type WeatherPrefs = {
  hatesCold?: boolean;
  hatesHeat?: boolean;
  avoidRainOutdoors?: boolean;
};

export type GenPrefs = {
  hasPrivateTransport: boolean;
  budgetBand: 'LOW' | 'MEDIUM' | 'HIGH';
  conservatismLevel: string;
  groupType: string;
  mood: string;
  needsText?: string;
  weatherPrefs?: WeatherPrefs;
};

export type TripWindow = {
  tripStartsOn: Date;
  tripEndsOn: Date;
  dailyStartLocal: string;
  dailyEndLocal: string;
};

export type GeneratedStep = {
  sortOrder: number;
  dayIndex: number;
  kind: string;
  freeText: string;
  durationMin: number;
  placeId?: string;
  startsAt?: string;
  transportNote?: string;
  whyJson?: Record<string, unknown>;
};

export type GeneratedCandidate = {
  id: string;
  code: string;
  title: string;
  summary: string;
  score: number;
  why: string;
  recommended: boolean;
  bias: 'calm_budget' | 'fun_social';
  generated: true;
  tripStartsOn: string;
  tripEndsOn: string;
  dailyStartLocal: string;
  dailyEndLocal: string;
  steps: GeneratedStep[];
  stepsPreview: string[];
};

type PlaceRow = {
  id: string;
  name: string;
  summary: string;
  latitude: number;
  longitude: number;
  priceLevel: PriceLevel | null;
  categoryKey: string;
  distanceKm: number;
};

type Situation = 'arrival' | 'on_island_day' | 'health' | 'transport_only';

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(':').map((x) => Number(x));
  return {
    h: Number.isFinite(h) ? h : 10,
    m: Number.isFinite(m) ? m : 0,
  };
}

function dateAtLocal(
  day: Date,
  hm: string,
): Date {
  const { h, m } = parseHm(hm);
  const d = new Date(day);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayCount(start: Date, end: Date): number {
  const a = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const b = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(1, Math.floor((b - a) / 86_400_000) + 1);
}

@Injectable()
export class PlanGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  detectSituation(needsText?: string): Situation {
    const t = (needsText ?? '').toLowerCase();
    if (/airport|landing|just arrived|arriv|مطار|وصول|هبط/.test(t)) {
      return 'arrival';
    }
    if (/hospital|clinic|pharmacy|صيدل|مستشفى|عيادة|doctor|emergency/.test(t)) {
      return 'health';
    }
    if (/transport only|only transport|فقط نقل|غير نقل/.test(t)) {
      return 'transport_only';
    }
    return 'on_island_day';
  }

  async generateCandidates(input: {
    cityId: string;
    userId: string;
    prefs: GenPrefs;
    window: TripWindow;
    weather?: CityWeather | null;
    lat?: number;
    lng?: number;
  }): Promise<GeneratedCandidate[]> {
    const situation = this.detectSituation(input.prefs.needsText);
    if (
      situation === 'arrival' ||
      situation === 'health' ||
      situation === 'transport_only'
    ) {
      return [];
    }

    const city = await this.prisma.city.findUnique({
      where: { id: input.cityId },
      select: { latitude: true, longitude: true, name: true },
    });
    const originLat =
      typeof input.lat === 'number' && Number.isFinite(input.lat)
        ? input.lat
        : Number(city?.latitude ?? 33.8075);
    const originLng =
      typeof input.lng === 'number' && Number.isFinite(input.lng)
        ? input.lng
        : Number(city?.longitude ?? 10.8451);

    const needs = (input.prefs.needsText ?? '').toLowerCase();
    const heatFromNotes = /hot|heat|chaud|حر|سخون|sun/.test(needs);
    const safetyAware = /safe|safety|آمن|أمان|امن/.test(needs);
    const startLater = /2\s*h|two hour|dans 2|بعد ساعت|start in/.test(needs);

    const days = Math.min(
      14,
      dayCount(input.window.tripStartsOn, input.window.tripEndsOn),
    );

    const places = await this.loadPlaces({
      cityId: input.cityId,
      categoryKeys: [
        'cafes',
        'restaurants',
        'beaches',
        'shops_souks',
        'activities',
        'museums',
        'nightlife',
      ],
      originLat,
      originLng,
      prefs: input.prefs,
      safetyAware,
      excludeAirport: true,
      excludeHospitals: true,
    });

    if (places.length < 2) return [];

    const calm = this.buildTripPlan({
      bias: 'calm_budget',
      places,
      prefs: input.prefs,
      window: input.window,
      days,
      weather: input.weather,
      heatFromNotes,
      startLater,
      cityName: city?.name ?? 'Djerba',
      situation,
    });
    const fun = this.buildTripPlan({
      bias: 'fun_social',
      places,
      prefs: input.prefs,
      window: input.window,
      days,
      weather: input.weather,
      heatFromNotes,
      startLater,
      cityName: city?.name ?? 'Djerba',
      situation,
      avoidPlaceIds: new Set(
        calm.steps.map((s) => s.placeId).filter(Boolean) as string[],
      ),
    });

    const out: GeneratedCandidate[] = [];
    if (calm.steps.length >= 2) {
      out.push({
        ...calm,
        id: `gen-calm-${Date.now()}`,
        recommended: true,
      });
    }
    if (fun.steps.length >= 2) {
      out.push({
        ...fun,
        id: `gen-fun-${Date.now() + 1}`,
        recommended: out.length === 0,
      });
    }
    return out.slice(0, 2);
  }

  private weatherForDay(
    weather: CityWeather | null | undefined,
    day: Date,
  ): WeatherDay | null {
    if (!weather?.daily?.length) return null;
    const key = ymd(day);
    return weather.daily.find((d) => d.date === key) ?? weather.daily[0] ?? null;
  }

  private flowForDay(input: {
    bias: 'calm_budget' | 'fun_social';
    label: WeatherLabel | null;
    prefs: GenPrefs;
    heatFromNotes: boolean;
    isLastDay: boolean;
    isFirstDay: boolean;
    endAllowsNightlife: boolean;
  }): string[][] {
    const wp = input.prefs.weatherPrefs ?? {};
    const rain = input.label === 'rain';
    const heat =
      input.label === 'heat' ||
      input.heatFromNotes ||
      Boolean(wp.hatesHeat && input.label === 'fair');
    const cold =
      input.label === 'cold' ||
      Boolean(wp.hatesCold && input.label === 'windy');

    // Prefer indoor when raining, or when cold / cold-sensitive + windy
    if (rain || cold) {
      return input.bias === 'calm_budget'
        ? [
            ['cafes'],
            ['museums', 'shops_souks'],
            ['restaurants'],
            ['shops_souks', 'cafes'],
          ]
        : [
            ['shops_souks', 'museums'],
            ['restaurants'],
            ['cafes', 'activities'],
            ['restaurants', 'nightlife'],
          ];
    }

    if (heat) {
      return input.bias === 'calm_budget'
        ? [
            ['cafes'],
            ['beaches', 'museums'],
            ['restaurants'],
            ['shops_souks', 'cafes'],
          ]
        : [
            ['beaches'],
            ['restaurants'],
            ['activities', 'shops_souks'],
            ['cafes', 'nightlife'],
          ];
    }

    const calm: string[][] = [
      ['cafes', 'restaurants'],
      ['shops_souks', 'museums'],
      ['beaches', 'activities'],
      ['restaurants', 'cafes'],
    ];
    const fun: string[][] = [
      ['activities', 'beaches'],
      ['restaurants'],
      ['shops_souks', 'activities'],
      ['nightlife', 'cafes', 'restaurants'],
    ];

    let flow = input.bias === 'calm_budget' ? calm : fun;
    if (input.isLastDay) {
      flow = flow.slice(0, 3);
    }
    if (input.isFirstDay && input.bias === 'calm_budget') {
      flow = [['cafes'], ...flow.slice(1)];
    }
    if (!input.endAllowsNightlife) {
      flow = flow.map((cats) => cats.filter((c) => c !== 'nightlife'));
      flow = flow.map((cats) =>
        cats.length ? cats : ['cafes', 'restaurants'],
      );
    }
    return flow;
  }

  private buildTripPlan(input: {
    bias: 'calm_budget' | 'fun_social';
    places: PlaceRow[];
    prefs: GenPrefs;
    window: TripWindow;
    days: number;
    weather?: CityWeather | null;
    heatFromNotes: boolean;
    startLater: boolean;
    cityName: string;
    situation: Situation;
    avoidPlaceIds?: Set<string>;
  }): Omit<GeneratedCandidate, 'id' | 'recommended'> {
    const used = new Set<string>(input.avoidPlaceIds ?? []);
    const steps: GeneratedStep[] = [];
    let sortOrder = 0;

    const startHm = input.startLater
      ? this.shiftHm(input.window.dailyStartLocal, 120)
      : input.window.dailyStartLocal;
    const endHm = input.window.dailyEndLocal || '22:00';
    const endAllowsNightlife = parseHm(endHm).h >= 21;

    for (let dayIndex = 0; dayIndex < input.days; dayIndex++) {
      const dayDate = new Date(input.window.tripStartsOn);
      dayDate.setUTCDate(dayDate.getUTCDate() + dayIndex);
      const wday = this.weatherForDay(input.weather, dayDate);
      const label = wday?.label ?? null;

      const flow = this.flowForDay({
        bias: input.bias,
        label,
        prefs: input.prefs,
        heatFromNotes: input.heatFromNotes,
        isLastDay: dayIndex === input.days - 1 && input.days > 1,
        isFirstDay: dayIndex === 0,
        endAllowsNightlife:
          endAllowsNightlife && input.bias === 'fun_social',
      });

      const durations =
        input.bias === 'calm_budget' ? [40, 75, 55, 45] : [70, 55, 70, 60];
      let cursor = dateAtLocal(dayDate, startHm);
      const dayEnd = dateAtLocal(dayDate, endHm);
      const transportBuffer = input.prefs.hasPrivateTransport ? 15 : 25;

      const pick = (keys: string[]) => {
        const hit = input.places.find(
          (p) => !used.has(p.id) && keys.includes(p.categoryKey),
        );
        if (hit) {
          used.add(hit.id);
          return hit;
        }
        const any = input.places.find((p) => !used.has(p.id));
        if (any) {
          used.add(any.id);
          return any;
        }
        return null;
      };

      let stopsThisDay = 0;
      for (let i = 0; i < flow.length; i++) {
        const remainMin = (dayEnd.getTime() - cursor.getTime()) / 60_000;
        const stay = durations[i] ?? 50;
        if (remainMin < stay + transportBuffer + 20) break;

        const place = pick(flow[i]);
        if (!place) break;

        const kind =
          place.categoryKey === 'restaurants' || place.categoryKey === 'cafes'
            ? 'FOOD'
            : place.categoryKey === 'beaches'
              ? 'BEACH'
              : place.categoryKey === 'nightlife'
                ? 'NIGHT'
                : 'PLACE';

        steps.push({
          sortOrder: sortOrder++,
          dayIndex,
          kind,
          freeText: place.name,
          durationMin: stay,
          placeId: place.id,
          startsAt: cursor.toISOString(),
          transportNote: input.prefs.hasPrivateTransport
            ? 'Private / taxi hop'
            : place.distanceKm < 1.2
              ? 'Walkable from previous stop'
              : 'Louage or taxi — agree fare',
          whyJson: {
            kind,
            dayIndex,
            weatherLabel: label,
            reason: `${place.categoryKey}${
              label ? ` · ${label}` : ''
            } · ~${place.distanceKm.toFixed(1)} km`,
            distanceKm: place.distanceKm,
          },
        });
        cursor = addMinutes(cursor, stay + transportBuffer);
        stopsThisDay++;
      }

      while (stopsThisDay < 2) {
        const place = input.places.find((p) => !used.has(p.id));
        if (!place) break;
        used.add(place.id);
        steps.push({
          sortOrder: sortOrder++,
          dayIndex,
          kind: 'PLACE',
          freeText: place.name,
          durationMin: 50,
          placeId: place.id,
          startsAt: cursor.toISOString(),
          whyJson: {
            kind: 'PLACE',
            dayIndex,
            weatherLabel: label,
            reason: place.summary.slice(0, 80),
          },
        });
        cursor = addMinutes(cursor, 50 + transportBuffer);
        stopsThisDay++;
      }

      // Return / rest when a back-by window is set
      if (input.window.dailyEndLocal) {
        const returnAt =
          cursor < dayEnd ? cursor : addMinutes(dayEnd, -15);
        steps.push({
          sortOrder: sortOrder++,
          dayIndex,
          kind: 'RETURN',
          freeText: 'Return / rest for the night',
          durationMin: 20,
          startsAt: returnAt.toISOString(),
          whyJson: {
            kind: 'RETURN',
            isReturnHome: true,
            dayIndex,
            reason: `Back by ${endHm}`,
          },
        });
      }
    }

    const dayPreviews: string[] = [];
    for (let d = 0; d < input.days; d++) {
      const names = steps
        .filter((s) => s.dayIndex === d && s.kind !== 'RETURN')
        .map((s) => s.freeText)
        .slice(0, 2);
      if (names.length) dayPreviews.push(`Day${d + 1}: ${names.join(', ')}`);
    }

    const weatherNote = input.weather?.daily?.[0]?.label
      ? `Weather-aware (${input.weather.daily[0].label})`
      : 'Based on your brief';
    const span =
      input.days === 1
        ? '1 day'
        : `${input.days} days`;
    const moodLabel =
      input.bias === 'calm_budget' ? 'Calm & practical' : 'More exploratory';

    return {
      code: `gen_${input.bias}_${input.days}d`,
      title:
        input.bias === 'calm_budget'
          ? `Easy ${input.cityName} · ${span}`
          : `Active ${input.cityName} · ${span}`,
      summary: dayPreviews.slice(0, 3).join(' · '),
      score:
        70 +
        Math.min(steps.length, 20) +
        (input.prefs.mood === 'CALM' && input.bias === 'calm_budget' ? 10 : 0),
      why: [moodLabel, weatherNote, `${startHm}–${endHm}`]
        .filter(Boolean)
        .join(' · '),
      bias: input.bias,
      generated: true,
      tripStartsOn: input.window.tripStartsOn.toISOString(),
      tripEndsOn: input.window.tripEndsOn.toISOString(),
      dailyStartLocal: startHm,
      dailyEndLocal: endHm,
      steps,
      stepsPreview: dayPreviews.length
        ? dayPreviews
        : steps.map((s) => s.freeText).slice(0, 5),
    };
  }

  private shiftHm(hm: string, addMin: number): string {
    const { h, m } = parseHm(hm);
    const total = h * 60 + m + addMin;
    const nh = Math.min(20, Math.floor(total / 60));
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  }

  private async loadPlaces(input: {
    cityId: string;
    categoryKeys: string[];
    originLat: number;
    originLng: number;
    prefs: GenPrefs;
    safetyAware: boolean;
    excludeAirport: boolean;
    excludeHospitals: boolean;
  }): Promise<PlaceRow[]> {
    const categories = await this.prisma.category.findMany({
      where: { key: { in: input.categoryKeys } },
      select: { id: true, key: true },
    });
    const catIds = categories.map((c) => c.id);
    if (!catIds.length) return [];

    const rows = await this.prisma.place.findMany({
      where: {
        cityId: input.cityId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
        primaryCategoryId: { in: catIds },
        ...(input.excludeHospitals
          ? {
              NOT: {
                primaryCategory: {
                  key: { in: ['hospitals', 'pharmacies'] },
                },
              },
            }
          : {}),
      },
      take: 120,
      orderBy: [{ freshnessScore: 'desc' }, { popularityScore: 'desc' }],
      select: {
        id: true,
        name: true,
        summary: true,
        latitude: true,
        longitude: true,
        priceLevel: true,
        slug: true,
        primaryCategory: { select: { key: true } },
      },
    });

    const budgetOk = (p: (typeof rows)[0]) => {
      if (input.prefs.budgetBand === 'LOW') {
        return (
          p.priceLevel == null ||
          p.priceLevel === PriceLevel.FREE ||
          p.priceLevel === PriceLevel.BUDGET
        );
      }
      if (input.prefs.budgetBand === 'MEDIUM') {
        return p.priceLevel !== PriceLevel.LUXURY;
      }
      return true;
    };

    return rows
      .filter((p) => {
        if (
          input.excludeAirport &&
          /airport|مطار/i.test(`${p.slug} ${p.name}`)
        ) {
          return false;
        }
        return budgetOk(p);
      })
      .map((p) => {
        const latitude = Number(p.latitude);
        const longitude = Number(p.longitude);
        const distanceKm = haversineKm(
          input.originLat,
          input.originLng,
          latitude,
          longitude,
        );
        return {
          id: p.id,
          name: p.name,
          summary: p.summary,
          latitude,
          longitude,
          priceLevel: p.priceLevel,
          categoryKey: p.primaryCategory?.key ?? 'place',
          distanceKm,
        };
      })
      .sort((a, b) => {
        const da =
          a.distanceKm + (input.safetyAware && a.distanceKm > 12 ? 5 : 0);
        const db =
          b.distanceKm + (input.safetyAware && b.distanceKm > 12 ? 5 : 0);
        return da - db;
      });
  }
}
