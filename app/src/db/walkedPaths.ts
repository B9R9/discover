import type { Db, GeoPoint } from './types';

export interface PathPoint extends GeoPoint {
  recordedAt: number;
}

export async function addPathPoint(db: Db, point: PathPoint): Promise<void> {
  await db.runAsync(
    'INSERT INTO walked_paths (latitude, longitude, recorded_at) VALUES (?, ?, ?)',
    [point.latitude, point.longitude, point.recordedAt],
  );
}

export function listPathPoints(db: Db, since = 0): Promise<PathPoint[]> {
  return db.getAllAsync<PathPoint>(
    'SELECT latitude, longitude, recorded_at AS recordedAt FROM walked_paths WHERE recorded_at >= ? ORDER BY recorded_at',
    [since],
  );
}
