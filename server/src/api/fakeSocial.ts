import type { AuthAdmin } from './authAdmin.ts';
import type { SocialStore } from './socialStore.ts';

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
