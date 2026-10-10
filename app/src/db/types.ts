export type SqlValue = string | number | null;

// Subset of expo-sqlite's SQLiteDatabase, so tests can run against node:sqlite.
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}
