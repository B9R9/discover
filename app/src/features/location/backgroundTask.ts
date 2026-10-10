import type { LocationObject } from 'expo-location';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';

import { DATABASE_NAME } from '@/db/database';

import { recordLocations } from './recordLocations';

export const TRACKING_TASK = 'walked-path-tracking';

// Must run at module load: Android can start the app headless, only to deliver locations to this task.
// No migration here: tracking starts after onboarding, so the app has already created walked_paths.
TaskManager.defineTask<{ locations: LocationObject[] }>(TRACKING_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const db = await openDatabaseAsync(DATABASE_NAME);
  try {
    await recordLocations(db, data.locations);
  } finally {
    await db.closeAsync();
  }
});
