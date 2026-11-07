import { createServer, type IncomingMessage } from 'node:http';

import { supabaseAuthAdmin } from './api/authAdmin.ts';
import { postgresPlacesStore } from './api/placesStore.ts';
import { postgresMapsStore } from './api/mapsStore.ts';
import { postgresSpotsStore } from './api/spotsStore.ts';
import { postgresPlaceSharesStore } from './api/placeSharesStore.ts';
import { postgresWalksStore } from './api/walksStore.ts';
import { postgresPostsStore } from './api/postsStore.ts';
import { route, type Reply, type Services } from './api/routes.ts';
import { postgresSocialStore } from './api/socialStore.ts';
import { supabaseStorageAdmin } from './api/storageAdmin.ts';
import { readPort } from './config.ts';
import { connect } from './db.ts';

const port = readPort(process.env.PORT);
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
const sql = connect(process.env.DATABASE_URL);
const services: Services = {
  store: postgresPlacesStore(sql),
  social: postgresSocialStore(sql),
  posts: postgresPostsStore(sql),
  maps: postgresMapsStore(sql),
  spots: postgresSpotsStore(sql),
  walks: postgresWalksStore(sql),
  placeShares: postgresPlaceSharesStore(sql),
  storage:
    SUPABASE_URL && SUPABASE_SECRET_KEY
      ? supabaseStorageAdmin(SUPABASE_URL, SUPABASE_SECRET_KEY)
      : null,
  auth:
    SUPABASE_URL && SUPABASE_SECRET_KEY
      ? supabaseAuthAdmin(SUPABASE_URL, SUPABASE_SECRET_KEY)
      : null,
};

// The biggest body is a shared map: 5000 place ids of at most 120 characters stay below this.
const MAX_BODY_BYTES = 262_144;

// JSON bodies are small (a pseudo, a comment, a list of ids): anything bigger or malformed is treated as no body.
async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) return undefined;
    chunks.push(chunk as Buffer);
  }
  try {
    return size === 0 ? undefined : JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const method = req.method ?? 'GET';
  let reply: Reply;
  try {
    const { authorization } = req.headers;
    reply = await route({ method, pathname, authorization, body: await readJson(req) }, services);
  } catch (error) {
    console.error(error);
    reply = { status: 500, body: { error: 'internal' } };
  }
  res.writeHead(reply.status, {
    'content-type': 'application/json',
    // Places change at most once a day (collection job); nothing else may be cached.
    // A reply for a signed-in user is never shared through a cache.
    'cache-control':
      reply.status === 200 && method === 'GET' && !req.headers.authorization
        ? 'public, max-age=3600'
        : 'no-store',
  });
  res.end(reply.body === null ? undefined : JSON.stringify(reply.body));
  // Method, path and status only: never the query string, a token or the client address.
  console.log(`${method} ${pathname} ${reply.status}`);
}).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
