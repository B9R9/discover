import type { Area, AreaId, Place } from '@discover/shared';
import type { MultiPolygon } from 'geojson';

import type { Sql } from '../db.ts';

export interface PlacesStore {
  listAreas(): Promise<Area[]>;
  // null when the area is unknown.
  listPlaces(areaId: AreaId): Promise<Place[] | null>;
}

// About 50 m: enough to tell which area the phone is in, and keeps the reply small.
const BOUNDARY_TOLERANCE_DEGREES = 0.0005;

function parseBoundary(json: string): MultiPolygon {
  const value: unknown = JSON.parse(json);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('type' in value) ||
    value.type !== 'MultiPolygon'
  ) {
    throw new Error('Area boundary is not a MultiPolygon');
  }
  return value as MultiPolygon;
}

export function postgresPlacesStore(sql: Sql): PlacesStore {
  return {
    async listAreas() {
      const rows = await sql<
        { id: string; name: string; departmentId: string | null; boundary: string }[]
      >`
        select id, name, department_id as "departmentId",
          ST_AsGeoJSON(ST_Multi(ST_Simplify(boundary::geometry, ${BOUNDARY_TOLERANCE_DEGREES})), 6) as boundary
        from areas order by name`;
      return rows.map((row) => ({ ...row, boundary: parseBoundary(row.boundary) }));
    },

    async listPlaces(areaId) {
      const [area] = await sql`select 1 from areas where id = ${areaId}`;
      if (!area) return null;
      return sql<Place[]>`
        select id, area_id as "areaId", name,
          ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude, category
        from places where area_id = ${areaId} order by name`;
    },
  };
}
