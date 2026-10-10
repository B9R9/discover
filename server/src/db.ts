import postgres from 'postgres';

export type Sql = postgres.Sql;

export function connect(url: string | undefined): Sql {
  if (!url) throw new Error('DATABASE_URL is missing (see server/.env.example)');
  return postgres(url, { onnotice: () => {} });
}
