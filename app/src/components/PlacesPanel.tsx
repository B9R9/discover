import type { PlaceId } from '@discover/shared';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { NearbyPlace } from '@/features/places/nearbyPlaces';
import type { RouteState } from '@/features/places/useWalkingRoute';
import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

import { DirectionArrow } from './DirectionArrow';
import { PlaceRow } from './PlaceRow';

interface PlacesPanelProps {
  places: NearbyPlace[];
  hasPosition: boolean;
  selected: NearbyPlace | null;
  onSelect: (id: PlaceId) => void;
  heading: number | null;
  route: RouteState;
  onHeightChange: (height: number) => void;
}

function routeText(route: RouteState): string | null {
  switch (route?.kind) {
    case 'loading':
      return t('places.routeLoading');
    case 'route':
      return `${formatWalkDuration(route.route.durationSeconds)} · ${formatDistance(route.route.distanceMeters)}`;
    case 'no-key':
      return t('places.routeNoKey');
    case 'failed':
    case 'not-discovered':
      return t('places.routeFailed');
    default:
      return null;
  }
}

export function PlacesPanel({
  places,
  hasPosition,
  selected,
  onSelect,
  heading,
  route,
  onHeightChange,
}: PlacesPanelProps) {
  return (
    <View
      style={styles.panel}
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
    >
      <View style={styles.handle} />
      <Text accessibilityRole="header" style={styles.title}>
        {t('places.title')}
      </Text>
      {selected && !selected.discovered && (
        <View style={styles.detail}>
          {/* Without a compass, the arrow points as on a north-up map. */}
          <DirectionArrow
            rotation={selected.bearing - (heading ?? 0)}
            distance={selected.distance}
          />
          <Text style={styles.hint}>{t('places.hint')}</Text>
        </View>
      )}
      {selected?.discovered && (
        <Text style={[styles.detail, styles.route]}>{routeText(route)}</Text>
      )}
      {!hasPosition && <Text style={styles.hint}>{t('places.waitingPosition')}</Text>}
      {hasPosition && places.length === 0 && <Text style={styles.hint}>{t('places.empty')}</Text>}
      <ScrollView style={styles.list}>
        {places.map((place) => (
          <PlaceRow
            key={place.id}
            place={place}
            selected={place.id === selected?.id}
            onPress={() => onSelect(place.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.light.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    shadowColor: palette.light.text,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.light.border,
    marginVertical: spacing.sm,
  },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: palette.light.text },
  detail: { marginTop: spacing.md, gap: spacing.sm },
  route: { fontSize: 16, lineHeight: 24, fontWeight: '500', color: palette.light.text },
  hint: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted, marginTop: spacing.sm },
  list: { maxHeight: 220, marginTop: spacing.sm },
});
