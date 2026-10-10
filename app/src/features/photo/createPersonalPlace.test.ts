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
  await recordPersonalPlace(db, photo(NOW), {
    name: '  Chez Paul  ',
    visibility: 'private',
    genre: null,
  });

  expect(await listPlacesWithDiscovery(db)).toEqual([
    {
      id: `personal:${NOW}`,
      areaId: 'personal',
      name: 'Chez Paul',
      ...position,
      category: 'personal',
      discovered: true,
    },
  ]);
  expect(await listDiscoveredPositions(db)).toEqual([{ ...position, discoveredAt: NOW }]);
  expect((await listDiscoveriesWithPhotos(db))[0]?.name).toBe('Chez Paul');
});

test('a spot shows its genre as category, or plain spot without one; a home never has a genre', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), {
    name: 'Belvédère',
    visibility: 'public',
    genre: 'viewpoint',
  });
  await recordPersonalPlace(db, photo(NOW + 1), {
    name: 'Banc',
    visibility: 'public',
    genre: null,
  });
  await recordPersonalPlace(db, photo(NOW + 2), {
    name: 'Chez Paul',
    visibility: 'private',
    genre: 'shop',
  });

  const categories = Object.fromEntries(
    (await listPlacesWithDiscovery(db)).map((place) => [place.name, place.category]),
  );
  expect(categories).toEqual({ Belvédère: 'viewpoint', Banc: 'spot', 'Chez Paul': 'personal' });
  expect(
    await db.getFirstAsync("SELECT genre FROM personal_places WHERE name = 'Chez Paul'", []),
  ).toEqual({ genre: null });
});

test('survives a refresh of the server places', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), {
    name: 'Chez Paul',
    visibility: 'private',
    genre: null,
  });
  await replaceCachedPlaces(db, 'personal', [], NOW);
  expect(await listPlacesWithDiscovery(db)).toHaveLength(1);
});

test('refuses an empty name and a fourth place within 24 h', async () => {
  const db = await freshDb();
  expect(await personalPlaceRefusal(db, '   ', NOW)).toBe('emptyName');

  await recordPersonalPlace(db, photo(NOW - 26 * HOUR), {
    name: 'Old',
    visibility: 'private',
    genre: null,
  });
  for (const offset of [3, 2, 1]) {
    expect(await personalPlaceRefusal(db, 'Spot', NOW - offset * HOUR)).toBeNull();
    await recordPersonalPlace(db, photo(NOW - offset * HOUR), {
      name: 'Spot',
      visibility: 'public',
      genre: null,
    });
  }
  expect(await personalPlaceRefusal(db, 'Spot', NOW)).toBe('limit');
});

test('stores nothing when the transaction fails', async () => {
  const db = await freshDb();
  await recordPersonalPlace(db, photo(NOW), {
    name: 'Chez Paul',
    visibility: 'private',
    genre: null,
  });
  await expect(
    recordPersonalPlace(db, photo(NOW), { name: 'Again', visibility: 'private', genre: null }),
  ).rejects.toThrow();
  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM photos', [])).toEqual({ n: 1 });
  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM personal_places', [])).toEqual({
    n: 1,
  });
});
