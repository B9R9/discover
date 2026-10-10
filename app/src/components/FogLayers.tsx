import { GeoJSONSource, Layer, type LineLayerSpecification } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';

import type { GeoPoint } from '@/db/types';
import { placeShapes } from '@/features/fog/fogArea';
import { useDissipation } from '@/features/fog/useDissipation';
import type { FogData } from '@/features/fog/useFog';
import { palette } from '@/theme/tokens';

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

// MapLibre rejects a MultiLineString without lines ("Invalid geometry"): an empty collection is valid.
function lines(geometry: GeoJSON.MultiLineString): GeoJSON.GeoJSON {
  return geometry.coordinates.length > 0 ? geometry : { type: 'FeatureCollection', features: [] };
}

function discs(places: readonly GeoPoint[]): GeoJSON.GeoJSON {
  if (places.length === 0) return { type: 'FeatureCollection', features: [] };
  return { type: 'MultiPolygon', coordinates: placeShapes(places).map((ring) => [ring]) };
}

export function FogLayers({ fog, edges, walked, fresh }: FogData) {
  const dissipating = useDissipation(fresh, FOG_OPACITY);
  // Built once per discovery: only the opacity changes during the animation.
  const freshDiscs = useMemo(() => discs(fresh), [fresh]);
  return (
    <>
      <GeoJSONSource id="walked" data={lines(walked)}>
        <Layer
          type="line"
          id="walked-line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': palette.light.discovered, 'line-width': 4 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="fog" data={fog}>
        <Layer
          type="fill"
          id="fog-fill"
          paint={{
            'fill-color': palette.light.fog,
            'fill-opacity': FOG_OPACITY,
            // Tiles share edges: antialiasing would draw a faint seam between them.
            'fill-antialias': false,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="fog-edges" data={lines(edges)}>
        <Layer
          type="line"
          id="fog-edge"
          paint={{
            'line-color': palette.light.fog,
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
          paint={{ 'fill-color': palette.light.fog, 'fill-opacity': dissipating }}
        />
      </GeoJSONSource>
    </>
  );
}
