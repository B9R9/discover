import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fakeMaps,
  fakeComments,
  fakeEvents,
  fakePlaceShares,
  fakePosts,
  fakeSessions,
  fakeSocial,
  fakeSpots,
  fakeWalks,
} from './fakeSocial.ts';
import { route, type Reply, type Services } from './routes.ts';

function setup() {
  const social = fakeSocial();
  const services: Services = {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social,
    posts: fakePosts(),
    maps: fakeMaps(),
    spots: fakeSpots(),
    walks: fakeWalks((user) => user !== 'nobody'),
    placeShares: fakePlaceShares(social),
    events: fakeEvents(),
    comments: fakeComments(),
    storage: null,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { services, as };
}

const walk = {
  name: 'Tour du lac',
  path: [
    [-1.16, 44.39],
    [-1.16, 44.4],
  ],
};

test('walks other than a plain GET need a session', async () => {
  const { services } = setup();
  assert.equal((await route({ method: 'POST', pathname: '/walks' }, services)).status, 401);
  assert.equal(
    (
      await route(
        { method: 'DELETE', pathname: '/walks/00000000-0000-4000-8000-000000000001' },
        services,
      )
    ).status,
    401,
  );
});

test('a visitor without a session sees only the walks made by Détour', async () => {
  const { as, services } = setup();
  await as('a', 'POST', '/walks', walk);
  const reply = await route({ method: 'GET', pathname: '/walks' }, services);
  assert.equal(reply.status, 200);
  const list = (reply.body as { walks: { pseudo: string | null }[] }).walks;
  assert.equal(list.length, 1);
  assert.equal(list[0]?.pseudo, null);
});

test('a walk is created with server-computed metrics, listed and deleted', async () => {
  const { as } = setup();
  const created = await as('a', 'POST', '/walks', { ...walk, distanceMeters: 1 });
  assert.equal(created.status, 201);
  const id = (created.body as { id: string }).id;
  const list = (await as('a', 'GET', '/walks')).body as {
    walks: { id: string; distanceMeters: number }[];
  };
  const mine = list.walks.find((item) => item.id === id);
  assert.ok(mine && mine.distanceMeters > 1000);
  assert.equal(
    list.walks.some((item) => item.id !== id),
    true,
    'the Détour walk is there too',
  );
  assert.equal((await as('b', 'DELETE', `/walks/${id}`)).status, 404);
  assert.equal((await as('a', 'DELETE', `/walks/${id}`)).status, 204);
});

test('invalid walks are refused', async () => {
  const { as } = setup();
  const bad = [
    {},
    { ...walk, name: 'ab' },
    { ...walk, name: 'x'.repeat(81) },
    { ...walk, path: [[0, 0]] },
    {
      ...walk,
      path: [
        [0, 44],
        [0, 46],
      ],
    },
  ];
  for (const body of bad) assert.equal((await as('a', 'POST', '/walks', body)).status, 422);
  assert.equal((await as('nobody', 'POST', '/walks', walk)).status, 409);
});

test('you cannot report your own walk', async () => {
  const { as } = setup();
  const id = ((await as('a', 'POST', '/walks', walk)).body as { id: string }).id;
  assert.equal((await as('a', 'POST', `/walks/${id}/report`)).status, 422);
  assert.equal((await as('b', 'POST', `/walks/${id}/report`)).status, 204);
  assert.equal(
    (await as('b', 'POST', '/walks/00000000-0000-4000-8000-000000000999/report')).status,
    404,
  );
});
