import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';

const GOING = /^\/events\/([0-9a-f-]{36})\/going$/;

// The list is open to everyone, signed in or not: it holds nothing personal. The distance filter happens
// on the phone, so no position ever reaches the server. Saying "j'y vais" needs an account.
export async function eventsRoute(
  { method, pathname, authorization }: Request,
  { events, auth }: Services,
): Promise<Reply | null> {
  const going = GOING.exec(pathname);
  if (pathname === '/events') {
    if (method !== 'GET') return { status: 405, body: { error: 'method_not_allowed' } };
    return { status: 200, body: { events: await events.listUpcoming() } };
  }
  if (pathname !== '/events/attendance' && !going) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;
  if (going) {
    if (method !== 'PUT' && method !== 'DELETE') {
      return { status: 405, body: { error: 'method_not_allowed' } };
    }
    return (await events.setGoing(user, going[1] ?? '', method === 'PUT'))
      ? { status: 204, body: null }
      : { status: 404, body: { error: 'unknown_event' } };
  }
  if (method !== 'GET') return { status: 405, body: { error: 'method_not_allowed' } };
  return { status: 200, body: { attendance: await events.attendance(user) } };
}
