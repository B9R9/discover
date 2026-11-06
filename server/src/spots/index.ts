import { connect } from '../db.ts';
import { approve, listPending, reject } from './review.ts';

// npm run spots -- list | approve <id> | reject <id>
const [command, id] = process.argv.slice(2);
const sql = connect(process.env.DATABASE_URL);

try {
  if (command === 'list') {
    for (const s of await listPending(sql)) {
      console.log(`${s.id}  ${s.pseudo}  ${s.genre}  ${s.name}  (${s.latitude}, ${s.longitude})`);
    }
  } else if (command === 'approve' && id) {
    console.log(await approve(sql, id));
  } else if (command === 'reject' && id) {
    console.log((await reject(sql, id)) ? 'ok' : 'unknown');
  } else {
    console.error('Usage: npm run spots -- list | approve <id> | reject <id>');
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
