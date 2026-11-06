import type { FriendList } from '@discover/shared';

import { supabase } from '@/features/account/supabase';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import type { TranslationKey } from '@/lib/i18n/t';

export type SocialResult<T> = { ok: true; value: T } | { ok: false; error: TranslationKey };

interface Answer {
  status: number;
  body: unknown;
}

const ERRORS: Record<string, TranslationKey> = {
  pseudo_taken: 'circle.error.taken',
  invalid_pseudo: 'circle.error.invalidPseudo',
  unknown_pseudo: 'circle.error.unknown',
  self: 'circle.error.self',
  already_requested: 'circle.error.exists',
  profile_required: 'circle.error.profileRequired',
};

const NETWORK: TranslationKey = 'account.error.network';

function errorCode(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined;
  return typeof body.error === 'string' ? body.error : undefined;
}

function parse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// Only a pseudo and a session token leave the phone: no position, no game data.
async function call(path: string, method: string, body?: unknown): Promise<Answer | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!token || !baseUrl) return null;
  try {
    const response = await fetchWithTimeout(`${baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: parse(response.text) };
  } catch {
    return null;
  }
}

function toResult<T>(answer: Answer | null, value: (body: unknown) => T | null): SocialResult<T> {
  if (!answer) return { ok: false, error: NETWORK };
  if (answer.status >= 200 && answer.status < 300) {
    const parsed = value(answer.body);
    return parsed === null ? { ok: false, error: NETWORK } : { ok: true, value: parsed };
  }
  const code = errorCode(answer.body);
  return { ok: false, error: (code && ERRORS[code]) || NETWORK };
}

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
