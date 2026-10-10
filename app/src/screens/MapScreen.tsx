import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { FogLayers } from '@/components/FogLayers';
import { UserDot } from '@/components/UserDot';
import { useFog } from '@/features/fog/useFog';
import { useLocationTracking } from '@/features/location/useLocationTracking';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE_URL } from '@/features/map/mapStyle';

export function MapScreen() {
  const db = useSQLiteContext();
  const fog = useFog(db);
  const position = useLocationTracking(db);
  const camera = useRef<CameraRef>(null);
  const hasFix = position !== null;

  useEffect(() => {
    if (!position) return;
    camera.current?.jumpTo({ center: [position.coords.longitude, position.coords.latitude] });
    // Center once on the first fix, then let the user move the map freely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFix]);

  return (
    <Map style={styles.map} mapStyle={MAP_STYLE_URL} logo={false} compass={false}>
      <Camera ref={camera} initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }} />
      <FogLayers {...fog} />
      {position && <UserDot {...position.coords} />}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
