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
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // Personal places live apart from places_cache, which the server data replaces.
  `
  CREATE TABLE personal_places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    -- public: a spot or a place open to anyone (viewpoint, nature, shop), may go to the community later.
    -- private: someone's home, may only ever be shared with chosen friends.
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
    created_at INTEGER NOT NULL,
    photo_id INTEGER NOT NULL REFERENCES photos(id)
  );
  CREATE INDEX personal_places_created_at ON personal_places(created_at);
  CREATE VIEW all_places AS
    SELECT id, city_id, name, latitude, longitude, category FROM places_cache
    UNION ALL
    SELECT id, 'personal', name, latitude, longitude,
      CASE visibility WHEN 'public' THEN 'spot' ELSE 'personal' END
    FROM personal_places;
  `,
  `
  ALTER TABLE personal_places ADD COLUMN genre TEXT;
  DROP VIEW all_places;
  CREATE VIEW all_places AS
    SELECT id, city_id, name, latitude, longitude, category FROM places_cache
    UNION ALL
    SELECT id, 'personal', name, latitude, longitude,
      CASE visibility WHEN 'public' THEN COALESCE(genre, 'spot') ELSE 'personal' END
    FROM personal_places;
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
