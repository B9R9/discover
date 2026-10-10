import type { CameraView } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import * as Location from 'expo-location';

import { listPlacesWithDiscovery } from '@/db/placesCache';
import type { Db } from '@/db/types';

import { recordDiscovery } from './recordDiscovery';
import { validatePhoto, type PhotoValidation } from './validatePhoto';

// The camera writes to the cache, which the system may empty: kept photos live in the documents folder.
function photosDirectory(): Directory {
  const directory = new Directory(Paths.document, 'photos');
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

// The position is read at the moment of the photo, never taken from an earlier fix.
// ponytail: no timeout on the GPS read; add one if a phone ever hangs here.
export async function captureDiscovery(db: Db, camera: CameraView): Promise<PhotoValidation> {
  const takenAt = Date.now();
  const [picture, location] = await Promise.all([
    camera.takePictureAsync({ quality: 0.8 }),
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
  ]);
  const shot = new File(picture.uri);
  const fix = { ...location.coords, timestamp: location.timestamp, mocked: location.mocked };
  const result = validatePhoto(fix, await listPlacesWithDiscovery(db), takenAt);
  if (!result.ok || fix.accuracy === null) {
    shot.delete();
    return result;
  }

  const kept = new File(photosDirectory(), `${takenAt}.jpg`);
  await shot.move(kept);
  try {
    await recordDiscovery(db, {
      placeId: result.placeId,
      photoUri: kept.uri,
      position: { latitude: fix.latitude, longitude: fix.longitude },
      accuracy: fix.accuracy,
      takenAt,
    });
  } catch (error) {
    kept.delete();
    throw error;
  }
  return result;
}
