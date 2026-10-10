import type { LocationObject } from 'expo-location';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';

import { DATABASE_NAME } from '@/db/database';

import { recordLocations } from './recordLocations';

export const TRACKING_TASK = 'walked-path-tracking';

// Opened once and never closed. expo-sqlite hands this task the connection SQLiteProvider already
// holds; when a JS handle to it is garbage-collected, the native side closes that shared connection
// and every later query of the app fails (NullPointerException). Keeping the handle alive avoids it.
let database: ReturnType<typeof openDatabaseAsync> | undefined;

// Must run at module load: Android can start the app headless, only to deliver locations to this task.
// No migration here: tracking starts after onboarding, so the app has already created walked_paths.
TaskManager.defineTask<{ locations: LocationObject[] }>(TRACKING_TASK, async ({ data, error }) => {
  if (error || !data) return;
  database ??= openDatabaseAsync(DATABASE_NAME).catch((openError: unknown) => {
    database = undefined;
    throw openError;
  });
  await recordLocations(await database, data.locations);
});
