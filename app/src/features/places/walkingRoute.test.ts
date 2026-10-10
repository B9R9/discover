import { addDiscovery } from '@/db/discoveries';
import { migrate } from '@/db/migrations';
import { addPhoto } from '@/db/photos';
import { replaceCachedPlaces } from '@/db/placesCache';
import { openTestDb } from '@/db/testDb';

import { fetchWalkingRoute } from './walkingRoute';

const HOME = { latitude: 44.3908, longitude: -1.1495 };
const place = (id: string) => ({
  id,
  areaId: 'biscarrosse',
  name: id,
  latitude: 44.3941,
  longitude: -1.1676,
  category: null,
});

const ORS_BODY = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-1.1495, 44.3908],
          [-1.1676, 44.3941],
        ],
      },
      properties: { summary: { distance: 1650.2, duration: 1188 } },
    },
  ],
};

async function dbWithPlaces() {
  const db = openTestDb();
  await migrate(db);
  await replaceCachedPlaces(db, 'biscarrosse', [place('found'), place('hidden')], 1);
  const photoId = await addPhoto(db, { uri: 'f', ...HOME, accuracy: 5, takenAt: 1 });
  await addDiscovery(db, { placeId: 'found', discoveredAt: 1, path: [], photoId });
  return db;
}

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

test('an undiscovered place gets no route and no network call', async () => {
  const db = await dbWithPlaces();
  expect(await fetchWalkingRoute(db, HOME, 'hidden', 'key')).toEqual({ kind: 'not-discovered' });
  expect(await fetchWalkingRoute(db, HOME, 'unknown', 'key')).toEqual({ kind: 'not-discovered' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('a discovered place gets a walking route from OpenRouteService', async () => {
  const db = await dbWithPlaces();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ORS_BODY });

  const result = await fetchWalkingRoute(db, HOME, 'found', 'key');

  expect(result).toEqual({
    kind: 'route',
    route: {
      line: ORS_BODY.features[0]?.geometry,
      distanceMeters: 1650.2,
      durationSeconds: 1188,
    },
  });
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain('/v2/directions/foot-walking/geojson');
  expect(JSON.parse(String(init.body))).toEqual({
    coordinates: [
      [HOME.longitude, HOME.latitude],
      [-1.1676, 44.3941],
    ],
  });
});

test('reports a missing key or a bad answer without throwing', async () => {
  const db = await dbWithPlaces();
  expect(await fetchWalkingRoute(db, HOME, 'found', '')).toEqual({ kind: 'no-key' });
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [{}] }) });
  expect(await fetchWalkingRoute(db, HOME, 'found', 'key')).toEqual({ kind: 'failed' });
  fetchMock.mockRejectedValue(new Error('offline'));
  expect(await fetchWalkingRoute(db, HOME, 'found', 'key')).toEqual({ kind: 'failed' });
});
