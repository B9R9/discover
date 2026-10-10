export interface CollectedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
}

const SAME_PLACE_METERS = 50;
const EARTH_RADIUS_METERS = 6_371_000;

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function distanceMeters(a: CollectedPlace, b: CollectedPlace): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// OSM often maps one place twice (a node and a building). Keeps the first one seen.
// ponytail: O(n²) per name group, fine for a city; index by grid cell if a source gets huge.
export function dedupePlaces(places: readonly CollectedPlace[]): CollectedPlace[] {
  const kept = new Map<string, CollectedPlace[]>();
  const result: CollectedPlace[] = [];
  for (const place of places) {
    const key = normalizeName(place.name);
    const sameName = kept.get(key) ?? [];
    if (sameName.some((other) => distanceMeters(place, other) < SAME_PLACE_METERS)) continue;
    sameName.push(place);
    kept.set(key, sameName);
    result.push(place);
  }
  return result;
}
