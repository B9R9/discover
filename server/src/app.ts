import type { IncomingMessage, ServerResponse } from 'node:http';

export function handleRequest(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}
