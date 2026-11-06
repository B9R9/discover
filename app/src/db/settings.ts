import type { MapStyleKind } from '@/features/map/mapStyle';

import type { Db } from './types';

export interface Settings {
  onboardingDone: boolean;
  backgroundTracking: boolean;
  mapStyle: MapStyleKind;
}

type SettingKey = keyof Settings;

const DEFAULTS: Settings = {
  onboardingDone: false,
  backgroundTracking: true,
  mapStyle: 'carnet',
};

export async function getSetting<K extends SettingKey>(db: Db, key: K): Promise<Settings[K]> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  // We wrote this JSON ourselves in setSetting, so its shape is trusted.
  return row ? (JSON.parse(row.value) as Settings[K]) : DEFAULTS[key];
}

export async function setSetting<K extends SettingKey>(
  db: Db,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}
