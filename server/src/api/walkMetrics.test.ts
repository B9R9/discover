import assert from 'node:assert/strict';
import { test } from 'node:test';

import { measure, parsePath } from './walkMetrics.ts';

test('one degree of latitude is about 111 km, walked at 4.5 km/h', () => {
  const metrics = measure([
    [0, 44],
    [0, 44.01],
  ]);
  assert.ok(metrics);
  assert.ok(Math.abs(metrics.distanceMeters - 1112) < 5);
  assert.equal(metrics.durationSeconds, Math.round(metrics.distanceMeters / 1.25));
});

test('too long or empty walks have no metrics', () => {
  assert.equal(
    measure([
      [0, 44],
      [0, 44],
    ]),
    null,
  );
  assert.equal(
    measure([
      [0, 44],
      [0, 45],
    ]),
    null,
  );
});

test('parsePath refuses anything but a list of valid pairs', () => {
  assert.deepEqual(
    parsePath([
      [1, 2],
      [3, 4],
    ]),
    [
      [1, 2],
      [3, 4],
    ],
  );
  for (const bad of [
    null,
    [],
    [[1, 2]],
    [[1, 2], [3]],
    [
      [1, 2],
      ['a', 4],
    ],
    [
      [1, 2],
      [181, 0],
    ],
    [
      [1, 2],
      [0, 91],
    ],
  ]) {
    assert.equal(parsePath(bad), null);
  }
  assert.equal(parsePath(Array(2001).fill([0, 0])), null);
});
