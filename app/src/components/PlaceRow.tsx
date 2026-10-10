import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NearbyPlace } from '@/features/places/nearbyPlaces';
import { categoryLabel, formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

interface PlaceRowProps {
  place: NearbyPlace;
  selected: boolean;
  onPress: () => void;
}

export function PlaceRow({ place, selected, onPress }: PlaceRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.selected]}
    >
      <View style={[styles.thumb, place.discovered && styles.thumbDiscovered]}>
        {!place.discovered && <Text style={styles.question}>?</Text>}
      </View>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {place.discovered ? place.name : t('places.unknown')}
        </Text>
        <Text style={styles.subtitle}>
          {categoryLabel(place.category)} · {formatDistance(place.distance)}
        </Text>
      </View>
      {place.discovered && <Text style={styles.badge}>{t('places.discovered')}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: palette.light.background },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.light.fog,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDiscovered: { backgroundColor: palette.light.discovered },
  question: { fontSize: 18, fontWeight: '600', color: palette.light.textMuted },
  texts: { flex: 1 },
  title: { fontSize: 16, lineHeight: 24, fontWeight: '500', color: palette.light.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
  badge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: palette.light.surface,
    backgroundColor: palette.light.discovered,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
});
