import type { CityId } from '@discover/shared';

import type { Db } from './types';

export type MapSource = 'free' | 'purchased';

export interface OwnedMap {
  cityId: CityId;
  source: MapSource;
  unlockedAt: number;
}

export async function addOwnedMap(db: Db, map: OwnedMap): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO owned_maps (city_id, source, unlocked_at) VALUES (?, ?, ?)',
    [map.cityId, map.source, map.unlockedAt],
  );
}

export function listOwnedMaps(db: Db): Promise<OwnedMap[]> {
  return db.getAllAsync<OwnedMap>(
    'SELECT city_id AS cityId, source, unlocked_at AS unlockedAt FROM owned_maps ORDER BY unlocked_at',
    [],
  );
}
