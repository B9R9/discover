import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listCachedAreas } from '@/db/areasCache';
import { listOwnedMaps } from '@/db/ownedMaps';
import type { Db } from '@/db/types';

import { listMaps, type MapEntry } from './ownership';

// Read again on focus: the map tab may have claimed the free map meanwhile.
export function useMaps(db: Db): MapEntry[] {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  useFocusEffect(
    useCallback(() => {
      Promise.all([listCachedAreas(db), listOwnedMaps(db)])
        .then(([areas, owned]) => setMaps(listMaps(areas, owned)))
        .catch(console.warn);
    }, [db]),
  );
  return maps;
}
