import type { Stop } from './snapWalk';

export interface Dot {
  x: number;
  y: number;
}

// Up to `count` points of the walk, scaled into a square of `size` pixels with the walk's proportions kept.
export function thumbnailDots(
  path: readonly Stop[],
  size: number,
  count = 22,
  padding = 10,
): Dot[] {
  if (path.length === 0) return [];
  const lons = path.map(([lon]) => lon);
  const lats = path.map(([, lat]) => lat);
  const west = Math.min(...lons);
  const north = Math.max(...lats);
  // A degree of longitude is shorter than a degree of latitude away from the equator.
  const stretch = Math.cos((((north + Math.min(...lats)) / 2) * Math.PI) / 180);
  const width = (Math.max(...lons) - west) * stretch;
  const height = north - Math.min(...lats);
  const scale = (size - 2 * padding) / Math.max(width, height, 1e-9);
  const offsetX = (size - width * scale) / 2;
  const offsetY = (size - height * scale) / 2;
  const step = (path.length - 1) / Math.max(count - 1, 1);
  const picked =
    path.length <= count
      ? path
      : Array.from({ length: count }, (_, i) => path[Math.round(i * step)]!);
  return picked.map(([lon, lat]) => ({
    x: offsetX + (lon - west) * stretch * scale,
    y: offsetY + (north - lat) * scale,
  }));
}
