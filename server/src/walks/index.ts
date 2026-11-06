import { readFile } from 'node:fs/promises';

import { connect } from '../db.ts';
import { parseSeed, seedWalk } from './seed.ts';

// npm run walks -- seed <file.json>   (needs DATABASE_URL and ORS_KEY)
const [command, file] = process.argv.slice(2);

if (command !== 'seed' || !file) {
  console.error('Usage: npm run walks -- seed <file.json>');
  process.exit(1);
}
const orsKey = process.env.ORS_KEY;
if (!orsKey)
  throw new Error('ORS_KEY is missing (an OpenRouteService key, see server/.env.example)');
const seed = parseSeed(JSON.parse(await readFile(file, 'utf8')));
if (!seed) throw new Error('The file must hold { "name": "...", "waypoints": [[lon, lat], ...] }');

const sql = connect(process.env.DATABASE_URL);
try {
  console.log(await seedWalk(sql, seed, orsKey));
} finally {
  await sql.end();
}
