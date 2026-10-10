import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readPort } from './config.ts';

test('readPort defaults to 3000', () => {
  assert.equal(readPort(undefined), 3000);
  assert.equal(readPort(''), 3000);
});

test('readPort parses a valid port', () => {
  assert.equal(readPort('8080'), 8080);
});

test('readPort rejects invalid values', () => {
  assert.throws(() => readPort('abc'));
  assert.throws(() => readPort('70000'));
});
