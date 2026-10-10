import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

import type { NearbyPlace } from '@/features/places/nearbyPlaces';
import type { RouteState } from '@/features/places/useWalkingRoute';
import { palette } from '@/theme/tokens';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

// Only discovered places get a marker: an undiscovered one never shows where it is.
function discoveredMarkers(places: NearbyPlace[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const place of places) {
    if (!place.discovered) continue;
    const { longitude, latitude } = place.position;
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function PlaceLayers({ places, route }: { places: NearbyPlace[]; route: RouteState }) {
  return (
    <>
      <GeoJSONSource id="route" data={route?.kind === 'route' ? route.route.line : EMPTY}>
        <Layer
          type="line"
          id="route-line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': palette.light.accent, 'line-width': 5 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="discovered-places" data={discoveredMarkers(places)}>
        <Layer
          type="circle"
          id="discovered-place"
          paint={{
            'circle-color': palette.light.discovered,
            'circle-radius': 9,
            'circle-stroke-color': palette.light.surface,
            'circle-stroke-width': 2,
          }}
        />
      </GeoJSONSource>
    </>
  );
}
