import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listDiscoveriesWithPhotos, type DiscoveryWithPhoto } from '@/db/discoveries';
import type { Db } from '@/db/types';

// Read again each time the screen comes into view: the camera tab may have added one.
export function useDiscoveryGallery(db: Db): DiscoveryWithPhoto[] {
  const [discoveries, setDiscoveries] = useState<DiscoveryWithPhoto[]>([]);

  useFocusEffect(
    useCallback(() => {
      listDiscoveriesWithPhotos(db).then(setDiscoveries).catch(console.warn);
    }, [db]),
  );

  return discoveries;
}
