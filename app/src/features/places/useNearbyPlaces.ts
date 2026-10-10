import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { listPlacesWithDiscovery, type CachedPlace } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import { nearbyPlaces, type NearbyPlace } from './nearbyPlaces';

// Read again each time the map comes back into view: a photo may have discovered a place.
export function useNearbyPlaces(db: Db, position: GeoPoint | null): NearbyPlace[] {
  const [places, setPlaces] = useState<CachedPlace[]>([]);

  useFocusEffect(
    useCallback(() => {
      listPlacesWithDiscovery(db).then(setPlaces).catch(console.warn);
    }, [db]),
  );

  return useMemo(() => (position ? nearbyPlaces(places, position) : []), [places, position]);
}
