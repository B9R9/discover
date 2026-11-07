import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DetourEvent } from '@discover/shared';

import {
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

const event: DetourEvent = {
  id: 'e1',
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
  return {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social,
    posts: fakePosts(),
    maps: fakeMaps(),
    spots: fakeSpots(),
    walks: fakeWalks(),
    placeShares: fakePlaceShares(social),
    events: fakeEvents([event]),
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
