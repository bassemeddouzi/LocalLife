import { apiFetch } from '../../../api/client';

export type GuideZone = {
  level: string;
  name: string;
  center: [number, number];
  radiusMeters: number;
  circleGeoJson: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  pins: Array<{
    id: string;
    kind: string;
    title: string;
    status: string;
    latitude: number;
    longitude: number;
  }>;
};

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function pointInGuideZone(
  lat: number,
  lng: number,
  zone: Pick<GuideZone, 'center' | 'radiusMeters'>,
): boolean {
  return (
    haversineMeters(lat, lng, zone.center[1], zone.center[0]) <=
    zone.radiusMeters
  );
}

/** Rough Mapbox zoom so the assignment circle fills most of the viewport. */
export function zoomForRadiusMeters(radiusMeters: number): number {
  if (radiusMeters <= 1_000) return 14;
  if (radiusMeters <= 3_000) return 12.5;
  if (radiusMeters <= 10_000) return 11;
  if (radiusMeters <= 50_000) return 9;
  return 7.5;
}

export async function fetchGuideZone(): Promise<GuideZone> {
  return apiFetch<GuideZone>('/v1/guides/me/zone');
}

/** Approximate circle as GeoJSON Polygon (lng/lat rings) — mirrors API scopeCircleGeoJson. */
export function buildCircleGeoJson(
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
