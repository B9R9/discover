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

// Pseudos are lowercase so that "Léa" and "léa" cannot both exist and look alike.
export const PSEUDO_PATTERN = /^[a-z0-9_]{3,20}$/;

export function isValidPseudo(value: unknown): value is string {
  return typeof value === 'string' && PSEUDO_PATTERN.test(value);
}

// What a user sees of their circle: pseudos only, never an id or an e-mail.
export interface FriendList {
  friends: string[];
  // Asked to be your friend, waiting for your answer.
  incoming: string[];
  // You asked, waiting for their answer.
  outgoing: string[];
}

export const MAX_COMMENT_LENGTH = 280;
// A post reported by this many different people is hidden until someone looks at it.
export const HIDE_AFTER_REPORTS = 3;

// A photo and a comment a user chose to share about a place they discovered.
export interface SharedPost {
  id: string;
  pseudo: string;
  placeId: PlaceId;
  comment: string;
  createdAt: string;
  mine: boolean;
  // Signed, expires after an hour.
  photoUrl: string;
}
