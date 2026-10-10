import type { LngLat } from '@maplibre/maplibre-react-native';

// OpenFreeMap: OpenStreetMap tiles without an API key. Liberty is colorful, so what the fog reveals feels alive.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Development city, shown until the first GPS fix.
export const DEFAULT_CENTER: LngLat = [-1.1636, 44.3944];
export const DEFAULT_ZOOM = 15;
