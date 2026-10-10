import { createServer } from 'node:http';

import { supabaseAuthAdmin } from './api/authAdmin.ts';
import { postgresPlacesStore } from './api/placesStore.ts';
import { route, type Reply, type Services } from './api/routes.ts';
import { readPort } from './config.ts';
import { connect } from './db.ts';

const port = readPort(process.env.PORT);
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
const services: Services = {
  store: postgresPlacesStore(connect(process.env.DATABASE_URL)),
  auth:
    SUPABASE_URL && SUPABASE_SECRET_KEY
      ? supabaseAuthAdmin(SUPABASE_URL, SUPABASE_SECRET_KEY)
      : null,
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const method = req.method ?? 'GET';
  let reply: Reply;
  try {
    reply = await route({ method, pathname, authorization: req.headers.authorization }, services);
  } catch (error) {
    console.error(error);
    reply = { status: 500, body: { error: 'internal' } };
  }
  res.writeHead(reply.status, {
    'content-type': 'application/json',
    // Places change at most once a day (collection job); nothing else may be cached.
    'cache-control': reply.status === 200 && method === 'GET' ? 'public, max-age=3600' : 'no-store',
  });
  res.end(reply.body === null ? undefined : JSON.stringify(reply.body));
  // Method, path and status only: never the query string, a token or the client address.
  console.log(`${method} ${pathname} ${reply.status}`);
}).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
