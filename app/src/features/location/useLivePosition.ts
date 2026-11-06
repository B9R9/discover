import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { TRACKING_OPTIONS } from './tracking';

// The position while `enabled`, for a screen that only shows it. Unlike useLocationTracking it records nothing:
// the map screen already does, and two writers would store every point twice.
export function useLivePosition(enabled: boolean): Location.LocationObject | null {
  const [position, setPosition] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let subscription: Location.LocationSubscription | undefined;
    let stopped = false;
    async function start() {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;
      const watcher = await Location.watchPositionAsync(TRACKING_OPTIONS, setPosition);
      if (stopped) watcher.remove();
      else subscription = watcher;
    }
    start().catch(console.warn);
    return () => {
      stopped = true;
      subscription?.remove();
    };
  }, [enabled]);

  return enabled ? position : null;
}
