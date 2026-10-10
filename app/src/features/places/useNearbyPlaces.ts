import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { listPlacesWithDiscovery, type CachedPlace } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import { nearbyPlaces, type NearbyPlace } from './nearbyPlaces';
import { syncPlaces } from './syncPlaces';

// Read again each time the map comes back into view: a photo may have discovered a place.
export function useNearbyPlaces(db: Db, position: GeoPoint | null): NearbyPlace[] {
  const [places, setPlaces] = useState<CachedPlace[]>([]);
  const synced = useRef(false);

  const reload = useCallback(() => {
    listPlacesWithDiscovery(db).then(setPlaces).catch(console.warn);
  }, [db]);

  useFocusEffect(reload);

  // ponytail: one refresh per app launch, for the city of the first position; refresh on city change if users travel mid-session.
  useEffect(() => {
    if (!position || synced.current) return;
    synced.current = true;
    syncPlaces(db, position).then(reload).catch(console.warn);
  }, [db, position, reload]);

  return useMemo(() => (position ? nearbyPlaces(places, position) : []), [places, position]);
}
