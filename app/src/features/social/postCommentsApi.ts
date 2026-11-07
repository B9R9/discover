import type { PostComment } from '@discover/shared';

import { call, toResult, type SocialResult } from './apiClient';

export type { SocialResult };

function parseComment(item: unknown): PostComment | null {
  const row = (item ?? {}) as Record<string, unknown>;
  const { id, pseudo, text, createdAt, mine, byPostAuthor } = row;
  if (
    typeof id !== 'string' ||
    typeof pseudo !== 'string' ||
    typeof text !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof mine !== 'boolean' ||
    typeof byPostAuthor !== 'boolean'
  ) {
    return null;
  }
  return { id, pseudo, text, createdAt, mine, byPostAuthor };
}

export function parseComments(body: unknown): PostComment[] | null {
  const list =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).comments : null;
  if (!Array.isArray(list)) return null;
  const comments = list.map(parseComment);
  return comments.every((comment) => comment !== null) ? (comments as PostComment[]) : null;
}

export async function fetchComments(postId: string): Promise<SocialResult<PostComment[]>> {
  return toResult(
    await call(`/posts/${encodeURIComponent(postId)}/comments`, 'GET'),
    parseComments,
  );
}

export async function addComment(postId: string, text: string): Promise<SocialResult<true>> {
  return toResult(
    await call(`/posts/${encodeURIComponent(postId)}/comments`, 'POST', { text }),
    (): true => true,
  );
}

export async function removeComment(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/comments/${encodeURIComponent(id)}`, 'DELETE'), (): true => true);
}
