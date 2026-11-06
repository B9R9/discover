import { colors, colorsDark } from '@/theme/tokens';

import { isStyleJson, themeStyle, type StyleJson } from './themeStyle';

const style: StyleJson = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://example.test/planet' } },
  glyphs: 'https://example.test/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#abc' } },
    { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#00f' } },
    { id: 'park', type: 'fill', 'source-layer': 'park', paint: { 'fill-color': '#0f0' } },
    { id: 'building', type: 'fill', 'source-layer': 'building', paint: { 'fill-color': '#999' } },
    {
      id: 'road_primary',
      type: 'line',
      'source-layer': 'transportation',
      paint: { 'line-color': '#fa0', 'line-width': 6, 'line-dasharray': [2, 1] },
    },
    { id: 'road_primary_casing', type: 'line', 'source-layer': 'transportation', paint: {} },
    { id: 'poi_r20', type: 'symbol', 'source-layer': 'poi', paint: { 'text-color': '#000' } },
    { id: 'label_city', type: 'symbol', 'source-layer': 'place', paint: { 'text-color': '#000' } },
    { id: 'hills', type: 'hillshade', paint: {} },
  ],
};

function layer(result: StyleJson, id: string) {
  const found = result.layers.find((l) => l.id === id);
  if (!found) throw new Error(`missing layer ${id}`);
  return found;
}

describe('themeStyle', () => {
  const light = themeStyle(style, colors);

  it('paints the background as paper and keeps sources and glyphs', () => {
    expect(layer(light, 'background').paint).toEqual({ 'background-color': colors.paper });
    expect(light.sources).toEqual(style.sources);
    expect(light.glyphs).toBe(style.glyphs);
  });

  it('colors water, parks and buildings with the charter', () => {
    expect(layer(light, 'water').paint?.['fill-color']).toBe(colors.postal);
    expect(layer(light, 'park').paint?.['fill-color']).toBe(colors.sage);
    expect(layer(light, 'building').paint?.['fill-color']).toBe(colors.lantern);
  });

  it('draws roads in ink, keeps their width and dash, and hides casings', () => {
    const road = layer(light, 'road_primary').paint;
    expect(road?.['line-color']).toBe(colors.ink);
    expect(road?.['line-width']).toBe(6);
    expect(road?.['line-dasharray']).toEqual([2, 1]);
    expect(layer(light, 'road_primary_casing').layout).toEqual({ visibility: 'none' });
  });

  it('hides points of interest and relief, keeps place names in ink', () => {
    expect(layer(light, 'poi_r20').layout).toEqual({ visibility: 'none' });
    expect(layer(light, 'hills').layout).toEqual({ visibility: 'none' });
    expect(layer(light, 'label_city').paint?.['text-color']).toBe(colors.ink);
  });

  it('uses the dark palette when given', () => {
    const dark = themeStyle(style, colorsDark);
    expect(layer(dark, 'background').paint).toEqual({ 'background-color': colorsDark.paper });
    expect(layer(dark, 'label_city').paint?.['text-color']).toBe(colorsDark.ink);
  });

  it('does not change the style it receives', () => {
    expect(layer(style, 'water').paint).toEqual({ 'fill-color': '#00f' });
  });
});

describe('isStyleJson', () => {
  it('accepts a style and rejects anything else', () => {
    expect(isStyleJson(style)).toBe(true);
    expect(isStyleJson({ version: 8 })).toBe(false);
    expect(isStyleJson(null)).toBe(false);
    expect(isStyleJson('<html>')).toBe(false);
  });
});
