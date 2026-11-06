import { SPOT_GENRES, type PlaceId, type SpotGenre } from '@discover/shared';

import type { Db, GeoPoint } from './types';

export type Visibility = 'public' | 'private';

// Kinds of public spot. Also their category key (`category.<genre>`); no genre shows as a plain "Spot".
export { SPOT_GENRES, type SpotGenre };

export interface PersonalPlace extends GeoPoint {
  id: PlaceId;
  name: string;
  visibility: Visibility;
  genre: SpotGenre | null;
  createdAt: number;
  photoId: number;
}

export async function addPersonalPlace(db: Db, place: PersonalPlace): Promise<void> {
  await db.runAsync(
    'INSERT INTO personal_places (id, name, latitude, longitude, visibility, genre, created_at, photo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      place.id,
      place.name,
      place.latitude,
      place.longitude,
      place.visibility,
      place.genre,
      place.createdAt,
      place.photoId,
    ],
  );
}

export async function countPersonalPlacesSince(db: Db, since: number): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM personal_places WHERE created_at >= ?',
    [since],
  );
  return row?.count ?? 0;
}

const SELECT =
  'SELECT id, name, latitude, longitude, visibility, genre, created_at AS createdAt, photo_id AS photoId FROM personal_places';

// Null for a server place: only places the user created can be edited or deleted.
export function getPersonalPlace(db: Db, id: PlaceId): Promise<PersonalPlace | null> {
  return db.getFirstAsync<PersonalPlace>(`${SELECT} WHERE id = ?`, [id]);
}

export async function updatePersonalPlace(
  db: Db,
  id: PlaceId,
  { name, visibility, genre }: Pick<PersonalPlace, 'name' | 'visibility' | 'genre'>,
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE personal_places SET name = ?, visibility = ?, genre = ? WHERE id = ?',
    [name, visibility, genre, id],
  );
  return result.changes > 0;
}

// Removes the place, its discovery and its photo row. Returns the photo file to delete, or null if not a personal place.
export async function deletePersonalPlace(db: Db, id: PlaceId): Promise<string | null> {
  const row = await db.getFirstAsync<{ photoId: number; uri: string }>(
    `SELECT p.id AS photoId, p.uri FROM personal_places pp JOIN photos p ON p.id = pp.photo_id WHERE pp.id = ?`,
    [id],
  );
  if (!row) return null;
  await db.execAsync('BEGIN');
  try {
    await db.runAsync('DELETE FROM discovered_places WHERE place_id = ?', [id]);
    await db.runAsync('DELETE FROM personal_places WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM photos WHERE id = ?', [row.photoId]);
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
  return row.uri;
}
