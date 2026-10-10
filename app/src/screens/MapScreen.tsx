import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import type { PlaceId } from '@discover/shared';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FogLayers } from '@/components/FogLayers';
import { PlaceLayers } from '@/components/PlaceLayers';
import { PlacesPanel } from '@/components/PlacesPanel';
import { UserDot } from '@/components/UserDot';
import { useFog } from '@/features/fog/useFog';
import { useLocationTracking } from '@/features/location/useLocationTracking';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE_URL } from '@/features/map/mapStyle';
import { useHeading } from '@/features/places/useHeading';
import { useNearbyPlaces } from '@/features/places/useNearbyPlaces';
import { useWalkingRoute } from '@/features/places/useWalkingRoute';

export function MapScreen() {
  const db = useSQLiteContext();
  const [fog, refreshFog] = useFog(db);
  const location = useLocationTracking(db);
  const position = location?.coords ?? null;
  const { places, lockedArea } = useNearbyPlaces(db, position);
  const [selectedId, setSelectedId] = useState<PlaceId | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const selected = places.find((place) => place.id === selectedId) ?? null;
  const heading = useHeading(selected !== null && !selected.discovered);
  const route = useWalkingRoute(db, selected, position);
  const camera = useRef<CameraRef>(null);
  const hasFix = position !== null;
  const newest = fog.fresh.at(-1);

  // Back from the camera: show the new discovery now, not at the next timer tick.
  useFocusEffect(refreshFog);

  useEffect(() => {
    if (newest) camera.current?.jumpTo({ center: [newest.longitude, newest.latitude] });
  }, [newest]);

  useEffect(() => {
    if (!position) return;
    camera.current?.jumpTo({ center: [position.longitude, position.latitude] });
    // Center once on the first fix, then let the user move the map freely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFix]);

  return (
    <View style={styles.screen}>
      <Map
        style={styles.screen}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        compass={false}
        // The panel covers the bottom of the map: center the camera on the visible part.
        contentInset={{ bottom: panelHeight }}
      >
        <Camera ref={camera} initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }} />
        <FogLayers {...fog} />
        <PlaceLayers places={places} route={route} />
        {position && <UserDot {...position} />}
      </Map>
      <PlacesPanel
        places={places}
        hasPosition={hasFix}
        lockedAreaName={lockedArea?.name ?? null}
        selected={selected}
        onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
        heading={heading}
        route={route}
        onHeightChange={setPanelHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
