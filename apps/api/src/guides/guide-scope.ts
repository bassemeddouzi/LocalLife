import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  GuideAssignmentLevel,
  GuideProfile,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { haversineMeters } from '../shared/pagination';
import { zoneForCitySlug } from '../admin/city-zones';

export const SCOPE_RADIUS_METERS: Record<GuideAssignmentLevel, number> = {
  HOOD: 800,
  DISTRICT: 2_500,
  CITY: 8_000,
  STATE: 40_000,
  COUNTRY: 150_000,
};

export type GuideScope = {
  level: GuideAssignmentLevel;
  name: string;
  center: [number, number]; // [lng, lat]
  radiusMeters: number;
  countryId: string | null;
  regionId: string | null;
  cityId: string | null;
  districtId: string | null;
  hoodId: string | null;
};

export type GuideProfileForScope = GuideProfile & {
  country?: { id: string; name: string } | null;
  region?: { id: string; name: string } | null;
  baseCity?: {
    id: string;
    name: string;
    slug: string;
    latitude: Prisma.Decimal | number | null;
    longitude: Prisma.Decimal | number | null;
    countryId: string;
    regionId: string | null;
  } | null;
  primaryDistrict?: {
    id: string;
    name: string;
    latitude: Prisma.Decimal | number;
    longitude: Prisma.Decimal | number;
    cityId: string;
  } | null;
  hood?: {
    id: string;
    name: string;
    latitude: Prisma.Decimal | number;
    longitude: Prisma.Decimal | number;
    districtId: string;
  } | null;
};

function num(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v == null) return null;
  return typeof v === 'number' ? v : Number(v);
}

/** Approximate circle as GeoJSON Polygon (lng/lat rings). */
export function scopeCircleGeoJson(
  center: [number, number],
  radiusMeters: number,
  steps = 64,
): {
  type: 'Polygon';
  coordinates: [number, number][][];
} {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos(latRad);
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.sin(theta)) / metersPerDegLat;
    const dLng = (radiusMeters * Math.cos(theta)) / metersPerDegLng;
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

export function pointInScope(
  lat: number,
  lng: number,
  scope: GuideScope,
): boolean {
  return (
    haversineMeters(lat, lng, scope.center[1], scope.center[0]) <=
    scope.radiusMeters
  );
}

export async function resolveGuideScope(
  prisma: PrismaService,
  profile: GuideProfileForScope,
): Promise<GuideScope> {
  const level = profile.assignmentLevel ?? GuideAssignmentLevel.DISTRICT;
  const radiusMeters = SCOPE_RADIUS_METERS[level];

  if (level === GuideAssignmentLevel.HOOD) {
    const hood =
      profile.hood ??
      (profile.hoodId
        ? await prisma.hood.findUnique({ where: { id: profile.hoodId } })
        : null);
    if (!hood) {
      throw new BadRequestException('Guide hood assignment is incomplete');
    }
    const district =
      profile.primaryDistrict ??
      (await prisma.district.findUnique({ where: { id: hood.districtId } }));
    const city =
      profile.baseCity ??
      (district
        ? await prisma.city.findUnique({ where: { id: district.cityId } })
        : null);
    return {
      level,
      name: hood.name,
      center: [num(hood.longitude)!, num(hood.latitude)!],
      radiusMeters,
      countryId: city?.countryId ?? profile.countryId,
      regionId: city?.regionId ?? profile.regionId,
      cityId: city?.id ?? profile.baseCityId,
      districtId: hood.districtId,
      hoodId: hood.id,
    };
  }

  if (level === GuideAssignmentLevel.DISTRICT) {
    const district =
      profile.primaryDistrict ??
      (profile.primaryDistrictId
        ? await prisma.district.findUnique({
            where: { id: profile.primaryDistrictId },
          })
        : null);
    if (!district) {
      throw new BadRequestException('Guide district assignment is incomplete');
    }
    const city =
      profile.baseCity ??
      (await prisma.city.findUnique({ where: { id: district.cityId } }));
    return {
      level,
      name: district.name,
      center: [num(district.longitude)!, num(district.latitude)!],
      radiusMeters,
      countryId: city?.countryId ?? profile.countryId,
      regionId: city?.regionId ?? profile.regionId,
      cityId: district.cityId,
      districtId: district.id,
      hoodId: null,
    };
  }

  if (level === GuideAssignmentLevel.CITY) {
    const city =
      profile.baseCity ??
      (profile.baseCityId
        ? await prisma.city.findUnique({ where: { id: profile.baseCityId } })
        : null);
    if (!city) {
      throw new BadRequestException('Guide city assignment is incomplete');
    }
    let lat = num(city.latitude);
    let lng = num(city.longitude);
    const zone = zoneForCitySlug(city.slug);
    if ((lat == null || lng == null) && zone) {
      lng = zone.center[0];
      lat = zone.center[1];
    }
    if (lat == null || lng == null) {
      throw new BadRequestException('Guide city has no coordinates');
    }
    return {
      level,
      name: city.name,
      center: [lng, lat],
      radiusMeters,
      countryId: city.countryId,
      regionId: city.regionId,
      cityId: city.id,
      districtId: null,
      hoodId: null,
    };
  }

  if (level === GuideAssignmentLevel.STATE) {
    const regionId = profile.regionId;
    if (!regionId) {
      throw new BadRequestException('Guide state assignment is incomplete');
    }
    const region =
      profile.regionId
        ? await prisma.region.findUnique({ where: { id: profile.regionId } })
        : null;
    if (!region) {
      throw new BadRequestException('Guide state (region) not found');
    }
    const cities = await prisma.city.findMany({
      where: { regionId, status: 'ACTIVE' },
      select: { latitude: true, longitude: true },
    });
    const pts = cities
      .map((c) => ({ lat: num(c.latitude), lng: num(c.longitude) }))
      .filter((p): p is { lat: number; lng: number } => p.lat != null && p.lng != null);
    if (pts.length === 0) {
      throw new BadRequestException('State has no city coordinates');
    }
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    return {
      level,
      name: region.name,
      center: [lng, lat],
      radiusMeters,
      countryId: region.countryId,
      regionId: region.id,
      cityId: null,
      districtId: null,
      hoodId: null,
    };
  }

  // COUNTRY
  const countryId = profile.countryId;
  if (!countryId) {
    throw new BadRequestException('Guide country assignment is incomplete');
  }
  const country =
    profile.country ??
    (await prisma.country.findUnique({ where: { id: countryId } }));
  if (!country) {
    throw new BadRequestException('Guide country not found');
  }
  const featured = await prisma.city.findFirst({
    where: { countryId, status: 'ACTIVE' },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    select: { latitude: true, longitude: true, slug: true },
  });
  let lat = num(featured?.latitude);
  let lng = num(featured?.longitude);
  if ((lat == null || lng == null) && featured?.slug) {
    const zone = zoneForCitySlug(featured.slug);
    if (zone) {
      lng = zone.center[0];
      lat = zone.center[1];
    }
  }
  if (lat == null || lng == null) {
    // Tunisia fallback
    lat = 34.0;
    lng = 9.5;
  }
  return {
    level,
    name: country.name,
    center: [lng, lat],
    radiusMeters,
    countryId: country.id,
    regionId: null,
    cityId: null,
    districtId: null,
    hoodId: null,
  };
}

