import type { TranslationKey } from '@/lib/i18n/t';

import type { MapEntry } from './ownership';

export interface MapDescription {
  key: TranslationKey;
  params?: Record<string, string>;
}

// "Bordeaux", "Bordeaux et Mérignac", "Lyon, Villeurbanne et Vénissieux".
function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`;
}

// What the map covers, so the price reads against it: a free department lacks its big cities, a bought one has them.
export function describeMap(entry: MapEntry, maps: readonly MapEntry[]): MapDescription {
  if (entry.area.departmentId !== null) return { key: 'maps.describe.city' };
  const cities = joinNames(
    maps.filter((map) => map.area.departmentId === entry.area.id).map((map) => map.area.name),
  );
  if (!cities) return { key: 'maps.describe.department' };
  if (entry.status === 'free')
    return { key: 'maps.describe.freeWithoutCities', params: { cities } };
  return { key: 'maps.describe.departmentWithCities', params: { cities } };
}
