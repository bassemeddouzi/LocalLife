/**
 * Approximate service-zone polygons for ACTIVE cities (MVP).
 * GeoJSON uses [lng, lat]. Refine later with real GeoBoundary rows.
 */
export type CityPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][];
};

export type CityZone = {
  slug: string;
  name: string;
  /** Mapbox-friendly default view [lng, lat] */
  center: [number, number];
  zoom: number;
  polygon: CityPolygon;
};

/** Rough outline of Djerba island (Tunisia) — ops overlay only, not cadastral. */
const DJERBA_RING: [number, number][] = [
  [10.72, 33.88],
  [10.78, 33.95],
  [10.9, 33.975],
  [11.02, 33.95],
  [11.1, 33.9],
  [11.14, 33.82],
  [11.12, 33.72],
  [11.05, 33.66],
  [10.92, 33.64],
  [10.8, 33.66],
  [10.72, 33.72],
  [10.69, 33.8],
  [10.72, 33.88],
];

export const CITY_ZONES: Record<string, CityZone> = {
  djerba: {
    slug: 'djerba',
    name: 'Djerba',
    center: [10.86, 33.81],
    zoom: 10.2,
    polygon: {
      type: 'Polygon',
      coordinates: [DJERBA_RING],
    },
  },
};

export function zoneForCitySlug(slug: string): CityZone | null {
  return CITY_ZONES[slug] ?? null;
}
