import type { Area } from '@discover/shared';

import { addOwnedMap, listOwnedMaps, type MapSource, type OwnedMap } from '@/db/ownedMaps';
import type { Db } from '@/db/types';
import { COUNTRY_MAP } from '@/features/purchases/mapProducts';

export type MapStatus = MapSource | 'locked';

// A bought department unlocks its big cities too, the country map unlocks everything; the free department
// unlocks only itself. Bought wins over free: the free department may be bought later for its big cities.
export function mapStatus(area: Area, owned: readonly OwnedMap[]): MapStatus {
  const covers = (map: OwnedMap) =>
    map.areaId === area.id || map.areaId === area.departmentId || map.areaId === COUNTRY_MAP;
  if (owned.some((map) => map.source === 'purchased' && covers(map))) return 'purchased';
  return owned.some((map) => map.areaId === area.id) ? 'free' : 'locked';
}

export function isUnlocked(area: Area, owned: readonly OwnedMap[]): boolean {
  return mapStatus(area, owned) !== 'locked';
}

export interface MapEntry {
  area: Area;
  status: MapStatus;
}

// Departments with something unlocked first, then the others; each one followed by its big cities.
export function listMaps(areas: readonly Area[], owned: readonly OwnedMap[]): MapEntry[] {
  const groups = areas
    .filter((area) => area.departmentId === null)
    .map((department) =>
      [department, ...areas.filter((area) => area.departmentId === department.id)].map((area) => ({
        area,
        status: mapStatus(area, owned),
      })),
    );
  const hasUnlocked = (group: MapEntry[]) => group.some((entry) => entry.status !== 'locked');
  return [...groups.filter(hasUnlocked), ...groups.filter((group) => !hasUnlocked(group))].flat();
}

// Locked maps are for sale. The free department too, but only while one of its big cities is still locked:
// otherwise buying it would add nothing.
export function isForSale(entry: MapEntry, maps: readonly MapEntry[]): boolean {
  if (entry.status !== 'free') return entry.status === 'locked';
  return maps.some((map) => map.area.departmentId === entry.area.id && map.status === 'locked');
}

// The first area the phone is found in gives its department for free, once: moving never changes it.
// ponytail: a department bought before the first GPS fix swallows the free claim (same owned_maps key), so the next department becomes free; store the claim apart if purchases open before onboarding ends.
export async function claimFreeMap(db: Db, area: Area, now: number): Promise<OwnedMap[]> {
  const owned = await listOwnedMaps(db);
  if (owned.some((map) => map.source === 'free')) return owned;
  await addOwnedMap(db, { areaId: area.departmentId ?? area.id, source: 'free', unlockedAt: now });
  return listOwnedMaps(db);
}
