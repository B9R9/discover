import type { MultiPolygon } from 'geojson';

export type PlaceId = string;
export type CityId = string;

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
  cityId: CityId;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
}

export interface City {
  id: CityId;
  name: string;
  boundary: MultiPolygon;
}
