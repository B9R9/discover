import type { PlaceId } from '@discover/shared';

import type { Db, GeoPoint } from './types';

export type Visibility = 'public' | 'private';

export interface PersonalPlace extends GeoPoint {
  id: PlaceId;
  name: string;
  visibility: Visibility;
  createdAt: number;
  photoId: number;
}

export async function addPersonalPlace(db: Db, place: PersonalPlace): Promise<void> {
  await db.runAsync(
    'INSERT INTO personal_places (id, name, latitude, longitude, visibility, created_at, photo_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      place.id,
      place.name,
      place.latitude,
      place.longitude,
      place.visibility,
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
