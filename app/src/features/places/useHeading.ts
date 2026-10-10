import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

// Where the phone points, in degrees from north, or null before the compass answers.
export function useHeading(enabled: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let subscription: Location.LocationSubscription | undefined;
    let stopped = false;
    Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
      // trueHeading is -1 until the phone knows its position.
      setHeading(trueHeading >= 0 ? trueHeading : magHeading);
    })
      .then((started) => {
        subscription = started;
        if (stopped) started.remove();
      })
      .catch(console.warn);
    return () => {
      stopped = true;
      subscription?.remove();
    };
  }, [enabled]);

  return heading;
}
