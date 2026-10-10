import { countPersonalPlacesSince, type Visibility } from '@/db/personalPlaces';
import type { Db } from '@/db/types';

import { recordDiscovery, type NewDiscovery } from './recordDiscovery';

// A personal place reveals the fog like a discovery: the cap stops anyone from unveiling a city by creating places.
export const MAX_PERSONAL_PLACES_PER_DAY = 3;
export const MAX_NAME_LENGTH = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PersonalPlaceRefusal = 'emptyName' | 'limit';

export async function canCreatePersonalPlace(db: Db, now: number): Promise<boolean> {
  return (await countPersonalPlacesSince(db, now - DAY_MS)) < MAX_PERSONAL_PLACES_PER_DAY;
}

export async function personalPlaceRefusal(
  db: Db,
  name: string,
  now: number,
): Promise<PersonalPlaceRefusal | null> {
  if (name.trim() === '') return 'emptyName';
  return (await canCreatePersonalPlace(db, now)) ? null : 'limit';
}

// Call after personalPlaceRefusal returned null.
export function recordPersonalPlace(
  db: Db,
  photo: Omit<NewDiscovery, 'placeId' | 'personal'>,
  name: string,
  visibility: Visibility,
): Promise<void> {
  return recordDiscovery(db, {
    ...photo,
    // Local id: the server will give its own if the place is ever shared.
    placeId: `personal:${photo.takenAt}`,
    personal: { name: name.trim().slice(0, MAX_NAME_LENGTH), visibility },
  });
}
