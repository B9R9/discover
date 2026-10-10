import type { PlaceId } from '@discover/shared';

import type { CachedPlace } from '@/db/placesCache';
import type { GeoPoint } from '@/db/types';
import { distanceMeters } from '@/lib/geo';

export const MAX_DISTANCE_METERS = 50;
export const MAX_ACCURACY_METERS = 30;
export const MAX_FIX_AGE_MS = 10_000;

export interface PhotoFix extends GeoPoint {
  accuracy: number | null;
  timestamp: number;
  mocked?: boolean;
}

export type RefusalReason = 'mocked' | 'inaccurate' | 'stale' | 'alreadyDiscovered' | 'tooFar';

export type PhotoValidation = { ok: true; placeId: PlaceId } | { ok: false; reason: RefusalReason };

export function validatePhoto(
  fix: PhotoFix,
  places: readonly CachedPlace[],
  takenAt: number,
): PhotoValidation {
  if (fix.mocked) return { ok: false, reason: 'mocked' };
  if (fix.accuracy === null || fix.accuracy > MAX_ACCURACY_METERS) {
    return { ok: false, reason: 'inaccurate' };
  }
  if (Math.abs(takenAt - fix.timestamp) > MAX_FIX_AGE_MS) return { ok: false, reason: 'stale' };

  const inRange = places
    .map((place) => ({ place, distance: distanceMeters(fix, place) }))
    .filter(({ distance }) => distance <= MAX_DISTANCE_METERS)
    .sort((a, b) => a.distance - b.distance);
  const target = inRange.find(({ place }) => !place.discovered);
  if (target) return { ok: true, placeId: target.place.id };
  return { ok: false, reason: inRange.length > 0 ? 'alreadyDiscovered' : 'tooFar' };
}
