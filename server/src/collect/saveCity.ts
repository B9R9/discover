import type { Sql } from '../db.ts';
import type { CitySource } from './cities.ts';
import type { CollectedPlace } from './dedupe.ts';

type LatLon = [latitude: number, longitude: number];

// Replaces the city's OSM places in one transaction, so a place removed from OSM disappears.
export async function saveCity(
  sql: Sql,
  city: CitySource,
  boundaryLines: LatLon[][],
  places: readonly CollectedPlace[],
): Promise<void> {
  // An empty result is far more likely a failed query than a city emptied overnight.
  if (places.length === 0 || boundaryLines.length === 0) {
    throw new Error(`Nothing collected for ${city.id}, keeping the current data`);
  }
  const lines = JSON.stringify({
    type: 'MultiLineString',
    coordinates: boundaryLines.map((line) => line.map(([lat, lon]) => [lon, lat])),
  });
  const ids = places.map((p) => p.id);

  await sql.begin(async (tx) => {
    await tx`
      insert into cities (id, name, osm_relation, boundary, updated_at)
      values (${city.id}, ${city.name}, ${city.osmRelation},
        ST_Multi(ST_BuildArea(ST_SetSRID(ST_GeomFromGeoJSON(${lines}), 4326)))::geography, now())
      on conflict (id) do update set name = excluded.name, osm_relation = excluded.osm_relation,
        boundary = excluded.boundary, updated_at = excluded.updated_at`;
    await tx`
      insert into places (id, city_id, name, location, category, source, updated_at)
      select id, ${city.id}, name, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, category, 'osm', now()
      from unnest(${tx.array(ids)}::text[], ${tx.array(places.map((p) => p.name))}::text[],
        ${tx.array(places.map((p) => p.latitude))}::float8[],
        ${tx.array(places.map((p) => p.longitude))}::float8[],
        ${tx.array(places.map((p) => p.category))}::text[]) as t(id, name, lat, lon, category)
      on conflict (id) do update set city_id = excluded.city_id, name = excluded.name,
        location = excluded.location, category = excluded.category, updated_at = excluded.updated_at`;
    await tx`
      delete from places
      where city_id = ${city.id} and source = 'osm' and id <> all(${tx.array(ids)}::text[])`;
  });
}
