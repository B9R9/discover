import { migrate, MIGRATIONS } from './migrations';
import { openTestDb } from './testDb';

async function version(db: ReturnType<typeof openTestDb>): Promise<number | undefined> {
  return (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []))
    ?.user_version;
}

test('migrates an empty database to the latest version', async () => {
  const db = openTestDb();
  await migrate(db);
  expect(await version(db)).toBe(MIGRATIONS.length);
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    [],
  );
  expect(tables.map((table) => table.name)).toEqual([
    'discovered_places',
    'owned_maps',
    'photos',
    'places_cache',
    'settings',
    'walked_paths',
  ]);
});

test('upgrades an existing database without losing data', async () => {
  const db = openTestDb();
  await migrate(db);
  await db.runAsync("INSERT INTO owned_maps VALUES ('biscarrosse', 'free', 1)", []);

  const next = [...MIGRATIONS, 'ALTER TABLE owned_maps ADD COLUMN note TEXT'];
  await migrate(db, next);
  await migrate(db, next);

  expect(await version(db)).toBe(next.length);
  expect(await db.getAllAsync('SELECT city_id, note FROM owned_maps', [])).toEqual([
    { city_id: 'biscarrosse', note: null },
  ]);
});

test('rolls back a failing migration', async () => {
  const db = openTestDb();
  await migrate(db);
  const broken = [...MIGRATIONS, 'CREATE TABLE half (id INTEGER); NOT SQL'];
  await expect(migrate(db, broken)).rejects.toThrow();
  expect(await version(db)).toBe(MIGRATIONS.length);
  expect(
    await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'half'", []),
  ).toBeNull();
});
