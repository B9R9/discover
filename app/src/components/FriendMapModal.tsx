import { Camera, Map } from '@maplibre/maplibre-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { boundsOf, friendFog } from '@/features/fog/friendFog';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/features/map/mapStyle';
import { useMapStyle } from '@/features/map/useMapStyle';
import { useFriendMap } from '@/features/social/useFriendMap';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { FogLayers } from './FogLayers';
import { MapLoading } from './MapLoading';

interface FriendMapModalProps {
  pseudo: string | null;
  onClose: () => void;
}

// A friend's map, read only: fog lifted around the places they shared that this phone knows.
export function FriendMapModal({ pseudo, onClose }: FriendMapModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [look] = useMapStyle(db);
  const friend = useFriendMap(db, pseudo);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const ready = friend.status === 'ready' ? friend : null;
  const fog = useMemo(() => (ready ? friendFog(ready.known) : null), [ready]);
  const bounds = useMemo(() => (ready ? boundsOf(ready.known) : null), [ready]);

  return (
    <Modal visible={pseudo !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {t('friendMap.title', { pseudo: pseudo ?? '' })}
          </Text>
          <Button label={t('friendMap.close')} variant="secondary" onPress={onClose} />
        </View>
        {friend.status === 'error' && <Text style={styles.message}>{t(friend.error)}</Text>}
        {friend.status === 'empty' && (
          <Text style={styles.message}>{t('friendMap.empty', { pseudo: pseudo ?? '' })}</Text>
        )}
        {ready && fog && (
          <>
            <Text style={styles.message}>
              {t('friendMap.count', { total: ready.total, known: ready.known.length })}
            </Text>
            <View style={styles.map}>
              <Map
                style={styles.map}
                mapStyle={look.mapStyle}
                logo={false}
                compass={false}
                onDidFinishLoadingMap={() => setMapLoaded(true)}
                onDidFailLoadingMap={() => setMapFailed(true)}
              >
                <Camera
                  initialViewState={
                    bounds ? { bounds } : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
                  }
                />
                <FogLayers {...fog} colors={look.colors} hatch={look.hatch} />
              </Map>
              {!mapLoaded && <MapLoading failed={mapFailed} />}
            </View>
          </>
        )}
        {friend.status === 'loading' && <MapLoading />}
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.paper },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28, color: c.ink, flexShrink: 1 },
    message: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    map: { flex: 1 },
  });
