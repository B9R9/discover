import type { Area } from '@discover/shared';

import { addOwnedMap, listOwnedMaps, type MapSource, type OwnedMap } from '@/db/ownedMaps';
import type { Db } from '@/db/types';

export type MapStatus = MapSource | 'locked';

// A bought department unlocks its big cities too; the free one does not.
export function mapStatus(area: Area, owned: readonly OwnedMap[]): MapStatus {
  const own = owned.find((map) => map.areaId === area.id);
  if (own) return own.source;
  const department = owned.find((map) => map.areaId === area.departmentId);
  return department?.source === 'purchased' ? 'purchased' : 'locked';
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

// The first area the phone is found in gives its department for free, once: moving never changes it.
// ponytail: a department bought before the first GPS fix swallows the free claim (same owned_maps key), so the next department becomes free; store the claim apart if purchases open before onboarding ends.
export async function claimFreeMap(db: Db, area: Area, now: number): Promise<OwnedMap[]> {
  const owned = await listOwnedMaps(db);
  if (owned.some((map) => map.source === 'free')) return owned;
  await addOwnedMap(db, { areaId: area.departmentId ?? area.id, source: 'free', unlockedAt: now });
  return listOwnedMaps(db);
}
