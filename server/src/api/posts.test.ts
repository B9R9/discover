import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fakeMaps,
  fakePlaceShares,
  fakeSpots,
  fakeWalks,
  fakePosts,
  fakeSessions,
  fakeSocial,
  fakeStorage,
} from './fakeSocial.ts';
import type { PlacesStore } from './placesStore.ts';
import { route, type Reply, type Services } from './routes.ts';

const store: PlacesStore = {
  listAreas: () => Promise.resolve([]),
  listPlaces: () => Promise.resolve(null),
};

function setup(hasProfile: (user: string) => boolean = () => true) {
  const { storage, removed } = fakeStorage();
  const services: Services = {
    store,
    social: fakeSocial(),
    posts: fakePosts(hasProfile),
    maps: fakeMaps(),
    spots: fakeSpots(),
    walks: fakeWalks(),
    placeShares: fakePlaceShares(fakeSocial()),
    storage,
    auth: fakeSessions,
  };
  const as = (user: string, method: string, pathname: string, body?: unknown): Promise<Reply> =>
    route({ method, pathname, authorization: `Bearer token-${user}`, body }, services);
  return { services, as, removed };
}

const share = { placeId: 'osm:node/1', comment: 'Superbe vue' };

async function newPost(as: ReturnType<typeof setup>['as'], user = 'a') {
  const reply = await as(user, 'POST', '/posts', share);
  return (reply.body as { id: string; uploadUrl: string }).id;
}

test('post routes need a session and storage', async () => {
  const { services } = setup();
  assert.equal((await route({ method: 'GET', pathname: '/posts' }, services)).status, 401);
  const reply = await route(
    { method: 'GET', pathname: '/posts', authorization: 'Bearer token-a' },
    { ...services, storage: null },
  );
  assert.equal(reply.status, 503);
});

test('creating a post returns an upload URL and stays invisible until the upload is confirmed', async () => {
  const { as } = setup();
  const created = await as('a', 'POST', '/posts', share);
  assert.equal(created.status, 201);
  const { id, uploadUrl } = created.body as { id: string; uploadUrl: string };
  assert.match(uploadUrl, /^https:\/\/storage\.test\/upload\/a\//);
  assert.deepEqual((await as('a', 'GET', '/posts')).body, { posts: [] });
  assert.equal((await as('b', 'POST', `/posts/${id}/uploaded`)).status, 404);
  assert.equal((await as('a', 'POST', `/posts/${id}/uploaded`)).status, 204);
  const feed = (await as('a', 'GET', '/posts')).body as {
    posts: { id: string; photoUrl: string }[];
  };
  assert.equal(feed.posts.length, 1);
  assert.match(feed.posts[0]?.photoUrl ?? '', /^https:\/\/storage\.test\/read\//);
});

test('posts need a pseudo, a place and a comment of at most 280 characters', async () => {
  const { as } = setup((user) => user !== 'nopseudo');
  assert.equal((await as('nopseudo', 'POST', '/posts', share)).status, 409);
  for (const body of [
    undefined,
    {},
    { placeId: '', comment: 'x' },
    { placeId: 'p', comment: 'x'.repeat(281) },
    { placeId: 'p'.repeat(121), comment: '' },
    { placeId: 'p', placeName: 'n'.repeat(121), comment: '' },
  ]) {
    assert.equal((await as('a', 'POST', '/posts', body)).status, 422);
  }
  assert.equal((await as('a', 'POST', '/posts', { placeId: 'p', comment: '' })).status, 201);
});

test('deleting a post removes its photo, and only its author can', async () => {
  const { as, removed } = setup();
  const id = await newPost(as);
  assert.equal((await as('b', 'DELETE', `/posts/${id}`)).status, 404);
  assert.equal((await as('a', 'DELETE', `/posts/${id}`)).status, 204);
  assert.deepEqual(removed, [`a/${id}.jpg`]);
});

test('reporting refuses your own post and unknown posts', async () => {
  const { as } = setup();
  const id = await newPost(as);
  assert.equal((await as('a', 'POST', `/posts/${id}/report`)).status, 422);
  assert.equal((await as('b', 'POST', `/posts/${id}/report`)).status, 204);
  assert.equal(
    (await as('b', 'POST', '/posts/00000000-0000-4000-8000-999999999999/report')).status,
    404,
  );
});

test('blocking refuses yourself and unknown pseudos', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'POST', '/blocks', { pseudo: 'bob' })).status, 204);
  assert.equal((await as('a', 'POST', '/blocks', { pseudo: 'moi' })).status, 422);
  assert.equal((await as('a', 'POST', '/blocks', { pseudo: 'zed' })).status, 404);
  assert.equal((await as('a', 'POST', '/blocks', { pseudo: 'Bad Name' })).status, 422);
});

test('deleting the account removes every photo of the user first', async () => {
  const { as, removed } = setup();
  const first = await newPost(as);
  const second = await newPost(as);
  await newPost(as, 'b');
  assert.equal((await as('a', 'DELETE', '/me')).status, 204);
  assert.deepEqual(removed.sort(), [`a/${first}.jpg`, `a/${second}.jpg`].sort());
});

test('post paths refuse malformed ids and other methods', async () => {
  const { as } = setup();
  assert.equal((await as('a', 'DELETE', '/posts/not-a-uuid')).status, 405);
  const id = await newPost(as);
  assert.equal((await as('a', 'GET', `/posts/${id}`)).status, 405);
  assert.equal((await as('a', 'PUT', '/posts')).status, 405);
});
