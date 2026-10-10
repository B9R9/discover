import { createServer } from 'node:http';

import { readPort } from './config.ts';

const port = readPort(process.env.PORT);

createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
