import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Place } from '@discover/shared';

import type { AuthAdmin } from './authAdmin.ts';
import type { PlacesStore } from './placesStore.ts';
import { route, type Services } from './routes.ts';

const museum: Place = {
  id: 'osm:node/1',
  areaId: 'landes',
  name: 'Musée',
  latitude: 44.4,
  longitude: -1.2,
  category: 'culture',
};

const store: PlacesStore = {
  listAreas: () =>
    Promise.resolve([
      {
        id: 'landes',
        name: 'Landes',
        departmentId: null,
        boundary: { type: 'MultiPolygon', coordinates: [] },
      },
    ]),
  listPlaces: (areaId) => Promise.resolve(areaId === 'landes' ? [museum] : null),
};

function fakeAuth() {
  const deleted: string[] = [];
  const auth: AuthAdmin = {
    userIdFromToken: (token) => Promise.resolve(token === 'good' ? 'user-1' : null),
    deleteUser: async (userId) => {
      deleted.push(userId);
    },
  };
  return { auth, deleted };
}

const services: Services = { store, auth: null };
const get = (pathname: string) => route({ method: 'GET', pathname }, services);

test('route lists areas and the places of an area', async () => {
  assert.equal((await get('/areas')).status, 200);
  assert.deepEqual(await get('/areas/landes/places'), { status: 200, body: [museum] });
});

test('route answers 404 for an unknown area or path', async () => {
  assert.equal((await get('/areas/paris/places')).status, 404);
  assert.equal((await get('/places')).status, 404);
  assert.equal((await get('/areas/../places')).status, 404);
});

test('route only accepts GET on places routes', async () => {
  assert.equal((await route({ method: 'POST', pathname: '/areas' }, services)).status, 405);
});

test('DELETE /me deletes the user behind a valid session token', async () => {
  const { auth, deleted } = fakeAuth();
  const reply = await route(
    { method: 'DELETE', pathname: '/me', authorization: 'Bearer good' },
    { store, auth },
  );
  assert.deepEqual(reply, { status: 204, body: null });
  assert.deepEqual(deleted, ['user-1']);
});

test('DELETE /me refuses a missing or bad token and deletes nobody', async () => {
  const { auth, deleted } = fakeAuth();
  for (const authorization of [undefined, 'Bearer bad', 'good', 'Basic good']) {
    const reply = await route(
      { method: 'DELETE', pathname: '/me', authorization },
      { store, auth },
    );
    assert.equal(reply.status, 401);
  }
  assert.deepEqual(deleted, []);
});

test('/me answers 503 without Auth settings and 405 for other methods', async () => {
  const request = { method: 'DELETE', pathname: '/me', authorization: 'Bearer good' };
  assert.equal((await route(request, services)).status, 503);
  assert.equal(
    (await route({ method: 'GET', pathname: '/me' }, { store, auth: fakeAuth().auth })).status,
    405,
  );
});
