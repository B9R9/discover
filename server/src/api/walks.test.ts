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
    spots: fakeSpots(),
    walks: fakeWalks((user) => user !== 'nobody'),
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

test('walk routes need a session', async () => {
  const { services } = setup();
  assert.equal((await route({ method: 'GET', pathname: '/walks' }, services)).status, 401);
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
