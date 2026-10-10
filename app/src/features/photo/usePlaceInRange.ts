import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { listPlacesWithDiscovery } from '@/db/placesCache';
import type { Db } from '@/db/types';
import { distanceMeters } from '@/lib/geo';

import { MAX_DISTANCE_METERS } from './validatePhoto';

export type Range = 'near' | 'far';

// Live hint on the camera screen. The photo itself is checked again with a fresh position.
export function usePlaceInRange(db: Db, active: boolean): Range | null {
  const [range, setRange] = useState<Range | null>(null);

  useEffect(() => {
    if (!active) return;
    let subscription: Location.LocationSubscription | undefined;
    let stopped = false;

    async function start() {
      const places = (await listPlacesWithDiscovery(db)).filter((place) => !place.discovered);
      const started = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        ({ coords }) => {
          const near = places.some((place) => distanceMeters(coords, place) <= MAX_DISTANCE_METERS);
          setRange(near ? 'near' : 'far');
        },
      );
      if (stopped) started.remove();
      else subscription = started;
    }

    start().catch(console.warn);
    return () => {
      stopped = true;
      subscription?.remove();
    };
  }, [db, active]);

  return active ? range : null;
}
