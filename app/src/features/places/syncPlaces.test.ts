import type { City, Place } from '@discover/shared';

import { migrate } from '@/db/migrations';
import { listCachedPlaces } from '@/db/placesCache';
import { openTestDb } from '@/db/testDb';

import { syncPlaces } from './syncPlaces';

const API = 'http://api.test';
const INSIDE = { latitude: 44.39, longitude: -1.16 };

const city: City = {
  id: 'biscarrosse',
  name: 'Biscarrosse',
  boundary: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [-1.3, 44.3],
          [-1.0, 44.3],
          [-1.0, 44.5],
          [-1.3, 44.5],
          [-1.3, 44.3],
        ],
      ],
    ],
  },
};
const museum: Place = {
  id: 'osm:node/1',
  cityId: 'biscarrosse',
  name: 'Musée',
  latitude: 44.389,
  longitude: -1.182,
  category: 'culture',
};

function fakeApi(online: boolean) {
  const urls: string[] = [];
  const fetchFn = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    if (!online) throw new TypeError('Network request failed');
    const body = url.endsWith('/cities') ? [city] : [museum];
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  return { fetchFn, urls };
}

async function freshDb() {
  const db = openTestDb();
  await migrate(db);
  return db;
}

test('syncPlaces fills the cache for the city of the phone, sending no position', async () => {
  const db = await freshDb();
  const { fetchFn, urls } = fakeApi(true);

  expect(await syncPlaces(db, INSIDE, API, fetchFn)).toBe('biscarrosse');
  expect(await listCachedPlaces(db, 'biscarrosse')).toEqual([museum]);
  expect(urls).toEqual([`${API}/cities`, `${API}/cities/biscarrosse/places`]);
  for (const url of urls) {
    expect(url).not.toMatch(/44\.|-1\./);
  }
});

test('syncPlaces keeps the cache offline, finding the city from cached boundaries', async () => {
  const db = await freshDb();
  await syncPlaces(db, INSIDE, API, fakeApi(true).fetchFn);
  const offline = fakeApi(false);

  expect(await syncPlaces(db, INSIDE, API, offline.fetchFn)).toBeNull();
  expect(offline.urls).toEqual([`${API}/cities`, `${API}/cities/biscarrosse/places`]);
  expect(await listCachedPlaces(db, 'biscarrosse')).toEqual([museum]);
});

test('syncPlaces gives up on a server that never answers', async () => {
  const db = await freshDb();
  const hanging = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })) as typeof fetch;
  jest.useFakeTimers();
  try {
    const result = syncPlaces(db, INSIDE, API, hanging);
    await jest.advanceTimersByTimeAsync(10_000);
    expect(await result).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

test('syncPlaces does nothing outside every known city or without an API URL', async () => {
  const db = await freshDb();
  const { fetchFn, urls } = fakeApi(true);

  expect(await syncPlaces(db, { latitude: 48.85, longitude: 2.35 }, API, fetchFn)).toBeNull();
  expect(urls).toEqual([`${API}/cities`]);
  expect(await syncPlaces(db, INSIDE, '', fetchFn)).toBeNull();
});
