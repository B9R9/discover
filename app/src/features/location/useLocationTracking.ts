import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { Db } from '@/db/types';

import { TRACKING_TASK } from './backgroundTask';
import { recordLocations } from './recordLocations';
import { syncBackgroundTracking, TRACKING_OPTIONS } from './tracking';

async function recordUnlessBackgroundDoes(db: Db, location: Location.LocationObject) {
  if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK)) return;
  await recordLocations(db, [location]);
}

// Follows the user while the app is open. Records the path itself only when the background task does not.
export function useLocationTracking(db: Db): Location.LocationObject | null {
  const [position, setPosition] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let watching = false;
    let stopped = false;

    async function start() {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;
      await syncBackgroundTracking(db);
      if (watching || stopped) return;
      watching = true;
      subscription = await Location.watchPositionAsync(TRACKING_OPTIONS, (location) => {
        setPosition(location);
        recordUnlessBackgroundDoes(db, location).catch(console.warn);
      });
      if (stopped) subscription.remove();
    }

    start().catch(console.warn);
    // The user may change the permissions in the system settings, then come back.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') start().catch(console.warn);
    });
    return () => {
      stopped = true;
      subscription?.remove();
      appState.remove();
    };
  }, [db]);

  return position;
}
