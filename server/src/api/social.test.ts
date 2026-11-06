import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fakeSessions, fakeSocial } from './fakeSocial.ts';
import type { PlacesStore } from './placesStore.ts';
import { route, type Reply, type Services } from './routes.ts';

const store: PlacesStore = {
  listAreas: () => Promise.resolve([]),
  listPlaces: () => Promise.resolve(null),
};

function setup() {
  const services: Services = { store, social: fakeSocial(), auth: fakeSessions };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { services, as };
}

test('social routes need a valid session', async () => {
  const { services } = setup();
  for (const authorization of [undefined, 'Bearer nope', 'Basic token-a']) {
    const reply = await route({ method: 'GET', pathname: '/friends', authorization }, services);
    assert.equal(reply.status, 401);
  }
  const noAuth = await route({ method: 'GET', pathname: '/friends' }, { ...services, auth: null });
  assert.equal(noAuth.status, 503);
});

test('a profile is created once per pseudo and refuses bad or taken pseudos', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'GET', '/me/profile')).status, 404);
  assert.equal((await as('a', 'PUT', '/me/profile', { pseudo: 'lea_44' })).status, 204);
  assert.deepEqual(await as('a', 'GET', '/me/profile'), {
    status: 200,
    body: { pseudo: 'lea_44' },
  });
  assert.equal((await as('b', 'PUT', '/me/profile', { pseudo: 'lea_44' })).status, 409);
  for (const body of [
    undefined,
    {},
    { pseudo: 'Léa' },
    { pseudo: 'ab' },
    { pseudo: 'a'.repeat(21) },
    { pseudo: 'a b' },
  ]) {
    assert.equal((await as('b', 'PUT', '/me/profile', body)).status, 422);
  }
});

test('a friend request is sent, accepted and listed on both sides', async () => {
  const { as } = setup();
  await as('a', 'PUT', '/me/profile', { pseudo: 'alice' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'bob' });
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'bob' })).status, 204);
  assert.deepEqual((await as('a', 'GET', '/friends')).body, {
    friends: [],
    incoming: [],
    outgoing: ['bob'],
  });
  assert.deepEqual((await as('b', 'GET', '/friends')).body, {
    friends: [],
    incoming: ['alice'],
    outgoing: [],
  });
  assert.equal((await as('a', 'POST', '/friends/bob/accept')).status, 404);
  assert.equal((await as('b', 'POST', '/friends/alice/accept')).status, 204);
  assert.deepEqual((await as('a', 'GET', '/friends')).body, {
    friends: ['bob'],
    incoming: [],
    outgoing: [],
  });
});

test('requests refuse yourself, unknown pseudos, duplicates and users without a profile', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'bob' })).status, 409);
  await as('a', 'PUT', '/me/profile', { pseudo: 'alice' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'bob' });
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'alice' })).status, 422);
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'zed' })).status, 404);
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'bob' })).status, 204);
  assert.equal((await as('a', 'POST', '/friends/requests', { pseudo: 'bob' })).status, 409);
});

test('asking someone who already asked you makes you friends', async () => {
  const { as } = setup();
  await as('a', 'PUT', '/me/profile', { pseudo: 'alice' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'bob' });
  await as('a', 'POST', '/friends/requests', { pseudo: 'bob' });
  await as('b', 'POST', '/friends/requests', { pseudo: 'alice' });
  assert.deepEqual((await as('a', 'GET', '/friends')).body, {
    friends: ['bob'],
    incoming: [],
    outgoing: [],
  });
});

test('a friend, a request or an invitation can be removed from either side', async () => {
  const { as } = setup();
  await as('a', 'PUT', '/me/profile', { pseudo: 'alice' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'bob' });
  await as('a', 'POST', '/friends/requests', { pseudo: 'bob' });
  assert.equal((await as('b', 'DELETE', '/friends/alice')).status, 204);
  assert.equal((await as('b', 'DELETE', '/friends/alice')).status, 404);
  assert.deepEqual((await as('a', 'GET', '/friends')).body, {
    friends: [],
    incoming: [],
    outgoing: [],
  });
});

test('social routes refuse other methods and malformed paths', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'POST', '/friends')).status, 405);
  assert.equal((await as('a', 'GET', '/friends/bob')).status, 405);
  assert.equal((await as('a', 'DELETE', '/me/profile')).status, 405);
  assert.equal((await as('a', 'GET', '/friends/Bad%20Name')).status, 404);
});
