import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NearbyPlace } from '@/features/places/nearbyPlaces';
import { categoryLabel, formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Stamp } from './Stamp';

interface PlaceRowProps {
  place: NearbyPlace;
  selected: boolean;
  onPress: () => void;
}

export function PlaceRow({ place, selected, onPress }: PlaceRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      // Not color alone: the chosen row also gets a bar on its edge.
      style={[
        styles.row,
        { borderLeftColor: selected ? colors.stamp : 'transparent' },
        selected && { backgroundColor: colors.paper },
      ]}
    >
      <View
        style={[styles.thumb, { backgroundColor: place.discovered ? colors.sage : colors.fog }]}
      >
        {!place.discovered && <Text style={[styles.question, { color: colors.muted }]}>?</Text>}
      </View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {place.discovered ? place.name : t('places.unknown')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {categoryLabel(place.category)} · {formatDistance(place.distance)}
        </Text>
      </View>
      {place.discovered && <Stamp label={t('places.discovered')} tilt={-6} />}
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
    borderLeftWidth: 3,
    borderRadius: radius.card,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: { fontFamily: fonts.hand, fontSize: 24, lineHeight: 28 },
  texts: { flex: 1 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
