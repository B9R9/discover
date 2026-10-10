import { createServer } from 'node:http';

import { handleRequest } from './app.ts';
import { readPort } from './config.ts';

const port = readPort(process.env.PORT);

createServer(handleRequest).listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
