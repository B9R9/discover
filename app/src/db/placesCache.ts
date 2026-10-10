import type { AreaId, Place } from '@discover/shared';

import type { Db } from './types';

// Replaces the whole area so places removed on the server disappear from the cache too.
export async function replaceCachedPlaces(
  db: Db,
  areaId: AreaId,
  places: Place[],
  updatedAt: number,
): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    await db.runAsync('DELETE FROM places_cache WHERE area_id = ?', [areaId]);
    for (const place of places) {
      await db.runAsync(
        'INSERT OR REPLACE INTO places_cache (id, area_id, name, latitude, longitude, category, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [place.id, areaId, place.name, place.latitude, place.longitude, place.category, updatedAt],
      );
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

export function listCachedPlaces(db: Db, areaId: AreaId): Promise<Place[]> {
  return db.getAllAsync<Place>(
    'SELECT id, area_id AS areaId, name, latitude, longitude, category FROM places_cache WHERE area_id = ? ORDER BY name',
    [areaId],
  );
}

export interface CachedPlace extends Place {
  discovered: boolean;
}

// Server places and the user's personal places.
export async function listPlacesWithDiscovery(db: Db): Promise<CachedPlace[]> {
  const rows = await db.getAllAsync<Place & { discovered: number }>(
    `SELECT c.id, c.area_id AS areaId, c.name, c.latitude, c.longitude, c.category,
       d.place_id IS NOT NULL AS discovered
     FROM all_places c LEFT JOIN discovered_places d ON d.place_id = c.id`,
    [],
  );
  return rows.map((row) => ({ ...row, discovered: row.discovered === 1 }));
}
