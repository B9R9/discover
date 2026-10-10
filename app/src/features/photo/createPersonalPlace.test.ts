import { listDiscoveredPositions, listDiscoveriesWithPhotos } from '@/db/discoveries';
import { migrate } from '@/db/migrations';
import { listPlacesWithDiscovery, replaceCachedPlaces } from '@/db/placesCache';
import { openTestDb } from '@/db/testDb';

import { personalPlaceRefusal, recordPersonalPlace } from './createPersonalPlace';

const HOUR = 60 * 60 * 1000;
const NOW = 100 * HOUR;
const position = { latitude: 44.39, longitude: -1.16 };

async function freshDb() {
  const db = openTestDb();
  await migrate(db);
  return db;
}

const photo = (takenAt: number) => ({
  photoUri: `file:///photos/${takenAt}.jpg`,
  position,
  accuracy: 8,
  takenAt,
});

test('a personal place is listed as discovered, reveals the fog and shows in the gallery', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), '  Chez Paul  ', 'private');

  expect(await listPlacesWithDiscovery(db)).toEqual([
    {
      id: `personal:${NOW}`,
      cityId: 'personal',
      name: 'Chez Paul',
      ...position,
      category: 'personal',
      discovered: true,
    },
  ]);
  expect(await listDiscoveredPositions(db)).toEqual([{ ...position, discoveredAt: NOW }]);
  expect((await listDiscoveriesWithPhotos(db))[0]?.name).toBe('Chez Paul');
});

test('a public spot gets the spot category', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), 'Belvédère', 'public');
  expect((await listPlacesWithDiscovery(db))[0]?.category).toBe('spot');
});

test('survives a refresh of the server places', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), 'Chez Paul', 'private');
  await replaceCachedPlaces(db, 'personal', [], NOW);
  expect(await listPlacesWithDiscovery(db)).toHaveLength(1);
});

test('refuses an empty name and a fourth place within 24 h', async () => {
  const db = await freshDb();
  expect(await personalPlaceRefusal(db, '   ', NOW)).toBe('emptyName');

  await recordPersonalPlace(db, photo(NOW - 26 * HOUR), 'Old', 'private');
  for (const offset of [3, 2, 1]) {
    expect(await personalPlaceRefusal(db, 'Spot', NOW - offset * HOUR)).toBeNull();
    await recordPersonalPlace(db, photo(NOW - offset * HOUR), 'Spot', 'public');
  }
  expect(await personalPlaceRefusal(db, 'Spot', NOW)).toBe('limit');
});

test('stores nothing when the transaction fails', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), 'Chez Paul', 'private');
  await expect(recordPersonalPlace(db, photo(NOW), 'Again', 'private')).rejects.toThrow();
  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM photos', [])).toEqual({ n: 1 });
  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM personal_places', [])).toEqual({
    n: 1,
  });
});
