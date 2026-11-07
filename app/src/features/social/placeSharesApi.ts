import { SPOT_GENRES, type SharedPlace, type SpotGenre } from '@discover/shared';

import type { PersonalPlace } from '@/db/personalPlaces';

import { call, toResult, type SocialResult } from './apiClient';

export type { SocialResult };

const done = (): true => true;

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parsePlace(item: unknown): SharedPlace | null {
  const row = (item ?? {}) as Record<string, unknown>;
  const { id, name, comment, pseudo, createdAt } = {
    id: text(row.id),
    name: text(row.name),
    comment: text(row.comment),
    pseudo: text(row.pseudo),
    createdAt: text(row.createdAt),
  };
  const genre = row.genre === null ? null : text(row.genre);
  const to = Array.isArray(row.to) && row.to.every((p) => typeof p === 'string') ? row.to : null;
  const valid =
    id !== null &&
    name !== null &&
    comment !== null &&
    pseudo !== null &&
    createdAt !== null &&
    typeof row.latitude === 'number' &&
    typeof row.longitude === 'number' &&
    typeof row.mine === 'boolean' &&
    to !== null &&
    (genre === null || (SPOT_GENRES as readonly string[]).includes(genre));
  if (!valid) return null;
  return {
    id,
    name,
    comment,
    pseudo,
    createdAt,
    genre: genre as SpotGenre | null,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    mine: row.mine as boolean,
    to: to as string[],
  };
}

export function parsePlaceShares(body: unknown): SharedPlace[] | null {
  const list =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).places : null;
  if (!Array.isArray(list)) return null;
  const places = list.map(parsePlace);
  return places.every((place) => place !== null) ? (places as SharedPlace[]) : null;
}

export async function fetchSharedPlaces(): Promise<SocialResult<SharedPlace[]>> {
  return toResult(await call('/place-shares', 'GET'), parsePlaceShares);
}

// The exact position goes to the chosen friends: the screen asks for confirmation first.
export async function sharePlace(
  place: PersonalPlace,
  comment: string,
  pseudos: string[],
): Promise<SocialResult<true>> {
  return toResult(
    await call('/place-shares', 'POST', {
      name: place.name,
      genre: place.visibility === 'public' ? place.genre : null,
      latitude: place.latitude,
      longitude: place.longitude,
      comment,
      pseudos,
    }),
    done,
  );
}

export async function removeSharedPlace(id: string): Promise<SocialResult<true>> {
  return toResult(await call(`/place-shares/${encodeURIComponent(id)}`, 'DELETE'), done);
}
