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
    walks: fakeWalks(),
    placeShares: fakePlaceShares(social),
    events: fakeEvents(),
    comments: fakeComments(),
    storage: null,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { as, services };
}

async function befriend(as: ReturnType<typeof setup>['as']) {
  await as('a', 'PUT', '/me/profile', { pseudo: 'lea' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'tom' });
  await as('c', 'PUT', '/me/profile', { pseudo: 'ana' });
  await as('a', 'POST', '/friends/requests', { pseudo: 'tom' });
  await as('b', 'POST', '/friends/lea/accept');
}

const spot = {
  name: 'Banc du port',
  genre: 'viewpoint',
  latitude: 44.4,
  longitude: -1.2,
  comment: 'Vue',
};

test('place shares need a session', async () => {
  const { services } = setup();
  const reply = await route(
    { method: 'GET', pathname: '/place-shares', authorization: 'Bearer nope' },
    services,
  );
  assert.equal(reply.status, 401);
});

test('a place goes to chosen friends only, with position and comment', async () => {
  const { as } = setup();
  await befriend(as);
  const sent = await as('a', 'POST', '/place-shares', { ...spot, pseudos: ['tom'] });
  assert.equal(sent.status, 201);

  const mine = (await as('a', 'GET', '/place-shares')).body as {
    places: Record<string, unknown>[];
  };
  assert.equal(mine.places.length, 1);
  assert.deepEqual(mine.places[0]?.to, ['tom']);
  assert.equal(mine.places[0]?.mine, true);

  const theirs = (await as('b', 'GET', '/place-shares')).body as {
    places: Record<string, unknown>[];
  };
  assert.equal(theirs.places[0]?.pseudo, 'lea');
  assert.equal(theirs.places[0]?.latitude, 44.4);
  assert.deepEqual(theirs.places[0]?.to, []);

  const stranger = (await as('c', 'GET', '/place-shares')).body as { places: unknown[] };
  assert.equal(stranger.places.length, 0);
});

test('sharing with someone who is not a friend is refused', async () => {
  const { as } = setup();
  await befriend(as);
  const reply = await as('a', 'POST', '/place-shares', { ...spot, pseudos: ['tom', 'ana'] });
  assert.equal(reply.status, 403);
});

test('bad shares are refused', async () => {
  const { as } = setup();
  await befriend(as);
  for (const body of [
    undefined,
    { ...spot, pseudos: [] },
    { ...spot, pseudos: ['tom', 'tom'] },
    { ...spot, name: '  ', pseudos: ['tom'] },
    { ...spot, genre: 'castle', pseudos: ['tom'] },
    { ...spot, latitude: 91, pseudos: ['tom'] },
    { ...spot, comment: 'x'.repeat(281), pseudos: ['tom'] },
  ]) {
    assert.equal((await as('a', 'POST', '/place-shares', body)).status, 422);
  }
  assert.equal(
    (await as('nobody', 'POST', '/place-shares', { ...spot, pseudos: ['tom'] })).status,
    409,
  );
});

test('a private place has no genre; the author deletes for all, a recipient only for self', async () => {
  const { as } = setup();
  await befriend(as);
  await as('a', 'POST', '/place-shares', { ...spot, genre: null, pseudos: ['tom'] });
  const list = (await as('a', 'GET', '/place-shares')).body as {
    places: { id: string; genre: unknown }[];
  };
  const id = list.places[0]?.id ?? '';
  assert.equal(list.places[0]?.genre, null);

  assert.equal((await as('b', 'DELETE', `/place-shares/${id}`)).status, 204);
  assert.equal(
    ((await as('b', 'GET', '/place-shares')).body as { places: unknown[] }).places.length,
    0,
  );
  assert.equal(
    ((await as('a', 'GET', '/place-shares')).body as { places: unknown[] }).places.length,
    1,
  );
  assert.equal((await as('c', 'DELETE', `/place-shares/${id}`)).status, 404);
  assert.equal((await as('a', 'DELETE', `/place-shares/${id}`)).status, 204);
  assert.equal(
    ((await as('a', 'GET', '/place-shares')).body as { places: unknown[] }).places.length,
    0,
  );
});
