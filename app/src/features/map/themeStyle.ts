import type { ThemeColors } from '@/theme/tokens';

interface StyleLayer {
  id: string;
  type: string;
  'source-layer'?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export interface StyleJson {
  version: number;
  sources: Record<string, unknown>;
  layers: StyleLayer[];
  [key: string]: unknown;
}

export function isStyleJson(value: unknown): value is StyleJson {
  if (typeof value !== 'object' || value === null) return false;
  const style = value as Record<string, unknown>;
  return (
    typeof style.version === 'number' &&
    typeof style.sources === 'object' &&
    style.sources !== null &&
    Array.isArray(style.layers)
  );
}

const HIDDEN = { visibility: 'none' } as const;

// Layers of the OpenMapTiles schema that only add noise to a paper map.
const NOISY_SOURCE_LAYERS = new Set(['poi', 'housenumber', 'mountain_peak']);

function colorFill(layer: StyleLayer, c: ThemeColors): Record<string, unknown> {
  switch (layer['source-layer']) {
    case 'water':
      return { 'fill-color': c.postal, 'fill-opacity': 0.55 };
    case 'park':
    case 'landcover':
      return { 'fill-color': c.sage, 'fill-opacity': 0.45 };
    case 'building':
      return { 'fill-color': c.lantern, 'fill-opacity': 0.5 };
    case 'landuse':
      return { 'fill-color': c.paperLight, 'fill-opacity': 0.6 };
    default:
      return { 'fill-color': c.paperLight, 'fill-opacity': 0.6 };
  }
}

function colorLine(layer: StyleLayer, c: ThemeColors): Record<string, unknown> | null {
  switch (layer['source-layer']) {
    case 'waterway':
      return { 'line-color': c.postal, 'line-opacity': 0.6 };
    case 'boundary':
      return { 'line-color': c.ink, 'line-opacity': 0.3 };
    case 'transportation':
      // Casings would double every road: roads are drawn as printed ink lines instead.
      return layer.id.includes('casing') ? null : { 'line-color': c.ink, 'line-opacity': 0.35 };
    default:
      return { 'line-color': c.kraft };
  }
}

// Returns a copy of a Liberty style with the colors of the charter. `c` is the palette of the map
// (the dark one for "sombre"), not necessarily the one of the phone.
export function themeStyle(style: StyleJson, c: ThemeColors): StyleJson {
  const layers = style.layers.map((layer): StyleLayer => {
    const hide = { ...layer, layout: { ...layer.layout, ...HIDDEN } };
    if (layer['source-layer'] && NOISY_SOURCE_LAYERS.has(layer['source-layer'])) return hide;

    switch (layer.type) {
      case 'background':
        return { ...layer, paint: { 'background-color': c.paper } };
      case 'fill':
        return { ...layer, paint: colorFill(layer, c) };
      case 'fill-extrusion':
        return {
          ...layer,
          paint: { 'fill-extrusion-color': c.lantern, 'fill-extrusion-opacity': 0.5 },
        };
      case 'line': {
        const paint = colorLine(layer, c);
        if (!paint) return hide;
        // Keep the original width, dash and join: only the color changes.
        const { 'line-width': width, 'line-dasharray': dash } = layer.paint ?? {};
        return {
          ...layer,
          paint: {
            ...paint,
            ...(width === undefined ? {} : { 'line-width': width }),
            ...(dash === undefined ? {} : { 'line-dasharray': dash }),
          },
        };
      }
      case 'symbol':
        return {
          ...layer,
          paint: { 'text-color': c.ink, 'text-halo-color': c.paper, 'text-halo-width': 1.5 },
        };
      case 'hillshade':
      case 'raster':
      case 'heatmap':
        return hide;
      default:
        return layer;
    }
  });
  return { ...style, layers };
}
