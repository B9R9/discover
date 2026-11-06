import {
  GeoJSONSource,
  Images,
  Layer,
  type LineLayerSpecification,
} from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';

import type { GeoPoint } from '@/db/types';
import { placeShapes } from '@/features/fog/fogArea';
import { useDissipation } from '@/features/fog/useDissipation';
import type { FogData } from '@/features/fog/useFog';
import type { ThemeColors } from '@/theme/tokens';

type LinePaint = NonNullable<LineLayerSpecification['paint']>;

// About 20 m on the ground at any zoom (Web Mercator halves the meters per pixel at each zoom level).
const SOFT_EDGE_WIDTH: LinePaint['line-width'] = [
  'interpolate',
  ['exponential', 2],
  ['zoom'],
  10,
  0.2,
  20,
  190,
];

const FOG_OPACITY = 0.9;

// Ink hatching at about 35 degrees, every 9 px (charter). Drawn on top of the fog color, so the fog stays "unwritten paper".
const HATCH_IMAGES = {
  'fog-hatch': require('../../assets/images/fog-hatch.png') as number,
  'fog-hatch-light': require('../../assets/images/fog-hatch-light.png') as number,
};

// MapLibre rejects a MultiLineString without lines ("Invalid geometry"): an empty collection is valid.
function lines(geometry: GeoJSON.MultiLineString): GeoJSON.GeoJSON {
  return geometry.coordinates.length > 0 ? geometry : { type: 'FeatureCollection', features: [] };
}

function discs(places: readonly GeoPoint[]): GeoJSON.GeoJSON {
  if (places.length === 0) return { type: 'FeatureCollection', features: [] };
  return { type: 'MultiPolygon', coordinates: placeShapes(places).map((ring) => [ring]) };
}

interface FogLayersProps extends FogData {
  colors: ThemeColors;
  hatch: keyof typeof HATCH_IMAGES;
}

export function FogLayers({ fog, edges, walked, fresh, colors, hatch }: FogLayersProps) {
  const dissipating = useDissipation(fresh, FOG_OPACITY);
  // Built once per discovery: only the opacity changes during the animation.
  const freshDiscs = useMemo(() => discs(fresh), [fresh]);
  return (
    <>
      <Images images={HATCH_IMAGES} />
      <GeoJSONSource id="walked" data={lines(walked)}>
        <Layer
          type="line"
          id="walked-line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': colors.sage, 'line-width': 4 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="fog" data={fog}>
        <Layer
          type="fill"
          id="fog-fill"
          paint={{
            'fill-color': colors.fog,
            'fill-opacity': FOG_OPACITY,
            // Tiles share edges: antialiasing would draw a faint seam between them.
            'fill-antialias': false,
          }}
        />
        <Layer
          type="fill"
          id="fog-hatch"
          paint={{
            'fill-pattern': hatch,
            'fill-opacity': FOG_OPACITY,
            'fill-antialias': false,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="fog-edges" data={lines(edges)}>
        <Layer
          type="line"
          id="fog-edge"
          paint={{
            'line-color': colors.fog,
            'line-opacity': FOG_OPACITY,
            'line-width': SOFT_EDGE_WIDTH,
            'line-blur': SOFT_EDGE_WIDTH,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="fog-dissipating" data={freshDiscs}>
        <Layer
          type="fill"
          id="fog-dissipating-fill"
          paint={{ 'fill-color': colors.fog, 'fill-opacity': dissipating }}
        />
      </GeoJSONSource>
    </>
  );
}
