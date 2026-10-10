import { useEffect, useState } from 'react';

import { listDiscoveredPositions } from '@/db/discoveries';
import type { Db } from '@/db/types';
import { listPathPoints, type PathPoint } from '@/db/walkedPaths';

import { placeShapes, walkLines, walkShapes } from './fogArea';
import { FogGrid } from './fogGrid';
import type { Position } from './shapes';

// The background task writes to SQLite from outside React, so the map reads new rows on a timer.
const REFRESH_MS = 5000;

export interface FogData {
  fog: GeoJSON.MultiPolygon;
  edges: GeoJSON.MultiLineString;
  walked: GeoJSON.MultiLineString;
}

const EMPTY: FogData = {
  fog: new FogGrid().fog(),
  edges: { type: 'MultiLineString', coordinates: [] },
  walked: { type: 'MultiLineString', coordinates: [] },
};

export function useFog(db: Db): FogData {
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    const grid = new FogGrid();
    const lines: Position[][] = [];
    let lastPoint: PathPoint | undefined;
    let nextDiscoveryAt = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // ponytail: the first refresh rebuilds everything from SQLite; cache the tiles in SQLite if startup gets slow.
    async function refresh() {
      const places = await listDiscoveredPositions(db, nextDiscoveryAt);
      const points = await listPathPoints(db, lastPoint ? lastPoint.recordedAt + 1 : 0);
      if (stopped || (places.length === 0 && points.length === 0)) return;
      // Starting from the last known point links the new rows to the walk already drawn.
      const walk = lastPoint && points.length > 0 ? [lastPoint, ...points] : points;
      grid.add([...placeShapes(places), ...walkShapes(walk)]);
      lines.push(...walkLines(walk));
      lastPoint = points.at(-1) ?? lastPoint;
      const lastPlace = places.at(-1);
      if (lastPlace) nextDiscoveryAt = lastPlace.discoveredAt + 1;
      setData({
        fog: grid.fog(),
        edges: grid.edges(),
        walked: { type: 'MultiLineString', coordinates: [...lines] },
      });
    }

    // A timeout chain, not an interval: two refreshes must never read the same rows.
    function loop() {
      refresh()
        .catch((error: unknown) => console.warn('Fog refresh failed', error))
        .finally(() => {
          if (!stopped) timer = setTimeout(loop, REFRESH_MS);
        });
    }

    loop();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [db]);

  return data;
}
