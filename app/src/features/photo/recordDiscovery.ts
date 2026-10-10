import type { PlaceId } from '@discover/shared';

import { addDiscovery, getLastDiscoveredAt } from '@/db/discoveries';
import { addPersonalPlace, type Visibility } from '@/db/personalPlaces';
import { addPhoto } from '@/db/photos';
import type { Db, GeoPoint } from '@/db/types';
import { listPathPoints } from '@/db/walkedPaths';

// Keeps the stored path to one outing, even when the previous discovery is weeks old.
const PATH_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface NewDiscovery {
  placeId: PlaceId;
  photoUri: string;
  position: GeoPoint;
  accuracy: number;
  takenAt: number;
  // Set when the user creates this place: it is stored as a personal place, at the photo's position.
  personal?: { name: string; visibility: Visibility };
}

// The path walked since the previous discovery is stored with it: the walk that led to this place.
export async function recordDiscovery(db: Db, discovery: NewDiscovery): Promise<void> {
  const { placeId, photoUri, position, accuracy, takenAt, personal } = discovery;
  const since = Math.max((await getLastDiscoveredAt(db)) ?? 0, takenAt - PATH_WINDOW_MS);
  const path = (await listPathPoints(db, since)).map(({ latitude, longitude }) => ({
    latitude,
    longitude,
  }));

  await db.execAsync('BEGIN');
  try {
    const photoId = await addPhoto(db, { uri: photoUri, ...position, accuracy, takenAt });
    if (personal) {
      await addPersonalPlace(db, {
        id: placeId,
        ...personal,
        ...position,
        createdAt: takenAt,
        photoId,
      });
    }
    await addDiscovery(db, { placeId, discoveredAt: takenAt, path, photoId });
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
