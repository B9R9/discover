import type { LocationObject } from 'expo-location';

import type { Db } from '@/db/types';
import { addPathPoint, getLastPathPoint } from '@/db/walkedPaths';
import { distanceMeters } from '@/lib/geo';

// Below 20 m apart, a new point adds nothing to a 30 m band and only costs battery and storage.
export const MIN_DISTANCE_METERS = 20;
export const MAX_ACCURACY_METERS = 50;

// The open app and the background task can both deliver a location at once: one write at a time,
// otherwise both read the same last point and keep two points a few meters apart.
let queue: Promise<void> = Promise.resolve();

export function recordLocations(db: Db, locations: readonly LocationObject[]): Promise<void> {
  const next = queue.then(() => writeLocations(db, locations));
  queue = next.catch(() => undefined);
  return next;
}

async function writeLocations(db: Db, locations: readonly LocationObject[]): Promise<void> {
  let last = await getLastPathPoint(db);
  for (const { coords, timestamp } of locations) {
    if (coords.accuracy === null || coords.accuracy > MAX_ACCURACY_METERS) continue;
    const point = { latitude: coords.latitude, longitude: coords.longitude, recordedAt: timestamp };
    if (last && distanceMeters(last, point) < MIN_DISTANCE_METERS) continue;
    await addPathPoint(db, point);
    last = point;
  }
}
