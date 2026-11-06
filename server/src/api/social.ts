import { isValidPseudo } from '@discover/shared';

import { authenticate } from './session.ts';
import type { Reply, Request, Services } from './routes.ts';
import type { RequestOutcome } from './socialStore.ts';

const FRIEND = /^\/friends\/([a-z0-9_]+)(\/accept)?$/;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });
const NO_CONTENT: Reply = { status: 204, body: null };

const REQUEST_REPLIES: Record<RequestOutcome, Reply> = {
  ok: NO_CONTENT,
  profile_required: error(409, 'profile_required'),
  unknown: error(404, 'unknown_pseudo'),
  self: error(422, 'self'),
  exists: error(409, 'already_requested'),
};

function pseudoOf(body: unknown): string | null {
  const value = typeof body === 'object' && body !== null && 'pseudo' in body ? body.pseudo : null;
  return isValidPseudo(value) ? value : null;
}

// Answers the routes that need a signed-in user; null when the path is not one of them.
export async function socialRoute(
  { method, pathname, authorization, body }: Request,
  { auth, social }: Services,
): Promise<Reply | null> {
  const friend = FRIEND.exec(pathname);
  const known =
    pathname === '/me/profile' ||
    pathname === '/friends' ||
    pathname === '/friends/requests' ||
    friend;
  if (!known) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (pathname === '/me/profile') {
    if (method === 'GET') {
      const pseudo = await social.getPseudo(user);
      return pseudo ? { status: 200, body: { pseudo } } : error(404, 'no_profile');
    }
    if (method === 'PUT') {
      const pseudo = pseudoOf(body);
      if (!pseudo) return error(422, 'invalid_pseudo');
      return (await social.setPseudo(user, pseudo)) === 'ok'
        ? NO_CONTENT
        : error(409, 'pseudo_taken');
    }
  }
  if (pathname === '/friends' && method === 'GET') {
    return { status: 200, body: await social.listFriends(user) };
  }
  if (pathname === '/friends/requests' && method === 'POST') {
    const pseudo = pseudoOf(body);
    return pseudo
      ? REQUEST_REPLIES[await social.requestFriend(user, pseudo)]
      : error(422, 'invalid_pseudo');
  }
  const pseudo = friend?.[1];
  if (pseudo && friend[2] && method === 'POST') {
    return (await social.acceptFriend(user, pseudo)) ? NO_CONTENT : error(404, 'no_request');
  }
  if (pseudo && !friend[2] && method === 'DELETE') {
    return (await social.removeFriend(user, pseudo)) ? NO_CONTENT : error(404, 'not_friends');
  }
  return error(405, 'method_not_allowed');
}
