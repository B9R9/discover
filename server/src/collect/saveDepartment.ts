import type { AreaId } from '@discover/shared';

import type { Sql } from '../db.ts';
import type { CollectedPlace } from './dedupe.ts';
import type { DepartmentSource } from './departments.ts';

type LatLon = [latitude: number, longitude: number];

export interface CollectedCity {
  id: AreaId;
  name: string;
  osmRelation: number;
  boundaryLines: LatLon[][];
}

// OSM boundary ways as GeoJSON lines; PostGIS assembles them with ST_BuildArea.
function linesJson(boundaryLines: LatLon[][]): string {
  return JSON.stringify({
    type: 'MultiLineString',
    coordinates: boundaryLines.map((line) => line.map(([lat, lon]) => [lon, lat])),
  });
}

// Replaces the department, its big cities and their OSM places in one transaction,
// so a place removed from OSM disappears. The department map has its big cities cut out.
export async function saveDepartment(
  sql: Sql,
  department: DepartmentSource,
  boundaryLines: LatLon[][],
  cities: readonly CollectedCity[],
  places: readonly CollectedPlace[],
): Promise<void> {
  // An empty result is far more likely a failed query than a department emptied overnight.
  if (places.length === 0 || boundaryLines.length === 0) {
    throw new Error(`Nothing collected for ${department.id}, keeping the current data`);
  }
  const ids = places.map((p) => p.id);
  const cityIds = cities.map((c) => c.id);

  await sql.begin(async (tx) => {
    const area = (lines: LatLon[][]) =>
      tx`ST_Multi(ST_BuildArea(ST_SetSRID(ST_GeomFromGeoJSON(${linesJson(lines)}), 4326)))`;
    await tx`
      insert into areas (id, name, osm_relation, department_id, boundary, updated_at)
      values (${department.id}, ${department.name}, ${department.osmRelation}, null,
        ${area(boundaryLines)}::geography, now())
      on conflict (id) do update set name = excluded.name, osm_relation = excluded.osm_relation,
        boundary = excluded.boundary, updated_at = excluded.updated_at`;
    for (const city of cities) {
      await tx`
        insert into areas (id, name, osm_relation, department_id, boundary, updated_at)
        values (${city.id}, ${city.name}, ${city.osmRelation}, ${department.id},
          ${area(city.boundaryLines)}::geography, now())
        on conflict (id) do update set name = excluded.name, osm_relation = excluded.osm_relation,
          department_id = excluded.department_id, boundary = excluded.boundary,
          updated_at = excluded.updated_at`;
    }
    // Neighbours across the border, and cities that fell under the threshold, lose their map.
    await tx`
      delete from areas c using areas d
      where d.id = ${department.id} and c.department_id = d.id
        and (c.id <> all(${tx.array(cityIds)}::text[])
          or not ST_Covers(d.boundary::geometry, ST_PointOnSurface(c.boundary::geometry)))`;
    await tx`
      update areas d set boundary = ST_Multi(ST_Difference(d.boundary::geometry,
          (select ST_Union(c.boundary::geometry) from areas c where c.department_id = d.id)))::geography
      where d.id = ${department.id}
        and exists (select 1 from areas c where c.department_id = d.id)`;
    await tx`
      insert into places (id, area_id, name, location, category, source, updated_at)
      select t.id, coalesce(
          (select c.id from areas c
           where c.department_id = ${department.id}
             and ST_Covers(c.boundary, ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography)
           limit 1),
          ${department.id}),
        t.name, ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography, t.category, 'osm', now()
      from unnest(${tx.array(ids)}::text[], ${tx.array(places.map((p) => p.name))}::text[],
        ${tx.array(places.map((p) => p.latitude))}::float8[],
        ${tx.array(places.map((p) => p.longitude))}::float8[],
        ${tx.array(places.map((p) => p.category))}::text[]) as t(id, name, lat, lon, category)
      on conflict (id) do update set area_id = excluded.area_id, name = excluded.name,
        location = excluded.location, category = excluded.category, updated_at = excluded.updated_at`;
    await tx`
      delete from places
      where source = 'osm' and id <> all(${tx.array(ids)}::text[])
        and area_id in (select id from areas where id = ${department.id} or department_id = ${department.id})`;
  });
}
