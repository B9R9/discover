import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fakeMaps,
  fakeEvents,
  fakePlaceShares,
  fakeSpots,
  fakeWalks,
  fakePosts,
  fakeSessions,
  fakeSocial,
} from './fakeSocial.ts';
import { route, type Reply, type Services } from './routes.ts';

function setup() {
  const services: Services = {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social: fakeSocial(),
    posts: fakePosts(),
    maps: fakeMaps((user) => user !== 'nobody', { a: ['b'] }),
    spots: fakeSpots(),
    walks: fakeWalks(),
    placeShares: fakePlaceShares(fakeSocial()),
    events: fakeEvents(),
    storage: null,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { services, as };
}

test('map routes need a session', async () => {
  const { services } = setup();
  assert.equal((await route({ method: 'GET', pathname: '/me/map' }, services)).status, 401);
  assert.equal((await route({ method: 'GET', pathname: '/friends/b/map' }, services)).status, 401);
});

test('a snapshot is saved, counted and removed', async () => {
  const { as } = setup();
  assert.equal((await as('b', 'GET', '/me/map')).status, 404);
  assert.equal(
    (await as('b', 'PUT', '/me/map', { placeIds: ['osm:node/1', 'osm:node/1', 'osm:node/2'] }))
      .status,
    204,
  );
  const status = await as('b', 'GET', '/me/map');
  assert.equal((status.body as { count: number }).count, 2);
  assert.equal((await as('b', 'DELETE', '/me/map')).status, 204);
  assert.equal((await as('b', 'GET', '/me/map')).status, 404);
});

test('invalid snapshots are refused', async () => {
  const { as } = setup();
  for (const body of [
    undefined,
    {},
    { placeIds: 'x' },
    { placeIds: [1] },
    { placeIds: [''] },
    { placeIds: ['personal:123'] },
  ]) {
    assert.equal((await as('b', 'PUT', '/me/map', body)).status, 422);
  }
  assert.equal((await as('b', 'PUT', '/me/map', { placeIds: Array(5001).fill('x') })).status, 422);
});

test('sharing needs a pseudo', async () => {
  const { as } = setup();
  assert.equal((await as('nobody', 'PUT', '/me/map', { placeIds: ['osm:node/1'] })).status, 409);
});

test('only a friend with a snapshot can be seen', async () => {
  const { as } = setup();
  await as('b', 'PUT', '/me/map', { placeIds: ['osm:node/1'] });
  const reply = await as('a', 'GET', '/friends/b/map');
  assert.equal(reply.status, 200);
  assert.deepEqual((reply.body as { placeIds: string[] }).placeIds, ['osm:node/1']);
  assert.equal((await as('c', 'GET', '/friends/b/map')).status, 404);
  assert.equal((await as('a', 'GET', '/friends/zed/map')).status, 404);
  assert.equal((await as('a', 'POST', '/friends/b/map')).status, 405);
});
