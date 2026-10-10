import { addDiscovery, getDiscovery, listDiscoveries } from './discoveries';
import { migrate } from './migrations';
import { addOwnedMap, listOwnedMaps } from './ownedMaps';
import { addPhoto, getPhoto } from './photos';
import { listCachedPlaces, replaceCachedPlaces } from './placesCache';
import { getSetting, setSetting } from './settings';
import { openTestDb } from './testDb';
import { addPathPoint, listPathPoints } from './walkedPaths';

async function freshDb() {
  const db = openTestDb();
  await migrate(db);
  return db;
}

const photo = {
  uri: 'file:///photo.jpg',
  latitude: 44.39,
  longitude: -1.16,
  accuracy: 8,
  takenAt: 1000,
};

test('stores a discovery with its photo and reads it back', async () => {
  const db = await freshDb();
  const photoId = await addPhoto(db, photo);
  const discovery = {
    placeId: 'osm:node/1',
    discoveredAt: 2000,
    path: [
      { latitude: 44.38, longitude: -1.15 },
      { latitude: 44.39, longitude: -1.16 },
    ],
    photoId,
  };
  await addDiscovery(db, discovery);

  expect(await getPhoto(db, photoId)).toEqual({ id: photoId, ...photo });
  expect(await getDiscovery(db, 'osm:node/1')).toEqual(discovery);
  expect(await listDiscoveries(db)).toHaveLength(1);
  expect(await getDiscovery(db, 'unknown')).toBeNull();
});

test('refuses a discovery without an existing photo', async () => {
  const db = await freshDb();
  await expect(
    addDiscovery(db, { placeId: 'p', discoveredAt: 1, path: [], photoId: 42 }),
  ).rejects.toThrow();
});

test('keeps the first unlock of a city', async () => {
  const db = await freshDb();
  await addOwnedMap(db, { cityId: 'biscarrosse', source: 'free', unlockedAt: 1 });
  await addOwnedMap(db, { cityId: 'biscarrosse', source: 'purchased', unlockedAt: 2 });
  expect(await listOwnedMaps(db)).toEqual([
    { cityId: 'biscarrosse', source: 'free', unlockedAt: 1 },
  ]);
});

test('lists walked points since a date, in order', async () => {
  const db = await freshDb();
  await addPathPoint(db, { latitude: 1, longitude: 1, recordedAt: 30 });
  await addPathPoint(db, { latitude: 2, longitude: 2, recordedAt: 10 });
  await addPathPoint(db, { latitude: 3, longitude: 3, recordedAt: 20 });
  expect((await listPathPoints(db, 15)).map((point) => point.recordedAt)).toEqual([20, 30]);
});

test('reads default settings, then the saved value', async () => {
  const db = await freshDb();
  expect(await getSetting(db, 'backgroundTracking')).toBe(true);
  await setSetting(db, 'backgroundTracking', false);
  await setSetting(db, 'backgroundTracking', false);
  expect(await getSetting(db, 'backgroundTracking')).toBe(false);
  expect(await getSetting(db, 'onboardingDone')).toBe(false);
});

test('replaces the cached places of one city only', async () => {
  const db = await freshDb();
  const place = (id: string, cityId: string) => ({
    id,
    cityId,
    name: id,
    latitude: 0,
    longitude: 0,
    category: null,
  });
  await replaceCachedPlaces(db, 'a', [place('a1', 'a'), place('a2', 'a')], 1);
  await replaceCachedPlaces(db, 'b', [place('b1', 'b')], 1);
  await replaceCachedPlaces(db, 'a', [place('a3', 'a')], 2);
  expect(await listCachedPlaces(db, 'a')).toEqual([place('a3', 'a')]);
  expect(await listCachedPlaces(db, 'b')).toEqual([place('b1', 'b')]);
});
