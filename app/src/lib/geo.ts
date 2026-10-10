import type { GeoPoint } from '@/db/types';

const METERS_PER_DEGREE = 111_320;

// Flat projection around a point: exact enough at the scale of a city (error < 0.1 % over 10 km).
export function toMeters(origin: GeoPoint, point: GeoPoint): { x: number; y: number } {
  const cos = Math.cos((origin.latitude * Math.PI) / 180);
  return {
    x: (point.longitude - origin.longitude) * METERS_PER_DEGREE * cos,
    y: (point.latitude - origin.latitude) * METERS_PER_DEGREE,
  };
}

export function fromMeters(origin: GeoPoint, x: number, y: number): [number, number] {
  const cos = Math.cos((origin.latitude * Math.PI) / 180);
  return [
    origin.longitude + x / (METERS_PER_DEGREE * cos),
    origin.latitude + y / METERS_PER_DEGREE,
  ];
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const { x, y } = toMeters(a, b);
  return Math.hypot(x, y);
}
