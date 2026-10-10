import type { CameraView } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import * as Location from 'expo-location';

import type { Visibility } from '@/db/personalPlaces';
import { listPlacesWithDiscovery } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import {
  personalPlaceRefusal,
  recordPersonalPlace,
  type PersonalPlaceRefusal,
} from './createPersonalPlace';
import { recordDiscovery } from './recordDiscovery';
import { validatePhoto, type PhotoValidation } from './validatePhoto';

// A photo that passed the GPS checks, still in the camera cache.
export interface Shot {
  cacheUri: string;
  position: GeoPoint;
  accuracy: number;
  takenAt: number;
}

export interface Capture {
  result: PhotoValidation;
  // Kept only when no place is in range: the user may turn it into a personal place.
  shot: Shot | null;
}

// The camera writes to the cache, which the system may empty: kept photos live in the documents folder.
function photosDirectory(): Directory {
  const directory = new Directory(Paths.document, 'photos');
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

// Moves the photo out of the cache, then stores it; the file goes away if storing fails.
async function keepShot(shot: Shot, store: (photoUri: string) => Promise<void>): Promise<void> {
  const kept = new File(photosDirectory(), `${shot.takenAt}.jpg`);
  await new File(shot.cacheUri).move(kept);
  try {
    await store(kept.uri);
  } catch (error) {
    kept.delete();
    throw error;
  }
}

export function discardShot(shot: Shot): void {
  new File(shot.cacheUri).delete();
}

// The position is read at the moment of the photo, never taken from an earlier fix.
// ponytail: no timeout on the GPS read; add one if a phone ever hangs here.
export async function captureDiscovery(db: Db, camera: CameraView): Promise<Capture> {
  const takenAt = Date.now();
  const [picture, location] = await Promise.all([
    camera.takePictureAsync({ quality: 0.8 }),
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
  ]);
  const { latitude, longitude, accuracy } = location.coords;
  const fix = {
    latitude,
    longitude,
    accuracy,
    timestamp: location.timestamp,
    mocked: location.mocked,
  };
  const result = validatePhoto(fix, await listPlacesWithDiscovery(db), takenAt);
  // accuracy is never null past validation; the check only narrows the type.
  const shot =
    accuracy === null
      ? null
      : { cacheUri: picture.uri, position: { latitude, longitude }, accuracy, takenAt };

  if (result.ok && shot) {
    await keepShot(shot, (photoUri) =>
      recordDiscovery(db, { ...shot, placeId: result.placeId, photoUri }),
    );
    return { result, shot: null };
  }
  if (!result.ok && result.reason === 'tooFar' && shot) return { result, shot };
  new File(picture.uri).delete();
  return { result, shot: null };
}

// The photo stays in the cache on a refusal, so the user can fix the name and try again.
export async function savePersonalPlace(
  db: Db,
  shot: Shot,
  name: string,
  visibility: Visibility,
): Promise<PersonalPlaceRefusal | null> {
  const refusal = await personalPlaceRefusal(db, name, shot.takenAt);
  if (refusal) return refusal;
  await keepShot(shot, (photoUri) =>
    recordPersonalPlace(db, { ...shot, photoUri }, name, visibility),
  );
  return null;
}
