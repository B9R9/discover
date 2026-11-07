import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { GeoPoint } from '@/db/types';

// The last position the system knows, read once when `active` turns on. Null without permission or fix.
export function useLastKnownPosition(active = true): GeoPoint | null {
  const [here, setHere] = useState<GeoPoint | null>(null);
  useEffect(() => {
    if (!active) return;
    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (position) setHere(position.coords);
      })
      .catch(console.warn);
  }, [active]);
  return here;
}
