import type { LngLat } from '@maplibre/maplibre-react-native';

export const MAP_STYLE_KINDS = ['carnet', 'classique', 'sombre'] as const;
export type MapStyleKind = (typeof MAP_STYLE_KINDS)[number];

// OpenFreeMap: OpenStreetMap tiles without an API key. Liberty is the base of every style: "classique"
// uses it as is, "carnet" and "sombre" are the same style with the colors rewritten (themeStyle.ts).
export const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Development city, shown until the first GPS fix.
export const DEFAULT_CENTER: LngLat = [-1.1636, 44.3944];
export const DEFAULT_ZOOM = 15;
