import * as Location from 'expo-location';

import { colors } from '@/theme/tokens';
import { getSetting } from '@/db/settings';
import type { Db } from '@/db/types';
import { t } from '@/lib/i18n/t';

import { TRACKING_TASK } from './backgroundTask';
import { MIN_DISTANCE_METERS } from './recordLocations';

export const TRACKING_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  distanceInterval: MIN_DISTANCE_METERS,
};

// Starts or stops background recording to match the permission and the user's setting.
// Returns true when the background task records the path, false when the open app has to.
export async function syncBackgroundTracking(db: Db): Promise<boolean> {
  const permission = await Location.getBackgroundPermissionsAsync();
  const wanted = permission.granted && (await getSetting(db, 'backgroundTracking'));
  if (wanted) {
    // Always (re)start: the task can stay registered after its service died (crash, update),
    // and starting a registered task only refreshes it.
    await Location.startLocationUpdatesAsync(TRACKING_TASK, {
      ...TRACKING_OPTIONS,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: t('tracking.notificationTitle'),
        notificationBody: t('tracking.notificationBody'),
        notificationColor: colors.stamp,
      },
    });
  } else if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK)) {
    await Location.stopLocationUpdatesAsync(TRACKING_TASK);
  }
  return wanted;
}
