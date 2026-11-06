import type { AuthAdmin } from './authAdmin.ts';
import type { Reply } from './routes.ts';

const BEARER = /^Bearer (\S+)$/;

// The id of the user behind the Authorization header, or the reply to send instead.
export async function authenticate(
  authorization: string | undefined,
  auth: AuthAdmin | null,
): Promise<string | Reply> {
  if (!auth) return { status: 503, body: { error: 'auth_unavailable' } };
  const token = authorization ? BEARER.exec(authorization)?.[1] : undefined;
  const userId = token ? await auth.userIdFromToken(token) : null;
  return userId ?? { status: 401, body: { error: 'unauthorized' } };
}
