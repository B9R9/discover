import type { SpotStatus } from '@discover/shared';

import { call, toResult, type SocialResult } from './apiClient';
import type { PersonalPlace } from '@/db/personalPlaces';

export type { SocialResult };

const done = (): true => true;

const STATUSES: readonly string[] = ['pending', 'approved', 'rejected'];

export function parseSpotStatuses(body: unknown): Record<string, SpotStatus> | null {
  const list =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).spots : null;
  if (!Array.isArray(list)) return null;
  const statuses: Record<string, SpotStatus> = {};
  for (const item of list) {
    const { placeId, status } = (item ?? {}) as Record<string, unknown>;
    if (typeof placeId !== 'string' || typeof status !== 'string' || !STATUSES.includes(status)) {
      return null;
    }
    statuses[placeId] = status as SpotStatus;
  }
  return statuses;
}

export async function fetchSpotStatuses(): Promise<SocialResult<Record<string, SpotStatus>>> {
  return toResult(await call('/spots/mine', 'GET'), parseSpotStatuses);
}

// The exact position of the spot goes to the server: the screen asks for confirmation first.
export async function proposeSpot(place: PersonalPlace): Promise<SocialResult<true>> {
  return toResult(
    await call('/spots', 'POST', {
      placeId: place.id,
      name: place.name,
      genre: place.genre,
      latitude: place.latitude,
      longitude: place.longitude,
    }),
    done,
  );
}

export async function withdrawSpot(placeId: string): Promise<SocialResult<true>> {
  return toResult(await call(`/spots/${encodeURIComponent(placeId)}`, 'DELETE'), done);
}
