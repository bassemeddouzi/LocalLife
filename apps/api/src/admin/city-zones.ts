/**
 * Service-zone polygons for ACTIVE cities (admin map overlay).
 * Djerba coastline simplified from OpenStreetMap relation 2682627.
 */
import { DJERBA_RING } from './djerba-ring';

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

export const CITY_ZONES: Record<string, CityZone> = {
  djerba: {
    slug: 'djerba',
    name: 'Djerba',
    center: [10.86, 33.81],
    zoom: 10.4,
    polygon: {
      type: 'Polygon',
      coordinates: [DJERBA_RING],
    },
  },
};

export function zoneForCitySlug(slug: string): CityZone | null {
  return CITY_ZONES[slug] ?? null;
}
