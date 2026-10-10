import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

import type { GeoPoint } from '@/db/types';
import { palette } from '@/theme/tokens';

export function UserDot({ latitude, longitude }: GeoPoint) {
  return (
    <GeoJSONSource id="user" data={{ type: 'Point', coordinates: [longitude, latitude] }}>
      <Layer
        type="circle"
        id="user-halo"
        paint={{
          'circle-color': palette.light.accent,
          'circle-opacity': 0.25,
          'circle-radius': 16,
        }}
      />
      <Layer
        type="circle"
        id="user-dot"
        paint={{
          'circle-color': palette.light.accent,
          'circle-radius': 7,
          'circle-stroke-color': palette.light.surface,
          'circle-stroke-width': 2,
        }}
      />
    </GeoJSONSource>
  );
}
