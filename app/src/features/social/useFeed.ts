import type { SharedPost } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchFeed } from './postsApi';

// The posts of the user and their friends; read again each time the tab comes into view.
export function useFeed(signedIn: boolean): [SharedPost[], () => void] {
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const reload = useCallback(() => {
    if (!signedIn) return;
    fetchFeed()
      .then((result) => {
        if (result.ok) setPosts(result.value);
      })
      .catch(console.warn);
  }, [signedIn]);

  useFocusEffect(reload);

  return [posts, reload];
}
