import * as Location from 'expo-location';

import { setSetting } from '@/db/settings';
import type { Db } from '@/db/types';

import { syncBackgroundTracking } from './tracking';

// Returns whether background recording actually runs: turning it on may still be refused by the system.
export async function setBackgroundTracking(db: Db, enabled: boolean): Promise<boolean> {
  await setSetting(db, 'backgroundTracking', enabled);
  if (enabled && !(await Location.getBackgroundPermissionsAsync()).granted) {
    await Location.requestBackgroundPermissionsAsync();
  }
  return syncBackgroundTracking(db);
}
