import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';

import { handleRequest } from './app.ts';

const server = createServer(handleRequest);
let baseUrl = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test('responds with a JSON health status', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json');
  assert.deepEqual(await res.json(), { status: 'ok' });
});
