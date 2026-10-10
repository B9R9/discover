import type { City, CityId, Place } from '@discover/shared';
import type { MultiPolygon } from 'geojson';

import type { Sql } from '../db.ts';

export interface PlacesStore {
  listCities(): Promise<City[]>;
  // null when the city is unknown.
  listPlaces(cityId: CityId): Promise<Place[] | null>;
}

// About 50 m: enough to tell which city the phone is in, and keeps the reply small.
const BOUNDARY_TOLERANCE_DEGREES = 0.0005;

function parseBoundary(json: string): MultiPolygon {
  const value: unknown = JSON.parse(json);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('type' in value) ||
    value.type !== 'MultiPolygon'
  ) {
    throw new Error('City boundary is not a MultiPolygon');
  }
  return value as MultiPolygon;
}

export function postgresPlacesStore(sql: Sql): PlacesStore {
  return {
    async listCities() {
      const rows = await sql<{ id: string; name: string; boundary: string }[]>`
        select id, name,
          ST_AsGeoJSON(ST_Multi(ST_Simplify(boundary::geometry, ${BOUNDARY_TOLERANCE_DEGREES})), 6) as boundary
        from cities order by name`;
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        boundary: parseBoundary(row.boundary),
      }));
    },

    async listPlaces(cityId) {
      const [city] = await sql`select 1 from cities where id = ${cityId}`;
      if (!city) return null;
      return sql<Place[]>`
        select id, city_id as "cityId", name,
          ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, category
        from places where city_id = ${cityId} order by name`;
    },
  };
}
