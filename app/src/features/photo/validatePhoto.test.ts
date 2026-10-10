import type { CachedPlace } from '@/db/placesCache';
import { fromMeters } from '@/lib/geo';

import { validatePhoto, type PhotoFix } from './validatePhoto';

const ORIGIN = { latitude: 44.39, longitude: -1.16 };
const NOW = 1_000_000;

function placeAt(id: string, metersNorth: number, discovered = false): CachedPlace {
  const [longitude, latitude] = fromMeters(ORIGIN, 0, metersNorth);
  return { id, areaId: 'biscarrosse', name: id, latitude, longitude, category: null, discovered };
}

function fix(overrides: Partial<PhotoFix> = {}): PhotoFix {
  return { ...ORIGIN, accuracy: 10, timestamp: NOW, ...overrides };
}

test('accepts a photo taken 49 m from the place', () => {
  expect(validatePhoto(fix(), [placeAt('a', 49)], NOW)).toEqual({ ok: true, placeId: 'a' });
});

test('refuses a photo taken 51 m from the place', () => {
  expect(validatePhoto(fix(), [placeAt('a', 51)], NOW)).toEqual({ ok: false, reason: 'tooFar' });
});

test('refuses an inaccurate or unknown accuracy', () => {
  const places = [placeAt('a', 10)];
  expect(validatePhoto(fix({ accuracy: 31 }), places, NOW)).toEqual({
    ok: false,
    reason: 'inaccurate',
  });
  expect(validatePhoto(fix({ accuracy: null }), places, NOW)).toEqual({
    ok: false,
    reason: 'inaccurate',
  });
});

test('refuses a mocked position', () => {
  expect(validatePhoto(fix({ mocked: true }), [placeAt('a', 10)], NOW)).toEqual({
    ok: false,
    reason: 'mocked',
  });
});

test('refuses a position older than 10 s', () => {
  expect(validatePhoto(fix({ timestamp: NOW - 10_001 }), [placeAt('a', 10)], NOW)).toEqual({
    ok: false,
    reason: 'stale',
  });
});

test('picks the closest undiscovered place, skipping discovered ones', () => {
  const places = [placeAt('far', 40), placeAt('done', 5, true), placeAt('near', 20)];
  expect(validatePhoto(fix(), places, NOW)).toEqual({ ok: true, placeId: 'near' });
});

test('tells when the only place in range is already discovered', () => {
  expect(validatePhoto(fix(), [placeAt('done', 5, true)], NOW)).toEqual({
    ok: false,
    reason: 'alreadyDiscovered',
  });
});
