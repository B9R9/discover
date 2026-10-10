/// <reference types="node" />
// Test-only: node:sqlite wrapped in the Db interface, so queries run in Jest without native code.
import { DatabaseSync } from 'node:sqlite';

import type { Db } from './types';

export function openTestDb(): Db {
  const db = new DatabaseSync(':memory:');
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    runAsync: async (sql, params) => {
      const result = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    getFirstAsync: async <T>(sql: string, params: (string | number | null)[]) =>
      (db.prepare(sql).get(...params) ?? null) as T | null,
    getAllAsync: async <T>(sql: string, params: (string | number | null)[]) =>
      db.prepare(sql).all(...params) as T[],
  };
}
