import type { Area } from '@discover/shared';

import type { Db } from './types';

export async function replaceCachedAreas(db: Db, areas: Area[], updatedAt: number): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    await db.runAsync('DELETE FROM areas_cache', []);
    for (const area of areas) {
      await db.runAsync(
        'INSERT INTO areas_cache (id, name, department_id, boundary, updated_at) VALUES (?, ?, ?, ?, ?)',
        [area.id, area.name, area.departmentId, JSON.stringify(area.boundary), updatedAt],
      );
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

export async function listCachedAreas(db: Db): Promise<Area[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    departmentId: string | null;
    boundary: string;
  }>('SELECT id, name, department_id AS departmentId, boundary FROM areas_cache ORDER BY name', []);
  // Written by replaceCachedAreas from validated server data.
  return rows.map((row) => ({ ...row, boundary: JSON.parse(row.boundary) as Area['boundary'] }));
}
