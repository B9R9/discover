import type { PlaceId } from '@discover/shared';
import { useEffect, useRef, useState } from 'react';

import type { Db, GeoPoint } from '@/db/types';

import type { NearbyPlace } from './nearbyPlaces';
import { fetchWalkingRoute, type RouteResult } from './walkingRoute';

export type RouteState = RouteResult | { kind: 'loading' } | null;

// One request per selected place, from where the user stood when choosing it: keeps the OpenRouteService quota low.
export function useWalkingRoute(
  db: Db,
  selected: NearbyPlace | null,
  position: GeoPoint | null,
): RouteState {
  const [state, setState] = useState<{ id: PlaceId; route: RouteState } | null>(null);
  const positionRef = useRef(position);
  const discoveredId = selected?.discovered ? selected.id : null;
  const hasPosition = position !== null;

  // Declared first, so it runs before the fetch below in the same commit.
  useEffect(() => {
    positionRef.current = position;
  });

  useEffect(() => {
    const from = positionRef.current;
    if (!discoveredId || !from) return;
    let cancelled = false;
    setState({ id: discoveredId, route: { kind: 'loading' } });
    fetchWalkingRoute(db, from, discoveredId).then((route) => {
      if (!cancelled) setState({ id: discoveredId, route });
    });
    return () => {
      cancelled = true;
    };
  }, [db, discoveredId, hasPosition]);

  // Never hand a route to the screen unless the selected place is discovered.
  return discoveredId && state?.id === discoveredId ? state.route : null;
}
