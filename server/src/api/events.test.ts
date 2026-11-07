import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DetourEvent } from '@discover/shared';

import {
  fakeComments,
  fakeEvents,
  fakeMaps,
  fakePlaceShares,
  fakePosts,
  fakeSessions,
  fakeSocial,
  fakeSpots,
  fakeWalks,
} from './fakeSocial.ts';
import { route, type Services } from './routes.ts';

const UUID = '11111111-1111-4111-8111-111111111111';
const UNKNOWN = '22222222-2222-4222-8222-222222222222';

const event: DetourEvent = {
  id: UUID,
  title: 'Brocante',
  kind: 'Brocante',
  theme: '',
  description: '',
  placeName: 'Cour',
  area: 'Kallio',
  latitude: 60.18,
  longitude: 24.95,
  startsAt: '2026-11-14T11:00:00Z',
  endsAt: null,
  free: true,
  priceNote: '',
};

function services(): Services {
  const social = fakeSocial();
  const events = fakeEvents([event], social);
  return {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social,
    posts: fakePosts(),
    comments: fakeComments(),
    maps: fakeMaps(),
    spots: fakeSpots(),
    walks: fakeWalks(),
    placeShares: fakePlaceShares(social),
    events,
    storage: null,
    auth: fakeSessions,
  };
}

test('events are open to visitors without a session', async () => {
  const reply = await route({ method: 'GET', pathname: '/events' }, services());
  assert.equal(reply.status, 200);
  assert.deepEqual(reply.body, { events: [event] });
});

test('events can only be read', async () => {
  const reply = await route({ method: 'POST', pathname: '/events', body: {} }, services());
  assert.equal(reply.status, 405);
});

test('going to an outing needs a session and a known outing', async () => {
  const s = services();
  const anonymous = await route({ method: 'PUT', pathname: `/events/${UUID}/going` }, s);
  assert.equal(anonymous.status, 401);
  const as = (user: string, method: string, pathname: string) =>
    route({ method, pathname, authorization: `Bearer token-${user}` }, s);
  assert.equal((await as('a', 'PUT', `/events/${UNKNOWN}/going`)).status, 404);
  assert.equal((await as('a', 'POST', `/events/${UUID}/going`)).status, 405);
});

test('friends are named, others are counted', async () => {
  const s = services();
  const as = (user: string, method: string, pathname: string, body?: unknown) =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, s);
  await as('a', 'PUT', '/me/profile', { pseudo: 'lea' });
  await as('b', 'PUT', '/me/profile', { pseudo: 'tom' });
  await as('c', 'PUT', '/me/profile', { pseudo: 'ana' });
  await as('a', 'POST', '/friends/requests', { pseudo: 'tom' });
  await as('b', 'POST', '/friends/lea/accept');
  for (const user of ['b', 'c'])
    assert.equal((await as(user, 'PUT', `/events/${UUID}/going`)).status, 204);

  const seenByA = (await as('a', 'GET', '/events/attendance')).body as {
    attendance: { eventId: string; me: boolean; friends: string[]; others: number }[];
  };
  assert.deepEqual(seenByA.attendance, [{ eventId: UUID, me: false, friends: ['tom'], others: 1 }]);

  await as('a', 'PUT', `/events/${UUID}/going`);
  await as('b', 'DELETE', `/events/${UUID}/going`);
  const again = (await as('a', 'GET', '/events/attendance')).body as typeof seenByA;
  assert.deepEqual(again.attendance, [{ eventId: UUID, me: true, friends: [], others: 1 }]);
});
