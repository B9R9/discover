import assert from 'node:assert/strict';
import { test } from 'node:test';

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
  UNKNOWN_POST,
} from './fakeSocial.ts';
import { route, type Reply, type Services } from './routes.ts';

const POST = '00000000-0000-4000-8000-000000000001';

function setup() {
  const social = fakeSocial();
  const services: Services = {
    store: { listAreas: () => Promise.resolve([]), listPlaces: () => Promise.resolve(null) },
    social,
    posts: fakePosts(),
    comments: fakeComments(),
    maps: fakeMaps(),
    spots: fakeSpots(),
    walks: fakeWalks(),
    placeShares: fakePlaceShares(social),
    events: fakeEvents(),
    storage: null,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return Object.assign(as, { services });
}

test('comments need a session', async () => {
  const reply = await route(
    { method: 'GET', pathname: `/posts/${POST}/comments`, authorization: 'Bearer nope' },
    setup().services,
  );
  assert.equal(reply.status, 401);
});

test('a comment is added, listed and removed by its author', async () => {
  const as = setup();
  const created = await as('a', 'POST', `/posts/${POST}/comments`, { text: '  avec plaisir  ' });
  assert.equal(created.status, 201);
  const id = (created.body as { id: string }).id;

  const list = await as('a', 'GET', `/posts/${POST}/comments`);
  const comments = (list.body as { comments: { text: string; mine: boolean }[] }).comments;
  assert.deepEqual(
    comments.map((comment) => [comment.text, comment.mine]),
    [['avec plaisir', true]],
  );
  const others = await as('b', 'GET', `/posts/${POST}/comments`);
  assert.equal((others.body as { comments: { mine: boolean }[] }).comments[0]?.mine, false);

  assert.equal((await as('b', 'DELETE', `/comments/${id}`)).status, 404);
  assert.equal((await as('a', 'DELETE', `/comments/${id}`)).status, 204);
});

test('empty and too long comments are refused', async () => {
  const as = setup();
  for (const text of ['', '   ', 'x'.repeat(141), 12, undefined]) {
    const reply = await as('a', 'POST', `/posts/${POST}/comments`, { text });
    assert.equal(reply.status, 422);
  }
});

test('a post the user cannot see has no comments', async () => {
  const as = setup();
  assert.equal((await as('a', 'GET', `/posts/${UNKNOWN_POST}/comments`)).status, 404);
  const reply = await as('a', 'POST', `/posts/${UNKNOWN_POST}/comments`, { text: 'coucou' });
  assert.equal(reply.status, 404);
});
