import type { DetourEvent } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchEvents } from './outingsApi';

// The coming outings, read again each time the tab comes into view.
export function useOutings(): DetourEvent[] {
  const [events, setEvents] = useState<DetourEvent[]>([]);
  const reload = useCallback(() => {
    fetchEvents()
      .then((result) => {
        if (result.ok) setEvents(result.value);
      })
      .catch(console.warn);
  }, []);
  useFocusEffect(reload);
  return events;
}
