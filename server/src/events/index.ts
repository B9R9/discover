import { readFile } from 'node:fs/promises';

import { connect } from '../db.ts';
import { parseEvents, seedEvent } from './seed.ts';

// npm run events -- seed <file.json> [more files]   (needs DATABASE_URL)
const [command, ...files] = process.argv.slice(2);

if (command !== 'seed' || files.length === 0) {
  console.error('Usage: npm run events -- seed <file.json> [more files]');
  process.exit(1);
}
const sql = connect(process.env.DATABASE_URL);
try {
  for (const file of files) {
    const events = parseEvents(JSON.parse(await readFile(file, 'utf8')));
    if (!events)
      throw new Error(`${file}: expected an array of events (see server/events/README.md)`);
    for (const event of events) await seedEvent(sql, event);
    console.log(`${file}: ${events.length} event(s)`);
  }
} finally {
  await sql.end();
}
