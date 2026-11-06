import type { FriendList } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { TranslationKey } from '@/lib/i18n/t';

import { fetchFriends, fetchPseudo } from './socialApi';

export interface Circle {
  loading: boolean;
  error: TranslationKey | null;
  // null until the user picks one.
  pseudo: string | null;
  list: FriendList;
}

const EMPTY: FriendList = { friends: [], incoming: [], outgoing: [] };

// Loads the profile and the friends of the signed-in user each time the screen comes into view
// (the user may have signed in on the Profile tab); `signedIn` false leaves everything empty.
export function useCircle(signedIn: boolean): [Circle, () => void] {
  const [circle, setCircle] = useState<Circle>({
    loading: signedIn,
    error: null,
    pseudo: null,
    list: EMPTY,
  });

  const reload = useCallback(() => {
    if (!signedIn) return;
    Promise.all([fetchPseudo(), fetchFriends()])
      .then(([pseudo, list]) =>
        setCircle({
          loading: false,
          error: !pseudo.ok ? pseudo.error : !list.ok ? list.error : null,
          pseudo: pseudo.ok ? pseudo.value : null,
          list: list.ok ? list.value : EMPTY,
        }),
      )
      .catch(console.warn);
  }, [signedIn]);

  useFocusEffect(reload);

  return [circle, reload];
}
