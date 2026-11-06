import type { SharedWalk } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchWalks } from '@/features/social/walksApi';

// The walks made by Détour and those of the user and their friends; read again when the tab comes into view.
export function useWalks(signedIn: boolean): [SharedWalk[], () => void] {
  const [walks, setWalks] = useState<SharedWalk[]>([]);
  const reload = useCallback(() => {
    if (!signedIn) return;
    fetchWalks()
      .then((result) => {
        if (result.ok) setWalks(result.value);
      })
      .catch(console.warn);
  }, [signedIn]);

  useFocusEffect(reload);
  return [walks, reload];
}
