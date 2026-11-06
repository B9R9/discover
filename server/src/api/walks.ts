import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';
import { measure, parsePath } from './walkMetrics.ts';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const WALK = new RegExp(`^/walks/(${UUID})(/report)?$`);
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 80;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });
const NO_CONTENT: Reply = { status: 204, body: null };

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : null;
}

// Answers the walk routes; null when the path is not one of them.
export async function walksRoute(
  { method, pathname, authorization, body }: Request,
  { auth, walks }: Services,
): Promise<Reply | null> {
  const walk = WALK.exec(pathname);
  if (pathname !== '/walks' && !walk) return null;

  // Walks made by Détour are open to everyone: a plain GET without a session lists only those.
  if (pathname === '/walks' && method === 'GET' && !authorization) {
    return { status: 200, body: { walks: await walks.list(null) } };
  }

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (pathname === '/walks') {
    if (method === 'GET') return { status: 200, body: { walks: await walks.list(user) } };
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const name = field(body, 'name');
    const path = parsePath(field(body, 'path'));
    const metrics = path && measure(path);
    if (typeof name !== 'string' || !path || !metrics) return error(422, 'invalid_walk');
    const trimmed = name.trim();
    if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
      return error(422, 'invalid_walk');
    }
    const id = await walks.create(user, trimmed, path, metrics);
    return id ? { status: 201, body: { id } } : error(409, 'profile_required');
  }

  const id = walk?.[1] ?? '';
  if (walk?.[2]) {
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const outcome = await walks.report(user, id);
    return outcome === 'ok'
      ? NO_CONTENT
      : outcome === 'own'
        ? error(422, 'own_walk')
        : error(404, 'unknown_walk');
  }
  if (method !== 'DELETE') return error(405, 'method_not_allowed');
  return (await walks.remove(user, id)) ? NO_CONTENT : error(404, 'unknown_walk');
}
