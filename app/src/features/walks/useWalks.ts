import type { SharedWalk } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchWalks } from '@/features/social/walksApi';

// The walks made by Détour, and those of the user and their friends when signed in; read again when the tab comes into view.
export function useWalks(): [SharedWalk[], () => void] {
  const [walks, setWalks] = useState<SharedWalk[]>([]);
  const reload = useCallback(() => {
    fetchWalks()
      .then((result) => {
        if (result.ok) setWalks(result.value);
      })
      .catch(console.warn);
  }, []);

  useFocusEffect(reload);
  return [walks, reload];
}
