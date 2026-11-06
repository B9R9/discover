import type { SharedWalk } from '@discover/shared';

import { call, toResult, type SocialResult } from './apiClient';

export type { SocialResult };

const done = (): true => true;

function isWalk(value: unknown): value is SharedWalk {
  if (typeof value !== 'object' || value === null) return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.name === 'string' &&
    (typeof w.pseudo === 'string' || w.pseudo === null) &&
    typeof w.mine === 'boolean' &&
    Array.isArray(w.path) &&
    w.path.every(
      (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number'),
    ) &&
    typeof w.distanceMeters === 'number' &&
    typeof w.durationSeconds === 'number' &&
    typeof w.createdAt === 'string'
  );
}

export function parseWalks(body: unknown): SharedWalk[] | null {
  const walks =
    typeof body === 'object' && body !== null ? (body as { walks?: unknown }).walks : null;
  return Array.isArray(walks) && walks.every(isWalk) ? walks : null;
}

export async function fetchWalks(): Promise<SocialResult<SharedWalk[]>> {
  return toResult(await call('/walks', 'GET', undefined, true), parseWalks);
}

// Only the snapped path and a name leave the phone: the server computes distance and duration.
export async function publishWalk(
  name: string,
  path: readonly [number, number][],
): Promise<SocialResult<true>> {
  return toResult(await call('/walks', 'POST', { name, path }), done);
}

export async function deleteWalk(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/walks/${id}`, 'DELETE'), done);
}

export async function reportWalk(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/walks/${id}/report`, 'POST'), done);
}
