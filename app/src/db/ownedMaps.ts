import type { AreaId } from '@discover/shared';

import type { Db } from './types';

export type MapSource = 'free' | 'purchased';

export interface OwnedMap {
  areaId: AreaId;
  source: MapSource;
  unlockedAt: number;
}

export async function addOwnedMap(db: Db, map: OwnedMap): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO owned_maps (area_id, source, unlocked_at) VALUES (?, ?, ?)',
    [map.areaId, map.source, map.unlockedAt],
  );
}

export function listOwnedMaps(db: Db): Promise<OwnedMap[]> {
  return db.getAllAsync<OwnedMap>(
    'SELECT area_id AS areaId, source, unlocked_at AS unlockedAt FROM owned_maps ORDER BY unlocked_at',
    [],
  );
}