export async function assertGuidePointInScope(
  prisma: PrismaService,
  userId: string,
  lat: number,
  lng: number,
) {
  const profile = await prisma.guideProfile.findUnique({
    where: { userId },
    include: {
      country: { select: { id: true, name: true } },
      region: { select: { id: true, name: true } },
      baseCity: true,
      primaryDistrict: true,
      hood: true,
    },
  });
  if (!profile) {
    throw new ForbiddenException('Guide profile not found');
  }
  const scope = await resolveGuideScope(prisma, profile);
  if (!pointInScope(lat, lng, scope)) {
    throw new ForbiddenException(
      `Location is outside your assigned ${scope.level.toLowerCase()} zone (${scope.name})`,
    );
  }
  return scope;
}

/** Tips without coords: city must belong to assignment chain. */
export async function assertGuideCityInScope(
  prisma: PrismaService,
  userId: string,
  cityId: string | undefined | null,
) {
  if (!cityId) {
    throw new BadRequestException('cityId is required');
  }
  const profile = await prisma.guideProfile.findUnique({
    where: { userId },
    include: {
      country: { select: { id: true, name: true } },
      region: { select: { id: true, name: true } },
      baseCity: true,
      primaryDistrict: true,
      hood: true,
    },
  });
  if (!profile) {
    throw new ForbiddenException('Guide profile not found');
  }
  const scope = await resolveGuideScope(prisma, profile);
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new BadRequestException('cityId not found');

  if (scope.level === GuideAssignmentLevel.COUNTRY) {
    if (city.countryId !== scope.countryId) {
      throw new ForbiddenException('City is outside your assigned country');
    }
    return scope;
  }
  if (scope.level === GuideAssignmentLevel.STATE) {
    if (city.regionId !== scope.regionId) {
      throw new ForbiddenException('City is outside your assigned state');
    }
    return scope;
  }
  // HOOD / DISTRICT / CITY → same city
  if (scope.cityId && city.id !== scope.cityId) {
    throw new ForbiddenException('City is outside your assigned zone');
  }
  return scope;
}

export const guideProfileScopeInclude = {
  country: { select: { id: true, name: true } },
  region: { select: { id: true, name: true } },
  baseCity: {
    select: {
      id: true,
      name: true,
      slug: true,
      latitude: true,
      longitude: true,
      countryId: true,
      regionId: true,
    },
  },
  primaryDistrict: {
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      cityId: true,
    },
  },
  hood: {
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      districtId: true,
    },
  },
  user: { select: { id: true, email: true, displayName: true } },
} as const;
