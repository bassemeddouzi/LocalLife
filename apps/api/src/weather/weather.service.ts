import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCacheService } from '../shared/memory-cache.service';

export type WeatherLabel = 'rain' | 'cold' | 'heat' | 'windy' | 'fair';

export type WeatherDay = {
  date: string;
  weathercode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  windMaxKmh: number;
  label: WeatherLabel;
};

export type CityWeather = {
  cityId: string;
  current: {
    tempC: number;
    weathercode: number;
    precipitationMm: number;
    windKmh: number;
    label: WeatherLabel;
  } | null;
  daily: WeatherDay[];
  fetchedAt: string;
  source: 'openmeteo';
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
};

const CACHE_TTL_MS = 45 * 60_000;

function labelFrom(
  code: number,
  tempMaxC: number,
  precipMm: number,
  windKmh: number,
): WeatherLabel {
  // WMO weather interpretation codes: rain/drizzle/thunderstorms
  if (precipMm >= 2 || (code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
    return 'rain';
  }
  if (windKmh >= 40) return 'windy';
  if (tempMaxC >= 32) return 'heat';
  if (tempMaxC <= 16) return 'cold';
  return 'fair';
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  async getCityForecast(
    cityId: string,
    forecastDays = 14,
  ): Promise<CityWeather | null> {
    const days = Math.min(Math.max(forecastDays, 1), 14);
    const cacheKey = `weather:city:${cityId}:${days}`;
    const cached = this.cache.get<CityWeather>(cacheKey);
    if (cached) return cached;

    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true, latitude: true, longitude: true },
    });
    if (!city) return null;

    const lat = Number(city.latitude);
    const lng = Number(city.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    try {
      const payload = await this.fetchOpenMeteo(lat, lng, days);
      const result = this.normalize(cityId, payload);
      this.cache.set(cacheKey, result, CACHE_TTL_MS);
      return result;
    } catch (err) {
      this.logger.warn(
        `Weather fetch failed for ${cityId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  private async fetchOpenMeteo(
    lat: number,
    lng: number,
    forecastDays: number,
  ): Promise<OpenMeteoResponse> {
    const apiKey = (process.env.WEATHER_API_KEY ?? '').trim();
    const base = apiKey
      ? 'https://customer-api.open-meteo.com/v1/forecast'
      : 'https://api.open-meteo.com/v1/forecast';

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      timezone: 'auto',
      forecast_days: String(forecastDays),
      current: 'temperature_2m,precipitation,weather_code,wind_speed_10m',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    });
    if (apiKey) params.set('apikey', apiKey);

    const res = await fetch(`${base}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }
    return (await res.json()) as OpenMeteoResponse;
  }

  private normalize(cityId: string, raw: OpenMeteoResponse): CityWeather {
    const daily: WeatherDay[] = [];
    const times = raw.daily?.time ?? [];
    for (let i = 0; i < times.length; i++) {
      const weathercode = Number(raw.daily?.weather_code?.[i] ?? 0);
      const tempMaxC = Number(raw.daily?.temperature_2m_max?.[i] ?? 25);
      const tempMinC = Number(raw.daily?.temperature_2m_min?.[i] ?? 18);
      const precipitationMm = Number(raw.daily?.precipitation_sum?.[i] ?? 0);
      const windMaxKmh = Number(raw.daily?.wind_speed_10m_max?.[i] ?? 0);
      daily.push({
        date: times[i],
        weathercode,
        tempMaxC,
        tempMinC,
        precipitationMm,
        windMaxKmh,
        label: labelFrom(weathercode, tempMaxC, precipitationMm, windMaxKmh),
      });
    }

    let current: CityWeather['current'] = null;
    if (raw.current) {
      const tempC = Number(raw.current.temperature_2m ?? 25);
      const weathercode = Number(raw.current.weather_code ?? 0);
      const precipitationMm = Number(raw.current.precipitation ?? 0);
      const windKmh = Number(raw.current.wind_speed_10m ?? 0);
      current = {
        tempC,
        weathercode,
        precipitationMm,
        windKmh,
        label: labelFrom(weathercode, tempC, precipitationMm, windKmh),
      };
    }

    return {
      cityId,
      current,
      daily,
      fetchedAt: new Date().toISOString(),
      source: 'openmeteo',
    };
  }
}
