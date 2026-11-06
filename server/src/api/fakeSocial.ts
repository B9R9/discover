import type { AuthAdmin } from './authAdmin.ts';
import type { MapRow, MapsStore } from './mapsStore.ts';
import type { SpotStatus } from '@discover/shared';

import { MAX_PENDING_SPOTS, type SpotsStore } from './spotsStore.ts';
import type { PostsStore } from './postsStore.ts';
import type { SocialStore } from './socialStore.ts';
import type { StorageAdmin } from './storageAdmin.ts';

// Test doubles: an in-memory circle, and an Auth that knows the tokens "token-<user>".
export function fakeSocial(): SocialStore {
  const pseudos = new Map<string, string>();
  // "from>to" -> accepted
  const links = new Map<string, boolean>();
  const idOf = (pseudo: string) => [...pseudos].find(([, value]) => value === pseudo)?.[0];
  const pairKey = (a: string, b: string) => (links.has(`${a}>${b}`) ? `${a}>${b}` : `${b}>${a}`);

  return {
    getPseudo: (user) => Promise.resolve(pseudos.get(user) ?? null),
    setPseudo: (user, pseudo) => {
      const owner = idOf(pseudo);
      if (owner && owner !== user) return Promise.resolve('taken');
      pseudos.set(user, pseudo);
      return Promise.resolve('ok');
    },
    listFriends: (user) => {
      const list = { friends: [] as string[], incoming: [] as string[], outgoing: [] as string[] };
      for (const [key, accepted] of links) {
        const [from = '', to = ''] = key.split('>');
        if (from !== user && to !== user) continue;
        const other = pseudos.get(from === user ? to : from) ?? '';
        if (accepted) list.friends.push(other);
        else (from === user ? list.outgoing : list.incoming).push(other);
      }
      return Promise.resolve(list);
    },
    requestFriend: (user, pseudo) => {
      if (!pseudos.has(user)) return Promise.resolve('profile_required');
      const target = idOf(pseudo);
      if (!target) return Promise.resolve('unknown');
      if (target === user) return Promise.resolve('self');
      const key = pairKey(user, target);
      if (links.has(key)) {
        if (links.get(key) || key.startsWith(`${user}>`)) return Promise.resolve('exists');
        links.set(key, true);
        return Promise.resolve('ok');
      }
      links.set(`${user}>${target}`, false);
      return Promise.resolve('ok');
    },
    acceptFriend: (user, pseudo) => {
      const key = `${idOf(pseudo)}>${user}`;
      if (links.get(key) !== false) return Promise.resolve(false);
      links.set(key, true);
      return Promise.resolve(true);
    },
    removeFriend: (user, pseudo) => {
      const target = idOf(pseudo);
      return Promise.resolve(!!target && links.delete(pairKey(user, target)));
    },
  };
}

export const fakeSessions: AuthAdmin = {
  userIdFromToken: (token) =>
    Promise.resolve(token.startsWith('token-') ? token.slice('token-'.length) : null),
  deleteUser: () => Promise.resolve(),
};

interface FakePost {
  author: string;
  placeId: string;
  placeName: string;
  comment: string;
  path: string;
  uploaded: boolean;
  reporters: Set<string>;
}

// In-memory posts: only the author sees them (friend visibility is SQL, not tested here).
export function fakePosts(hasProfile: (user: string) => boolean = () => true): PostsStore {
  const posts = new Map<string, FakePost>();
  let next = 0;
  return {
    createPost: (user, placeId, placeName, comment) => {
      if (!hasProfile(user)) return Promise.resolve(null);
      const id = `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`;
      const path = `${user}/${id}.jpg`;
      posts.set(id, {
        author: user,
        placeId,
        placeName,
        comment,
        path,
        uploaded: false,
        reporters: new Set(),
      });
      return Promise.resolve({ id, path });
    },
    confirmUpload: (user, id) => {
      const post = posts.get(id);
      if (!post || post.author !== user) return Promise.resolve(false);
      post.uploaded = true;
      return Promise.resolve(true);
    },
    listFeed: (user) =>
      Promise.resolve(
        [...posts]
          .filter(([, post]) => post.uploaded && post.author === user)
          .map(([id, post]) => ({
            id,
            pseudo: 'moi',
            placeId: post.placeId,
            placeName: post.placeName,
            comment: post.comment,
            createdAt: '2026-11-07T10:00:00Z',
            mine: true,
            path: post.path,
          })),
      ),
    deletePost: (user, id) => {
      const post = posts.get(id);
      if (!post || post.author !== user) return Promise.resolve(null);
      posts.delete(id);
      return Promise.resolve(post.path);
    },
    listPaths: (user) =>
      Promise.resolve(
        [...posts.values()].filter((post) => post.author === user).map((post) => post.path),
      ),
    report: (user, id) => {
      const post = posts.get(id);
      if (!post) return Promise.resolve('unknown');
      if (post.author === user) return Promise.resolve('own');
      post.reporters.add(user);
      return Promise.resolve('ok');
    },
    block: (_user, pseudo) =>
      Promise.resolve(pseudo === 'moi' ? 'self' : pseudo === 'bob' ? 'ok' : 'unknown'),
  };
}

export function fakeStorage() {
  const removed: string[] = [];
  const storage: StorageAdmin = {
    createUploadUrl: (path) => Promise.resolve(`https://storage.test/upload/${path}?token=t`),
    createReadUrls: (paths) =>
      Promise.resolve(
        paths.map((path) =>
          path.includes('missing') ? null : `https://storage.test/read/${path}`,
        ),
      ),
    remove: (paths) => {
      removed.push(...paths);
      return Promise.resolve();
    },
  };
  return { storage, removed };
}

// In-memory maps: `friendsOf` says which pseudos each user may see.
export function fakeMaps(
  hasProfile: (user: string) => boolean = () => true,
  friendsOf: Record<string, string[]> = {},
): MapsStore {
  const maps = new Map<string, MapRow>();
  return {
    save: (user, placeIds) => {
      if (!hasProfile(user)) return Promise.resolve(false);
      maps.set(user, { placeIds, updatedAt: '2026-11-07T10:00:00Z' });
      return Promise.resolve(true);
    },
    remove: (user) => {
      maps.delete(user);
      return Promise.resolve();
    },
    get: (user) => Promise.resolve(maps.get(user) ?? null),
    getFriend: (user, pseudo) => {
      const map = friendsOf[user]?.includes(pseudo) ? maps.get(pseudo) : undefined;
      return Promise.resolve(map ? { pseudo, ...map } : null);
    },
  };
}

// In-memory spot proposals; `statuses` lets a test mark one as decided.
export function fakeSpots(hasProfile: (user: string) => boolean = () => true): SpotsStore {
  const spots = new Map<string, SpotStatus>();
  return {
    submit: (user, spot) => {
      if (!hasProfile(user)) return Promise.resolve('profile_required');
      const key = `${user}/${spot.placeId}`;
      if (spots.has(key)) return Promise.resolve('exists');
      const pending = [...spots].filter(([k, v]) => k.startsWith(`${user}/`) && v === 'pending');
      if (pending.length >= MAX_PENDING_SPOTS) return Promise.resolve('too_many');
      spots.set(key, 'pending');
      return Promise.resolve('ok');
    },
    listMine: (user) =>
      Promise.resolve(
        [...spots]
          .filter(([key]) => key.startsWith(`${user}/`))
          .map(([key, status]) => ({ placeId: key.slice(user.length + 1), status })),
      ),
    withdraw: (user, placeId) => Promise.resolve(spots.delete(`${user}/${placeId}`)),
  };
}
