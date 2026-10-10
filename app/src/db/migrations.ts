import type { Db } from './types';

// Append only: never edit a migration that has shipped. Index + 1 is the schema version.
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uri TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL NOT NULL,
    taken_at INTEGER NOT NULL
  );
  CREATE TABLE discovered_places (
    place_id TEXT PRIMARY KEY,
    discovered_at INTEGER NOT NULL,
    path TEXT NOT NULL,
    photo_id INTEGER NOT NULL REFERENCES photos(id)
  );
  CREATE TABLE owned_maps (
    city_id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('free', 'purchased')),
    unlocked_at INTEGER NOT NULL
  );
  CREATE TABLE walked_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    recorded_at INTEGER NOT NULL
  );
  CREATE INDEX walked_paths_recorded_at ON walked_paths(recorded_at);
  CREATE TABLE places_cache (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    category TEXT,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX places_cache_city_id ON places_cache(city_id);
  `,
];

export async function migrate(db: Db, migrations: readonly string[] = MIGRATIONS): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;
  for (const [index, sql] of migrations.slice(current).entries()) {
    await db.execAsync('BEGIN');
    try {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${current + index + 1}`);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }
}
