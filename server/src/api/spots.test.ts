import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fakeMaps,
  fakePosts,
  fakeSessions,
  fakeSocial,
  fakeSpots,
  fakeWalks,
} from './fakeSocial.ts';
import { route, type Reply, type Services } from './routes.ts';

function setup() {
  const services: Services = {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social: fakeSocial(),
    posts: fakePosts(),
    maps: fakeMaps(),
    spots: fakeSpots((user) => user !== 'nobody'),
    walks: fakeWalks(),
    storage: null,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { services, as };
}

const spot = {
  placeId: 'personal:1000',
  name: 'Belvédère',
  genre: 'viewpoint',
  latitude: 44.39,
  longitude: -1.16,
};

test('spot routes need a session', async () => {
  const { services } = setup();
  assert.equal((await route({ method: 'POST', pathname: '/spots' }, services)).status, 401);
});

test('a proposal is listed as pending, refused twice, and can be withdrawn', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'POST', '/spots', spot)).status, 201);
  assert.deepEqual((await as('a', 'GET', '/spots/mine')).body, {
    spots: [{ placeId: 'personal:1000', status: 'pending' }],
  });
  assert.equal((await as('a', 'POST', '/spots', spot)).status, 409);
  assert.equal((await as('a', 'DELETE', '/spots/personal%3A1000')).status, 204);
  assert.equal((await as('a', 'DELETE', '/spots/personal%3A1000')).status, 404);
  assert.deepEqual((await as('b', 'GET', '/spots/mine')).body, { spots: [] });
});

test('invalid proposals are refused', async () => {
  const { as } = setup();
  const bad = [
    {},
    { ...spot, placeId: 'osm:node/1' },
    { ...spot, name: '  ' },
    { ...spot, genre: 'home' },
    { ...spot, latitude: 91 },
    { ...spot, longitude: 'x' },
  ];
  for (const body of bad) assert.equal((await as('a', 'POST', '/spots', body)).status, 422);
});

test('a pseudo is needed, and pending proposals are capped', async () => {
  const { as } = setup();
  assert.equal((await as('nobody', 'POST', '/spots', spot)).status, 409);
  for (let i = 0; i < 20; i++) {
    assert.equal(
      (await as('a', 'POST', '/spots', { ...spot, placeId: `personal:${i}` })).status,
      201,
    );
  }
  assert.equal((await as('a', 'POST', '/spots', { ...spot, placeId: 'personal:99' })).status, 429);
});
