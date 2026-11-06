import { supabase } from '@/features/account/supabase';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import type { TranslationKey } from '@/lib/i18n/t';

export type SocialResult<T> = { ok: true; value: T } | { ok: false; error: TranslationKey };

export interface Answer {
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
  invalid_post: 'circle.error.invalidPost',
  unknown_post: 'circle.error.unknownPost',
  own_post: 'circle.error.ownPost',
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
export async function call(path: string, method: string, body?: unknown): Promise<Answer | null> {
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

export function toResult<T>(
  answer: Answer | null,
  value: (body: unknown) => T | null,
): SocialResult<T> {
  if (!answer) return { ok: false, error: NETWORK };
  if (answer.status >= 200 && answer.status < 300) {
    const parsed = value(answer.body);
    return parsed === null ? { ok: false, error: NETWORK } : { ok: true, value: parsed };
  }
  const code = errorCode(answer.body);
  return { ok: false, error: (code && ERRORS[code]) || NETWORK };
}
