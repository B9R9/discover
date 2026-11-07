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
  placeName: string;
  comment: string;
  createdAt: string;
  mine: boolean;
  // Signed, expires after an hour.
  photoUrl: string;
}

// A dated outing (phase 8a), added by Détour: a market, a concert, a workshop. Open to everyone.
// `kind` is free text ("Brocante"), `area` the neighbourhood, `free` true when it costs nothing.
export interface DetourEvent {
  id: string;
  title: string;
  kind: string;
  theme: string;
  description: string;
  placeName: string;
  area: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string | null;
  free: boolean;
  priceNote: string;
}

// A place sent to chosen friends (phase 7e): the exact position goes with it, so the sender confirms first.
// `genre` is null for a private place. `to` is filled for the sender's own shares, `pseudo` is the sender.
export const MAX_SHARE_FRIENDS = 10;
export const MAX_SHARE_COMMENT = 280;
export interface SharedPlace {
  id: string;
  name: string;
  genre: SpotGenre | null;
  latitude: number;
  longitude: number;
  comment: string;
  pseudo: string;
  mine: boolean;
  to: string[];
  createdAt: string;
}

// Map shared with friends (phase 7c): the places discovered, as ids. No dates, no paths, no personal places.
export const MAX_SHARED_PLACES = 5000;

export interface SharedMap {
  pseudo: string;
  placeIds: string[];
  updatedAt: string;
}

// Kinds of public spot. Also their category key in the app (`category.<genre>`).
export const SPOT_GENRES = [
  'viewpoint',
  'nature',
  'shop',
  'food',
  'beach',
  'streetart',
  'heritage',
  'leisure',
] as const;
export type SpotGenre = (typeof SPOT_GENRES)[number];

export type SpotStatus = 'pending' | 'approved' | 'rejected';

// A walk drawn on the map and snapped to footpaths (phase 7d-2). `pseudo` is null for walks made by Détour.
export const MAX_WALK_POINTS = 2000;
export const MAX_WALK_METERS = 25_000;

export interface SharedWalk {
  id: string;
  name: string;
  pseudo: string | null;
  mine: boolean;
  // [longitude, latitude] pairs.
  path: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  createdAt: string;
}
