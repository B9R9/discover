import { measure, parsePath, type WalkPath } from '../api/walkMetrics.ts';
import type { Sql } from '../db.ts';

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export interface WalkSeed {
  name: string;
  // [longitude, latitude] stops, snapped to footpaths in order.
  waypoints: [number, number][];
}

export function parseSeed(value: unknown): WalkSeed | null {
  if (typeof value !== 'object' || value === null) return null;
  const { name, waypoints } = value as Record<string, unknown>;
  const stops = parsePath(waypoints);
  return typeof name === 'string' && stops ? { name, waypoints: stops } : null;
}

export function lineOf(body: unknown): WalkPath | null {
  const features =
    typeof body === 'object' && body !== null ? (body as { features?: unknown }).features : null;
  const first: unknown = Array.isArray(features) ? features[0] : null;
  const geometry =
    typeof first === 'object' && first !== null ? (first as { geometry?: unknown }).geometry : null;
  const coordinates =
    typeof geometry === 'object' && geometry !== null
      ? (geometry as { coordinates?: unknown }).coordinates
      : null;
  return parsePath(
    Array.isArray(coordinates)
      ? coordinates.map((c: unknown) => (Array.isArray(c) ? c.slice(0, 2) : c))
      : null,
  );
}

// Snaps the stops to footpaths with OpenRouteService, then stores the walk as a Détour walk (no author).
export async function seedWalk(sql: Sql, seed: WalkSeed, orsKey: string): Promise<string> {
  const response = await fetch(ORS_URL, {
    method: 'POST',
    headers: { Authorization: orsKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: seed.waypoints }),
  });
  if (!response.ok) throw new Error(`OpenRouteService answered ${response.status}`);
  const path = lineOf(await response.json());
  const metrics = path && measure(path);
  if (!path || !metrics) throw new Error('The snapped walk is empty or longer than 25 km');
  const [row] = await sql<{ id: string }[]>`
    insert into walks (author, name, path, distance_m, duration_s)
    values (null, ${seed.name}, ${sql.json(path)}, ${metrics.distanceMeters}, ${metrics.durationSeconds})
    returning id`;
  return `${row?.id ?? '?'} ${metrics.distanceMeters} m`;
}
