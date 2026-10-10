import { addDiscovery, listDiscoveredPositions } from './discoveries';
import { migrate } from './migrations';
import { deletePersonalPlace, getPersonalPlace, updatePersonalPlace } from './personalPlaces';
import { addPhoto } from './photos';
import { listPlacesWithDiscovery, replaceCachedPlaces } from './placesCache';
import { openTestDb } from './testDb';

import { editPersonalPlace, recordPersonalPlace } from '@/features/photo/createPersonalPlace';

const position = { latitude: 44.39, longitude: -1.16 };
const ID = 'personal:1000';

async function dbWithPlace() {
  const db = openTestDb();
  await migrate(db);
  await recordPersonalPlace(
    db,
    { photoUri: 'file:///photos/1000.jpg', position, accuracy: 8, takenAt: 1000 },
    { name: 'Belvédère', visibility: 'public', genre: 'viewpoint' },
  );
  return db;
}

test('edits a place; a home loses its genre and an empty name is refused', async () => {
  const db = await dbWithPlace();

  expect(await editPersonalPlace(db, ID, { name: '  ', visibility: 'public', genre: null })).toBe(
    'emptyName',
  );
  expect(
    await editPersonalPlace(db, ID, { name: ' Chez Paul ', visibility: 'private', genre: 'shop' }),
  ).toBeNull();

  expect(await getPersonalPlace(db, ID)).toMatchObject({
    name: 'Chez Paul',
    visibility: 'private',
    genre: null,
  });
});

test('deletes a place without a trace and hides its area again', async () => {
  const db = await dbWithPlace();

  expect(await deletePersonalPlace(db, ID)).toBe('file:///photos/1000.jpg');

  expect(await listPlacesWithDiscovery(db)).toEqual([]);
  expect(await listDiscoveredPositions(db)).toEqual([]);
  expect(await db.getFirstAsync('SELECT COUNT(*) AS n FROM photos', [])).toEqual({ n: 0 });
});

test('a server place can be neither edited nor deleted', async () => {
  const db = openTestDb();
  await migrate(db);
  await replaceCachedPlaces(
    db,
    'biscarrosse',
    [{ id: 'osm:1', cityId: 'biscarrosse', name: 'Musée', ...position, category: 'culture' }],
    1,
  );
  const photoId = await addPhoto(db, {
    uri: 'file:///p.jpg',
    ...position,
    accuracy: 5,
    takenAt: 1,
  });
  await addDiscovery(db, { placeId: 'osm:1', discoveredAt: 1, path: [], photoId });

  expect(
    await updatePersonalPlace(db, 'osm:1', { name: 'X', visibility: 'public', genre: null }),
  ).toBe(false);
  expect(await deletePersonalPlace(db, 'osm:1')).toBeNull();
  expect(await listPlacesWithDiscovery(db)).toMatchObject([{ name: 'Musée', discovered: true }]);
});
