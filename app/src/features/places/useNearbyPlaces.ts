import { useEffect, useMemo, useState } from 'react';

import { listPlacesWithDiscovery, type CachedPlace } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import { nearbyPlaces, type NearbyPlace } from './nearbyPlaces';

// ponytail: places are read once per mount; reload them when phase 4 adds discoveries.
export function useNearbyPlaces(db: Db, position: GeoPoint | null): NearbyPlace[] {
  const [places, setPlaces] = useState<CachedPlace[]>([]);

  useEffect(() => {
    listPlacesWithDiscovery(db).then(setPlaces).catch(console.warn);
  }, [db]);

  return useMemo(() => (position ? nearbyPlaces(places, position) : []), [places, position]);
}
