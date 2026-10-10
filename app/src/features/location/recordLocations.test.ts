import type { LocationObject } from 'expo-location';

import { migrate } from '@/db/migrations';
import { openTestDb } from '@/db/testDb';
import { listPathPoints } from '@/db/walkedPaths';

import { recordLocations } from './recordLocations';

const METERS_PER_DEGREE = 111_320;

function location(northMeters: number, accuracy: number | null, timestamp: number): LocationObject {
  return {
    timestamp,
    coords: {
      latitude: 44.3944 + northMeters / METERS_PER_DEGREE,
      longitude: -1.1636,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
  };
}

test('keeps precise points at least 20 m apart, across batches', async () => {
  const db = openTestDb();
  await migrate(db);
  await recordLocations(db, [
    location(0, 10, 1),
    location(10, 10, 2), // too close to the previous point
    location(30, 80, 3), // too imprecise
    location(30, null, 4), // unknown precision
    location(30, 10, 5),
  ]);
  await recordLocations(db, [location(45, 10, 6), location(55, 10, 7)]);

  expect((await listPathPoints(db)).map((point) => point.recordedAt)).toEqual([1, 5, 7]);
});

test('concurrent deliveries do not keep two close points', async () => {
  const db = openTestDb();
  await migrate(db);
  await Promise.all([
    recordLocations(db, [location(0, 10, 1)]),
    recordLocations(db, [location(1, 10, 2)]),
  ]);
  expect(await listPathPoints(db)).toHaveLength(1);
});
