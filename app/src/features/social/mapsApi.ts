import type { SharedMap } from '@discover/shared';

import { call, toResult, type SocialResult } from './apiClient';

export type { SocialResult };

export interface MapStatus {
  count: number;
  updatedAt: string;
}

const done = (): true => true;

function parseStatus(body: unknown): MapStatus | null {
  if (typeof body !== 'object' || body === null) return null;
  const { count, updatedAt } = body as Record<string, unknown>;
  return typeof count === 'number' && typeof updatedAt === 'string' ? { count, updatedAt } : null;
}

export function parseSharedMap(body: unknown): SharedMap | null {
  if (typeof body !== 'object' || body === null) return null;
  const { pseudo, placeIds, updatedAt } = body as Record<string, unknown>;
  const valid =
    typeof pseudo === 'string' &&
    typeof updatedAt === 'string' &&
    Array.isArray(placeIds) &&
    placeIds.every((id) => typeof id === 'string');
  return valid ? { pseudo, placeIds: placeIds as string[], updatedAt } : null;
}

// null value: nothing shared yet (404), which is not an error.
export async function fetchMyMapStatus(): Promise<SocialResult<MapStatus | null>> {
  const answer = await call('/me/map', 'GET');
  if (answer?.status === 404) return { ok: true, value: null };
  return toResult(answer, parseStatus);
}

export async function shareMap(placeIds: string[]): Promise<SocialResult<true>> {
  return toResult(await call('/me/map', 'PUT', { placeIds }), done);
}

export async function stopSharingMap(): Promise<SocialResult<true>> {
  return toResult(await call('/me/map', 'DELETE'), done);
}

// null value: this friend shares no map (or is not a friend, the server does not tell them apart).
export async function fetchFriendMap(pseudo: string): Promise<SocialResult<SharedMap | null>> {
  const answer = await call(`/friends/${pseudo}/map`, 'GET');
  if (answer?.status === 404) return { ok: true, value: null };
  return toResult(answer, parseSharedMap);
}
