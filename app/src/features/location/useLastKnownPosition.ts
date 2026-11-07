import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { GeoPoint } from '@/db/types';

// The last position the system knows, then a fresh fix when it comes: the cache can be days old
// (still the old city after a trip). Read once when `active` turns on. Null without permission or fix.
export function useLastKnownPosition(active = true): GeoPoint | null {
  const [here, setHere] = useState<GeoPoint | null>(null);
  useEffect(() => {
    if (!active) return;
    let stale = false;
    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (position && !stale) setHere(position.coords);
      })
      .catch(console.warn);
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((position) => {
        stale = true;
        setHere(position.coords);
      })
      .catch(console.warn);
  }, [active]);
  return here;
}
