import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import type { GeoPoint } from '@/db/types';

const DURATION_MS = 600;

// Opacity of the fog that still covers newly discovered places: from `from` down to 0.
// Driven from JS: only a paint value changes each frame, the geometry stays the same.
export function useDissipation(fresh: readonly GeoPoint[], from: number): number {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState({ fresh, opacity: 0 });

  useEffect(() => {
    if (fresh.length === 0 || reducedMotion) return;
    const start = Date.now();
    let request = requestAnimationFrame(function step() {
      const progress = Math.min((Date.now() - start) / DURATION_MS, 1);
      // Ease out: the fog lifts fast, then settles.
      setFrame({ fresh, opacity: from * (1 - progress) ** 2 });
      if (progress < 1) request = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(request);
  }, [fresh, from, reducedMotion]);

  if (fresh.length === 0 || reducedMotion) return 0;
  // New places but no frame yet: start fully fogged, or the map flashes the area uncovered.
  return frame.fresh === fresh ? frame.opacity : from;
}
