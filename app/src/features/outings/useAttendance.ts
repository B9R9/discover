import type { EventAttendance } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fetchAttendance } from './outingsApi';

// Who goes to which outing, by event id; empty when signed out. Read again when the tab comes into view.
export function useAttendance(signedIn: boolean): [Record<string, EventAttendance>, () => void] {
  const [byEvent, setByEvent] = useState<Record<string, EventAttendance>>({});
  const reload = useCallback(() => {
    if (!signedIn) return;
    fetchAttendance()
      .then((result) => {
        if (result.ok) setByEvent(Object.fromEntries(result.value.map((a) => [a.eventId, a])));
      })
      .catch(console.warn);
  }, [signedIn]);
  useFocusEffect(reload);
  return [byEvent, reload];
}
