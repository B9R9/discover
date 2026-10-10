import type { PlaceId } from '@discover/shared';
import { File } from 'expo-file-system';

import { deletePersonalPlace } from '@/db/personalPlaces';
import type { Db } from '@/db/types';

// The database first: a leftover file is harmless, a row pointing to a missing photo is not.
export async function removePersonalPlace(db: Db, id: PlaceId): Promise<void> {
  const uri = await deletePersonalPlace(db, id);
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
