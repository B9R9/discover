import type { FriendList } from '@discover/shared';

import { call, toResult, type SocialResult } from './apiClient';

export type { SocialResult };

function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseFriendList(body: unknown): FriendList | null {
  if (typeof body !== 'object' || body === null) return null;
  const { friends, incoming, outgoing } = body as Record<string, unknown>;
  return isStrings(friends) && isStrings(incoming) && isStrings(outgoing)
    ? { friends, incoming, outgoing }
    : null;
}

function parsePseudo(body: unknown): string | null {
  const pseudo = typeof body === 'object' && body !== null && 'pseudo' in body ? body.pseudo : null;
  return typeof pseudo === 'string' ? pseudo : null;
}

const done = (): true => true;

// null value: no pseudo chosen yet (404), which is not an error.
export async function fetchPseudo(): Promise<SocialResult<string | null>> {
  const answer = await call('/me/profile', 'GET');
  if (answer?.status === 404) return { ok: true, value: null };
  return toResult(answer, parsePseudo);
}

export async function savePseudo(pseudo: string): Promise<SocialResult<true>> {
  return toResult(await call('/me/profile', 'PUT', { pseudo }), done);
}

export async function fetchFriends(): Promise<SocialResult<FriendList>> {
  return toResult(await call('/friends', 'GET'), parseFriendList);
}

export async function sendRequest(pseudo: string): Promise<SocialResult<true>> {
  return toResult(await call('/friends/requests', 'POST', { pseudo }), done);
}

export async function acceptRequest(pseudo: string): Promise<SocialResult<true>> {
  return toResult(await call(`/friends/${pseudo}/accept`, 'POST'), done);
}

// A friend, an incoming request to decline or an outgoing one to cancel.
export async function removeFriend(pseudo: string): Promise<SocialResult<true>> {
  return toResult(await call(`/friends/${pseudo}`, 'DELETE'), done);
}
