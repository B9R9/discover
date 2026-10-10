import type { Db, GeoPoint } from './types';

export interface Photo extends GeoPoint {
  id: number;
  uri: string;
  accuracy: number;
  takenAt: number;
}

export async function addPhoto(db: Db, photo: Omit<Photo, 'id'>): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO photos (uri, latitude, longitude, accuracy, taken_at) VALUES (?, ?, ?, ?, ?)',
    [photo.uri, photo.latitude, photo.longitude, photo.accuracy, photo.takenAt],
  );
  return result.lastInsertRowId;
}

export function getPhoto(db: Db, id: number): Promise<Photo | null> {
  return db.getFirstAsync<Photo>(
    'SELECT id, uri, latitude, longitude, accuracy, taken_at AS takenAt FROM photos WHERE id = ?',
    [id],
  );
}
