import { addDiscovery, listDiscoveries } from '@/db/discoveries';
import { migrate } from '@/db/migrations';
import { addPhoto } from '@/db/photos';
import { openTestDb } from '@/db/testDb';
import { addPathPoint } from '@/db/walkedPaths';

import { recordDiscovery } from './recordDiscovery';

const HOUR = 60 * 60 * 1000;
const NOW = 100 * HOUR;
const position = { latitude: 44.39, longitude: -1.16 };

async function freshDb() {
  const db = openTestDb();
  await migrate(db);
  return db;
}

const newDiscovery = (placeId: string) => ({
  placeId,
  photoUri: 'file:///photos/1.jpg',
  position,
  accuracy: 8,
  takenAt: NOW,
});

test('stores the photo, the discovery and the path walked since the previous discovery', async () => {
  const db = await freshDb();
  const oldPhoto = await addPhoto(db, {
    uri: 'old',
    ...position,
    accuracy: 5,
    takenAt: NOW - 2 * HOUR,
  });
  await addDiscovery(db, {
    placeId: 'old',
    discoveredAt: NOW - 2 * HOUR,
    path: [],
    photoId: oldPhoto,
  });
  await addPathPoint(db, { latitude: 1, longitude: 1, recordedAt: NOW - 3 * HOUR });
  await addPathPoint(db, { latitude: 2, longitude: 2, recordedAt: NOW - HOUR });

  await recordDiscovery(db, newDiscovery('new'));

  const discovery = (await listDiscoveries(db)).find((d) => d.placeId === 'new');
  expect(discovery?.path).toEqual([{ latitude: 2, longitude: 2 }]);
  expect(
    await db.getFirstAsync('SELECT uri, accuracy FROM photos WHERE id = ?', [
      discovery?.photoId ?? -1,
    ]),
  ).toEqual({
    uri: 'file:///photos/1.jpg',
    accuracy: 8,
  });
});

test('keeps only the last 24 h of path for a first discovery', async () => {
  const db = await freshDb();
  await addPathPoint(db, { latitude: 1, longitude: 1, recordedAt: NOW - 25 * HOUR });
  await addPathPoint(db, { latitude: 2, longitude: 2, recordedAt: NOW - HOUR });

  await recordDiscovery(db, newDiscovery('a'));

  expect((await listDiscoveries(db))[0]?.path).toEqual([{ latitude: 2, longitude: 2 }]);
});

test('writes nothing when the discovery cannot be stored', async () => {
  const db = await freshDb();
  await recordDiscovery(db, newDiscovery('a'));

  await expect(recordDiscovery(db, newDiscovery('a'))).rejects.toThrow();

  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM photos', [])).toEqual({ n: 1 });
});
