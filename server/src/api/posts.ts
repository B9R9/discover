import { isValidPseudo, MAX_COMMENT_LENGTH, type SharedPost } from '@discover/shared';

import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const POST = new RegExp(`^/posts/(${UUID})(/uploaded|/report)?$`);
const READ_URL_SECONDS = 3600;
const MAX_PLACE_ID_LENGTH = 120;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });
const NO_CONTENT: Reply = { status: 204, body: null };

function text(body: unknown, name: string): string | null {
  const value =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : null;
  return typeof value === 'string' ? value : null;
}

// Answers the sharing routes; null when the path is not one of them.
export async function postsRoute(
  { method, pathname, authorization, body }: Request,
  { auth, posts, storage }: Services,
): Promise<Reply | null> {
  const post = POST.exec(pathname);
  if (pathname !== '/posts' && pathname !== '/blocks' && !post) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (pathname === '/blocks') {
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const pseudo = text(body, 'pseudo');
    if (!isValidPseudo(pseudo)) return error(422, 'invalid_pseudo');
    const outcome = await posts.block(user, pseudo);
    return outcome === 'ok'
      ? NO_CONTENT
      : outcome === 'self'
        ? error(422, 'self')
        : error(404, 'unknown_pseudo');
  }

  if (pathname === '/posts') {
    if (!storage) return error(503, 'storage_unavailable');
    if (method === 'GET') return listPosts(user, posts, storage);
    if (method === 'POST') {
      const placeId = text(body, 'placeId')?.trim();
      const comment = text(body, 'comment')?.trim() ?? '';
      if (!placeId || placeId.length > MAX_PLACE_ID_LENGTH || comment.length > MAX_COMMENT_LENGTH) {
        return error(422, 'invalid_post');
      }
      const created = await posts.createPost(user, placeId, comment);
      if (!created) return error(409, 'profile_required');
      return {
        status: 201,
        body: { id: created.id, uploadUrl: await storage.createUploadUrl(created.path) },
      };
    }
    return error(405, 'method_not_allowed');
  }

  const id = post?.[1] ?? '';
  const action = post?.[2];
  if (!action && method === 'DELETE') {
    const path = await posts.deletePost(user, id);
    if (path === null) return error(404, 'unknown_post');
    await storage?.remove([path]);
    return NO_CONTENT;
  }
  if (action === '/uploaded' && method === 'POST') {
    return (await posts.confirmUpload(user, id)) ? NO_CONTENT : error(404, 'unknown_post');
  }
  if (action === '/report' && method === 'POST') {
    const outcome = await posts.report(user, id);
    return outcome === 'ok'
      ? NO_CONTENT
      : outcome === 'own'
        ? error(422, 'own_post')
        : error(404, 'unknown_post');
  }
  return error(405, 'method_not_allowed');
}

async function listPosts(
  user: string,
  posts: Services['posts'],
  storage: NonNullable<Services['storage']>,
): Promise<Reply> {
  const rows = await posts.listFeed(user);
  const urls = await storage.createReadUrls(
    rows.map((row) => row.path),
    READ_URL_SECONDS,
  );
  const feed: SharedPost[] = [];
  rows.forEach((row, index) => {
    const photoUrl = urls[index];
    if (photoUrl) {
      feed.push({
        id: row.id,
        pseudo: row.pseudo,
        placeId: row.placeId,
        comment: row.comment,
        createdAt: row.createdAt,
        mine: row.mine,
        photoUrl,
      });
    }
  });
  return { status: 200, body: { posts: feed } };
}
