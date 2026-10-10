import type { CityId, Place } from '@discover/shared';

import type { Db } from './types';

// Replaces the whole city so places removed on the server disappear from the cache too.
export async function replaceCachedPlaces(
  db: Db,
  cityId: CityId,
  places: Place[],
  updatedAt: number,
): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    await db.runAsync('DELETE FROM places_cache WHERE city_id = ?', [cityId]);
    for (const place of places) {
      await db.runAsync(
        'INSERT INTO places_cache (id, city_id, name, latitude, longitude, category, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [place.id, cityId, place.name, place.latitude, place.longitude, place.category, updatedAt],
      );
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

export function listCachedPlaces(db: Db, cityId: CityId): Promise<Place[]> {
  return db.getAllAsync<Place>(
    'SELECT id, city_id AS cityId, name, latitude, longitude, category FROM places_cache WHERE city_id = ? ORDER BY name',
    [cityId],
  );
}

export interface CachedPlace extends Place {
  discovered: boolean;
}

export async function listPlacesWithDiscovery(db: Db): Promise<CachedPlace[]> {
  const rows = await db.getAllAsync<Place & { discovered: number }>(
    `SELECT c.id, c.city_id AS cityId, c.name, c.latitude, c.longitude, c.category,
       d.place_id IS NOT NULL AS discovered
     FROM places_cache c LEFT JOIN discovered_places d ON d.place_id = c.id`,
    [],
  );
  return rows.map((row) => ({ ...row, discovered: row.discovered === 1 }));
}
