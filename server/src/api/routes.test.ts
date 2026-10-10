import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Place } from '@discover/shared';

import type { PlacesStore } from './placesStore.ts';
import { route } from './routes.ts';

const museum: Place = {
  id: 'osm:node/1',
  cityId: 'biscarrosse',
  name: 'Musée',
  latitude: 44.4,
  longitude: -1.2,
  category: 'culture',
};

const store: PlacesStore = {
  listCities: () =>
    Promise.resolve([
      {
        id: 'biscarrosse',
        name: 'Biscarrosse',
        boundary: { type: 'MultiPolygon', coordinates: [] },
      },
    ]),
  listPlaces: (cityId) => Promise.resolve(cityId === 'biscarrosse' ? [museum] : null),
};

test('route lists cities and the places of a city', async () => {
  const cities = await route('GET', '/cities', store);
  assert.equal(cities.status, 200);
  assert.deepEqual(await route('GET', '/cities/biscarrosse/places', store), {
    status: 200,
    body: [museum],
  });
});

test('route answers 404 for an unknown city or path', async () => {
  assert.equal((await route('GET', '/cities/paris/places', store)).status, 404);
  assert.equal((await route('GET', '/places', store)).status, 404);
  assert.equal((await route('GET', '/cities/../places', store)).status, 404);
});

test('route only accepts GET', async () => {
  assert.equal((await route('POST', '/cities', store)).status, 405);
});
