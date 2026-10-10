import type { PlaceId } from '@discover/shared';

import type { Db, GeoPoint } from './types';

export interface Discovery {
  placeId: PlaceId;
  discoveredAt: number;
  path: GeoPoint[];
  photoId: number;
}

interface DiscoveryRow {
  placeId: PlaceId;
  discoveredAt: number;
  path: string;
  photoId: number;
}

const SELECT =
  'SELECT place_id AS placeId, discovered_at AS discoveredAt, path, photo_id AS photoId FROM discovered_places';

export async function addDiscovery(db: Db, discovery: Discovery): Promise<void> {
  await db.runAsync(
    'INSERT INTO discovered_places (place_id, discovered_at, path, photo_id) VALUES (?, ?, ?, ?)',
    [discovery.placeId, discovery.discoveredAt, JSON.stringify(discovery.path), discovery.photoId],
  );
}

export async function getDiscovery(db: Db, placeId: PlaceId): Promise<Discovery | null> {
  const row = await db.getFirstAsync<DiscoveryRow>(`${SELECT} WHERE place_id = ?`, [placeId]);
  return row && fromRow(row);
}

export async function listDiscoveries(db: Db): Promise<Discovery[]> {
  const rows = await db.getAllAsync<DiscoveryRow>(`${SELECT} ORDER BY discovered_at`, []);
  return rows.map(fromRow);
}

function fromRow(row: DiscoveryRow): Discovery {
  // We wrote this JSON ourselves in addDiscovery, so its shape is trusted.
  return { ...row, path: JSON.parse(row.path) as GeoPoint[] };
}
