import type { AreaId } from '@discover/shared';

import type { OwnedMap } from '@/db/ownedMaps';

// Not a server area: bought, it unlocks every area.
export const COUNTRY_MAP: AreaId = 'france';

const MAP_PRODUCT_PREFIX = 'map_';

// Google and Apple product ids take no hyphen. Area ids are [a-z0-9-]+ (server slugify), so the swap is reversible.
export function mapProductId(areaId: AreaId): string {
  return MAP_PRODUCT_PREFIX + areaId.replaceAll('-', '_');
}

// Purchases live in the store (Google Play or the App Store keeps them on the phone), not in owned_maps.
export function purchasedMaps(productIds: readonly string[]): OwnedMap[] {
  return productIds
    .filter((id) => id.startsWith(MAP_PRODUCT_PREFIX))
    .map((id) => ({
      areaId: id.slice(MAP_PRODUCT_PREFIX.length).replaceAll('_', '-'),
      source: 'purchased' as const,
      unlockedAt: 0,
    }));
}
