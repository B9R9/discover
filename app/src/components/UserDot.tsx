import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

import type { GeoPoint } from '@/db/types';
import type { ThemeColors } from '@/theme/tokens';

export function UserDot({ latitude, longitude, colors }: GeoPoint & { colors: ThemeColors }) {
  return (
    <GeoJSONSource id="user" data={{ type: 'Point', coordinates: [longitude, latitude] }}>
      <Layer
        type="circle"
        id="user-halo"
        paint={{
          'circle-color': colors.postal,
          'circle-opacity': 0.25,
          'circle-radius': 16,
        }}
      />
      <Layer
        type="circle"
        id="user-dot"
        paint={{
          'circle-color': colors.postal,
          'circle-radius': 7,
          'circle-stroke-color': colors.paperWhite,
          'circle-stroke-width': 2,
        }}
      />
    </GeoJSONSource>
  );
}
