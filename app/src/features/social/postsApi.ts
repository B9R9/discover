import type { SharedPost } from '@discover/shared';
import { File } from 'expo-file-system';

import type { TranslationKey } from '@/lib/i18n/t';

import { call, toResult, type SocialResult } from './apiClient';
import { stripJpeg } from './stripJpeg';

const UPLOAD_FAILED: TranslationKey = 'circle.error.upload';

function parseCreated(body: unknown): { id: string; uploadUrl: string } | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, uploadUrl } = body as Record<string, unknown>;
  return typeof id === 'string' && typeof uploadUrl === 'string' ? { id, uploadUrl } : null;
}

function isSharedPost(value: unknown): value is SharedPost {
  if (typeof value !== 'object' || value === null) return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === 'string' &&
    typeof post.pseudo === 'string' &&
    typeof post.placeId === 'string' &&
    typeof post.placeName === 'string' &&
    typeof post.comment === 'string' &&
    typeof post.createdAt === 'string' &&
    typeof post.mine === 'boolean' &&
    typeof post.photoUrl === 'string'
  );
}

export function parseFeed(body: unknown): SharedPost[] | null {
  const posts =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).posts : null;
  return Array.isArray(posts) && posts.every(isSharedPost) ? posts : null;
}

// Sends the photo to the one-time URL. The metadata is removed here, on the phone: the server
// never sees the original file.
async function uploadPhoto(uploadUrl: string, photoUri: string): Promise<boolean> {
  try {
    const original = new Uint8Array(await new File(photoUri).arrayBuffer());
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      // A fresh array of exactly the right size: its buffer is the file, nothing more.
      body: stripJpeg(original).buffer as ArrayBuffer,
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Shares a discovery: creates the post, sends the cleaned photo, then makes the post visible.
// An upload that fails leaves nothing visible: the post only counts once confirmed.
export async function sharePost(
  placeId: string,
  placeName: string,
  comment: string,
  photoUri: string,
): Promise<SocialResult<true>> {
  const created = toResult(
    await call('/posts', 'POST', { placeId, placeName, comment }),
    parseCreated,
  );
  if (!created.ok) return created;
  const { id, uploadUrl } = created.value;
  if (!(await uploadPhoto(uploadUrl, photoUri))) {
    await call(`/posts/${id}`, 'DELETE');
    return { ok: false, error: UPLOAD_FAILED };
  }
  return toResult(await call(`/posts/${id}/uploaded`, 'POST'), (): true => true);
}

export async function fetchFeed(): Promise<SocialResult<SharedPost[]>> {
  return toResult(await call('/posts', 'GET'), parseFeed);
}

export async function deletePost(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/posts/${id}`, 'DELETE'), (): true => true);
}

export async function reportPost(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/posts/${id}/report`, 'POST', {}), (): true => true);
}

export async function blockUser(pseudo: string): Promise<SocialResult<true>> {
  return toResult(await call('/blocks', 'POST', { pseudo }), (): true => true);
}
