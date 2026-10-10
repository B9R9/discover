import { useFocusEffect } from 'expo-router';
import type { Area } from '@discover/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { listPlacesWithDiscovery, type CachedPlace } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import { nearbyPlaces, type NearbyPlace } from './nearbyPlaces';
import { syncPlaces } from './syncPlaces';

// Read again each time the map comes back into view: a photo may have discovered a place.
// lockedArea: the phone is in an area whose map the user does not own, so no places there.
export function useNearbyPlaces(
  db: Db,
  position: GeoPoint | null,
): { places: NearbyPlace[]; lockedArea: Area | null } {
  const [places, setPlaces] = useState<CachedPlace[]>([]);
  const [lockedArea, setLockedArea] = useState<Area | null>(null);
  const synced = useRef(false);

  const reload = useCallback(() => {
    listPlacesWithDiscovery(db).then(setPlaces).catch(console.warn);
  }, [db]);

  useFocusEffect(reload);

  // ponytail: one refresh per app launch, for the area of the first position; refresh on area change if users travel mid-session.
  useEffect(() => {
    if (!position || synced.current) return;
    synced.current = true;
    syncPlaces(db, position)
      .then((result) => {
        setLockedArea(result?.kind === 'locked' ? result.area : null);
        reload();
      })
      .catch(console.warn);
  }, [db, position, reload]);

  const nearby = useMemo(
    () => (position ? nearbyPlaces(places, position) : []),
    [places, position],
  );
  return { places: nearby, lockedArea };
}
