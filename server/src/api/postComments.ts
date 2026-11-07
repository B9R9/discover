import { MAX_POST_COMMENT } from '@discover/shared';

import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const POST_COMMENTS = new RegExp(`^/posts/(${UUID})/comments$`);
const COMMENT = new RegExp(`^/comments/(${UUID})$`);

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });

// Answers the comment routes; null when the path is not one of them.
export async function postCommentsRoute(
  { method, pathname, authorization, body }: Request,
  { auth, comments }: Services,
): Promise<Reply | null> {
  const postId = POST_COMMENTS.exec(pathname)?.[1];
  const commentId = COMMENT.exec(pathname)?.[1];
  if (!postId && !commentId) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (postId) {
    if (method === 'GET') {
      const list = await comments.list(user, postId);
      return list ? { status: 200, body: { comments: list } } : error(404, 'unknown_post');
    }
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const raw =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>).text : null;
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (text.length === 0 || text.length > MAX_POST_COMMENT) return error(422, 'invalid_comment');
    const created = await comments.add(user, postId, text);
    if (created === 'unknown') return error(404, 'unknown_post');
    return created ? { status: 201, body: created } : error(409, 'profile_required');
  }

  if (method !== 'DELETE') return error(405, 'method_not_allowed');
  return (await comments.remove(user, commentId ?? ''))
    ? { status: 204, body: null }
    : error(404, 'unknown_comment');
}
