import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import type { TranslationKey } from '@/lib/i18n/t';

import { supabase } from './supabase';

export type AccountResult = { ok: true } | { ok: false; error: TranslationKey };

const CODE_LENGTH = 6;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Loose on purpose: Supabase does the real check, this only catches typos before sending.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}

function failure(code: string | undefined): AccountResult {
  if (code === 'otp_expired') return { ok: false, error: 'account.error.badCode' };
  if (code?.startsWith('over_')) return { ok: false, error: 'account.error.tooMany' };
  return { ok: false, error: 'account.error.network' };
}

export async function requestCode(email: string): Promise<AccountResult> {
  const address = normalizeEmail(email);
  if (!isValidEmail(address)) return { ok: false, error: 'account.error.badEmail' };
  const { error } = await supabase.auth.signInWithOtp({ email: address });
  return error ? failure(error.code) : { ok: true };
}

export async function verifyCode(email: string, code: string): Promise<AccountResult> {
  const token = code.trim();
  if (!isValidCode(token)) return { ok: false, error: 'account.error.badCode' };
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token,
    type: 'email',
  });
  return error ? failure(error.code) : { ok: true };
}

export async function signOut(): Promise<AccountResult> {
  // Local scope: works offline, and ending sessions on other devices is not this button's job.
  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true };
}

// Deletes the account on the server. Discoveries stay on the phone: they were never tied to the account.
export async function deleteAccount(
  apiUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): Promise<AccountResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token || !apiUrl) return { ok: false, error: 'account.error.network' };
  try {
    const response = await fetchWithTimeout(`${apiUrl}/me`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { ok: false, error: 'account.error.network' };
  } catch {
    return { ok: false, error: 'account.error.network' };
  }
  // The server already removed the user; signing out clears the local session.
  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true };
}
