import type { MultiPolygon } from 'geojson';

export type PlaceId = string;
export type AreaId = string;

// Categories of server places. Same keys as the spot genres of the app, so one label each.
export const PLACE_CATEGORIES = [
  'culture',
  'heritage',
  'nature',
  'viewpoint',
  'beach',
  'leisure',
  'food',
  'shop',
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface Place {
  id: PlaceId;
  areaId: AreaId;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
}

// A map sold as one unit: a department, or a city of more than 100,000 people cut out of it.
export interface Area {
  id: AreaId;
  name: string;
  // null for a department; for a big city, the department it is cut out of.
  departmentId: AreaId | null;
  boundary: MultiPolygon;
}
