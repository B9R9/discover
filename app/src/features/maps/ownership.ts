import type { Area } from '@discover/shared';

import { addOwnedMap, listOwnedMaps, type OwnedMap } from '@/db/ownedMaps';
import type { Db } from '@/db/types';

// A bought department unlocks its big cities too; the free one does not.
export function isUnlocked(area: Area, owned: readonly OwnedMap[]): boolean {
  return owned.some(
    (map) =>
      map.areaId === area.id || (map.areaId === area.departmentId && map.source === 'purchased'),
  );
}

// The first area the phone is found in gives its department for free, once: moving never changes it.
// ponytail: a department bought before the first GPS fix swallows the free claim (same owned_maps key), so the next department becomes free; store the claim apart if purchases open before onboarding ends.
export async function claimFreeMap(db: Db, area: Area, now: number): Promise<OwnedMap[]> {
  const owned = await listOwnedMaps(db);
  if (owned.some((map) => map.source === 'free')) return owned;
  await addOwnedMap(db, { areaId: area.departmentId ?? area.id, source: 'free', unlockedAt: now });
  return listOwnedMaps(db);
}
