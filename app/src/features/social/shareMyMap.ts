import { listSharableIds } from '@/db/discoveries';
import type { Db } from '@/db/types';

import { shareMap, type SocialResult } from './mapsApi';

// Sends the ids of the discovered places to the friends; nothing else leaves the phone.
export async function shareMyMap(db: Db): Promise<SocialResult<true>> {
  return shareMap(await listSharableIds(db));
}
