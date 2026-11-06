import type { PlaceId } from '@discover/shared';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { NearbyPlace } from '@/features/places/nearbyPlaces';
import type { RouteState } from '@/features/places/useWalkingRoute';
import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { DirectionArrow } from './DirectionArrow';
import { PlaceRow } from './PlaceRow';

// A department holds thousands of places: rendering them all mounted ~17,000 native views and froze the app
// for 30 s at launch. The list is sorted by distance, so the first ones are what "around you" means.
const LISTED_PLACES = 30;

interface PlacesPanelProps {
  places: NearbyPlace[];
  hasPosition: boolean;
  // Set when the phone is in an area whose map is not unlocked.
  lockedAreaName: string | null;
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
  lockedAreaName,
  selected,
  onSelect,
  heading,
  route,
  onHeightChange,
}: PlacesPanelProps) {
  const { colors } = useTheme();
  const hint = [styles.hint, { color: colors.muted }];
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.paperLight, borderColor: colors.ink, shadowColor: colors.ink },
      ]}
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
    >
      <View style={[styles.handle, { backgroundColor: colors.kraft }]} />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        {t('places.title')}
      </Text>
      {selected && !selected.discovered && (
        <View style={styles.detail}>
          {/* Without a compass, the arrow points as on a north-up map. */}
          <DirectionArrow
            rotation={selected.bearing - (heading ?? 0)}
            distance={selected.distance}
          />
          <Text style={[styles.note, { color: colors.ink }]}>{t('places.hint')}</Text>
        </View>
      )}
      {selected?.discovered && (
        <Text style={[styles.detail, styles.route, { color: colors.ink }]}>{routeText(route)}</Text>
      )}
      {!hasPosition && <Text style={hint}>{t('places.waitingPosition')}</Text>}
      {lockedAreaName && <Text style={hint}>{t('places.locked', { area: lockedAreaName })}</Text>}
      {hasPosition && !lockedAreaName && places.length === 0 && (
        <Text style={hint}>{t('places.empty')}</Text>
      )}
      <ScrollView style={styles.list}>
        {places.slice(0, LISTED_PLACES).map((place) => (
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
    borderTopWidth: 2,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 6,
  },
  handle: { alignSelf: 'center', width: 40, height: 3, marginVertical: spacing.sm },
  title: { fontFamily: fonts.title, fontSize: 24, lineHeight: 28 },
  detail: { marginTop: spacing.md, gap: spacing.sm },
  route: { fontFamily: fonts.stamp, fontSize: 16, lineHeight: 24 },
  // Handwritten remark: charter minimum is 20 px.
  note: { fontFamily: fonts.hand, fontSize: 22, lineHeight: 26 },
  hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  list: { maxHeight: 220, marginTop: spacing.sm },
});
