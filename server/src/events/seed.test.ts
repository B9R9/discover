import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseEvents } from './seed.ts';

const ok = {
  title: 'Brocante',
  kind: 'Brocante',
  placeName: 'Cour',
  latitude: 60.18,
  longitude: 24.95,
  startsAt: '2026-11-14T11:00:00+02:00',
};

test('a minimal event gets its defaults', () => {
  const [event] = parseEvents([ok]) ?? [];
  assert.equal(event?.free, false);
  assert.equal(event?.endsAt, null);
  assert.equal(event?.theme, '');
});

test('bad events are refused as a whole file', () => {
  for (const bad of [
    { ...ok, startsAt: '2026-11-14T11:00:00' },
    { ...ok, startsAt: 'demain' },
    { ...ok, latitude: 95 },
    { ...ok, title: '' },
    { ...ok, endsAt: '2026-11-14T10:00:00+02:00' },
    { ...ok, free: 'oui' },
  ]) {
    assert.equal(parseEvents([ok, bad]), null);
  }
  assert.equal(parseEvents({}), null);
});
