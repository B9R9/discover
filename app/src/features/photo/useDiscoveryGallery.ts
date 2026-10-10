import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listDiscoveriesWithPhotos, type DiscoveryWithPhoto } from '@/db/discoveries';
import type { Db } from '@/db/types';

// Read again each time the screen comes into view: the camera tab may have added one.
// Also returns a reload, for changes made on this screen (edit, delete).
export function useDiscoveryGallery(db: Db): [DiscoveryWithPhoto[], () => void] {
  const [discoveries, setDiscoveries] = useState<DiscoveryWithPhoto[]>([]);
  const reload = useCallback(() => {
    listDiscoveriesWithPhotos(db).then(setDiscoveries).catch(console.warn);
  }, [db]);

  useFocusEffect(reload);

  return [discoveries, reload];
}
