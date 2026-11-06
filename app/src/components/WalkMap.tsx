import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/features/map/mapStyle';
import { useMapStyle } from '@/features/map/useMapStyle';
import type { Stop } from '@/features/walks/snapWalk';
import { useSQLiteContext } from 'expo-sqlite';

import { MapLoading } from './MapLoading';
import { UserDot } from './UserDot';

interface WalkMapProps {
  // The walk, drawn as a line.
  path: readonly Stop[];
  // The points the user put down, drawn as dots (drawing only).
  stops?: readonly Stop[];
  onPress?: (point: Stop) => void;
  // Where to look when there is no walk yet (drawing).
  start?: Stop | null;
  // The user, shown as a dot. With `follow`, the camera stays on them.
  position?: Stop | null;
  follow?: boolean;
}

const EMPTY: GeoJSON.GeoJSON = { type: 'FeatureCollection', features: [] };

function bounds(points: readonly Stop[]): [number, number, number, number] | null {
  if (points.length === 0) return null;
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  return [
    Math.min(...lons) - 0.003,
    Math.min(...lats) - 0.003,
    Math.max(...lons) + 0.003,
    Math.max(...lats) + 0.003,
  ];
}

// A map with one walk on it. The camera first fits the walk, then the user moves it freely.
export function WalkMap({
  path,
  stops = [],
  onPress,
  start = null,
  position = null,
  follow = false,
}: WalkMapProps) {
  const db = useSQLiteContext();
  const [look] = useMapStyle(db);
  const camera = useRef<CameraRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [initial] = useState(() => bounds(path));

  useEffect(() => {
    if (follow && position) camera.current?.jumpTo({ center: position });
  }, [follow, position]);

  // Stopping the follow brings the whole walk back into view.
  const wasFollowing = useRef(false);
  useEffect(() => {
    if (wasFollowing.current && !follow && initial)
      camera.current?.fitBounds(initial, { duration: 600 });
    wasFollowing.current = follow;
  }, [follow, initial]);

  const line = useMemo<GeoJSON.GeoJSON>(
    () => (path.length > 1 ? { type: 'LineString', coordinates: path.map((p) => [...p]) } : EMPTY),
    [path],
  );
  const dots = useMemo<GeoJSON.GeoJSON>(
    () =>
      stops.length > 0 ? { type: 'MultiPoint', coordinates: stops.map((p) => [...p]) } : EMPTY,
    [stops],
  );

  return (
    <View style={styles.fill}>
      <Map
        style={styles.fill}
        mapStyle={look.mapStyle}
        logo={false}
        compass={false}
        onDidFinishLoadingMap={() => setLoaded(true)}
        onDidFailLoadingMap={() => setFailed(true)}
        onPress={(event) => onPress?.([event.nativeEvent.lngLat[0], event.nativeEvent.lngLat[1]])}
      >
        <Camera
          ref={camera}
          initialViewState={
            initial
              ? { bounds: initial }
              : start
                ? { center: start, zoom: 14 }
                : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
          }
        />
        <GeoJSONSource id="walk" data={line}>
          <Layer
            type="line"
            id="walk-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': look.colors.stamp, 'line-width': 5, 'line-dasharray': [0.1, 2] }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="walk-stops" data={dots}>
          <Layer
            type="circle"
            id="walk-stop"
            paint={{
              'circle-color': look.colors.paperLight,
              'circle-radius': 8,
              'circle-stroke-color': look.colors.stamp,
              'circle-stroke-width': 3,
            }}
          />
        </GeoJSONSource>
        {position && (
          <UserDot longitude={position[0]} latitude={position[1]} colors={look.colors} />
        )}
      </Map>
      {!loaded && <MapLoading failed={failed} />}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
