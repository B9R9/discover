import type { Reply, Request, Services } from './routes.ts';

// Open to everyone, signed in or not: the list holds nothing personal. The distance filter happens
// on the phone, so no position ever reaches the server.
export async function eventsRoute(
  { method, pathname }: Request,
  { events }: Services,
): Promise<Reply | null> {
  if (pathname !== '/events') return null;
  if (method !== 'GET') return { status: 405, body: { error: 'method_not_allowed' } };
  return { status: 200, body: { events: await events.listUpcoming() } };
}
