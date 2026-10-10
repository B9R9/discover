import type { City } from '@discover/shared';

import type { Db } from './types';

export async function replaceCachedCities(
  db: Db,
  cities: City[],
  updatedAt: number,
): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    await db.runAsync('DELETE FROM cities_cache', []);
    for (const city of cities) {
      await db.runAsync(
        'INSERT INTO cities_cache (id, name, boundary, updated_at) VALUES (?, ?, ?, ?)',
        [city.id, city.name, JSON.stringify(city.boundary), updatedAt],
      );
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

export async function listCachedCities(db: Db): Promise<City[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; boundary: string }>(
    'SELECT id, name, boundary FROM cities_cache ORDER BY name',
    [],
  );
  // Written by replaceCachedCities from validated server data.
  return rows.map((row) => ({ ...row, boundary: JSON.parse(row.boundary) as City['boundary'] }));
}
