import * as Location from 'expo-location';

import { setSetting } from '@/db/settings';
import type { Db } from '@/db/types';

export async function requestForegroundLocation(): Promise<boolean> {
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

export async function requestBackgroundLocation(): Promise<boolean> {
  return (await Location.requestBackgroundPermissionsAsync()).granted;
}

export function finishOnboarding(db: Db): Promise<void> {
  return setSetting(db, 'onboardingDone', true);
}
