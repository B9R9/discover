import { readFile } from 'node:fs/promises';

import { connect } from '../db.ts';
import { parseSeed, seedWalk } from './seed.ts';

// npm run walks -- seed <file.json> [more files]   (needs DATABASE_URL and ORS_KEY)
const [command, ...files] = process.argv.slice(2);

if (command !== 'seed' || files.length === 0) {
  console.error('Usage: npm run walks -- seed <file.json> [more files]');
  process.exit(1);
}
const orsKey = process.env.ORS_KEY;
if (!orsKey)
  throw new Error('ORS_KEY is missing (an OpenRouteService key, see server/.env.example)');
const sql = connect(process.env.DATABASE_URL);
try {
  for (const file of files) {
    const seed = parseSeed(JSON.parse(await readFile(file, 'utf8')));
    if (!seed)
      throw new Error(`${file}: expected { "name": "...", "waypoints": [[lon, lat], ...] }`);
    console.log(`${seed.name}: ${await seedWalk(sql, seed, orsKey)}`);
  }
} finally {
  await sql.end();
}
