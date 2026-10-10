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

export interface DiscoveredPosition extends GeoPoint {
  discoveredAt: number;
}

// The place's own position when cached, else where its photo was taken (always within 50 m).
export function listDiscoveredPositions(db: Db, since = 0): Promise<DiscoveredPosition[]> {
  return db.getAllAsync<DiscoveredPosition>(
    `SELECT COALESCE(c.latitude, p.latitude) AS latitude, COALESCE(c.longitude, p.longitude) AS longitude,
       d.discovered_at AS discoveredAt
     FROM discovered_places d
     JOIN photos p ON p.id = d.photo_id
     LEFT JOIN all_places c ON c.id = d.place_id
     WHERE d.discovered_at >= ?
     ORDER BY d.discovered_at`,
    [since],
  );
}

export async function getLastDiscoveredAt(db: Db): Promise<number | null> {
  const row = await db.getFirstAsync<{ last: number | null }>(
    'SELECT MAX(discovered_at) AS last FROM discovered_places',
    [],
  );
  return row?.last ?? null;
}

export interface DiscoveryWithPhoto {
  placeId: PlaceId;
  name: string | null;
  category: string | null;
  discoveredAt: number;
  photoUri: string;
}

// Newest first. The name is null when the place left the cache (removed on the server).
export function listDiscoveriesWithPhotos(db: Db): Promise<DiscoveryWithPhoto[]> {
  return db.getAllAsync<DiscoveryWithPhoto>(
    `SELECT d.place_id AS placeId, c.name, c.category, d.discovered_at AS discoveredAt, p.uri AS photoUri
     FROM discovered_places d
     JOIN photos p ON p.id = d.photo_id
     LEFT JOIN all_places c ON c.id = d.place_id
     ORDER BY d.discovered_at DESC`,
    [],
  );
}

export async function countDiscoveries(db: Db): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM discovered_places',
    [],
  );
  return row?.count ?? 0;
}
