import type { SharedPlace } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchSharedPlaces } from './placeSharesApi';

// The places sent and received, reloaded each time the screen comes into view.
export function useSharedPlaces(signedIn: boolean): [SharedPlace[], () => void] {
  const [places, setPlaces] = useState<SharedPlace[]>([]);
  const reload = useCallback(() => {
    if (!signedIn) return;
    fetchSharedPlaces()
      .then((result) => {
        if (result.ok) setPlaces(result.value);
      })
      .catch(console.warn);
  }, [signedIn]);
  useFocusEffect(reload);
  return [places, reload];
}
