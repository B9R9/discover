import { createServer } from 'node:http';

import { postgresPlacesStore } from './api/placesStore.ts';
import { route } from './api/routes.ts';
import { readPort } from './config.ts';
import { connect } from './db.ts';

const port = readPort(process.env.PORT);
const store = postgresPlacesStore(connect(process.env.DATABASE_URL));

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const method = req.method ?? 'GET';
  let reply;
  try {
    reply = await route(method, pathname, store);
  } catch (error) {
    console.error(error);
    reply = { status: 500, body: { error: 'internal' } };
  }
  res.writeHead(reply.status, {
    'content-type': 'application/json',
    // Places change at most once a day (collection job).
    'cache-control': reply.status === 200 ? 'public, max-age=3600' : 'no-store',
  });
  res.end(JSON.stringify(reply.body));
  // Method, path and status only: never the query string or client address.
  console.log(`${method} ${pathname} ${reply.status}`);
}).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
