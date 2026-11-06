import type { PlaceId } from '@discover/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiscoveryWithPhoto } from '@/db/discoveries';
import { formatDay } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Polaroid } from './Polaroid';

// Charter: polaroids tilt between -5 and +5 degrees. Fixed by position so the grid does not jump on reload.
const TILTS = [-3, 2, -1.5, 3.5, -2.5, 1];

// ponytail: plain wrapped views, fine for a few hundred photos; switch to a FlatList grid beyond that.
interface DiscoveryGalleryProps {
  discoveries: DiscoveryWithPhoto[];
  onOpen: (placeId: PlaceId) => void;
}

export function DiscoveryGallery({ discoveries, onOpen }: DiscoveryGalleryProps) {
  const { colors } = useTheme();
  if (discoveries.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.muted }]}>{t('profile.noDiscoveries')}</Text>
    );
  }
  return (
    <View style={styles.grid}>
      {discoveries.map((discovery, index) => {
        const name = discovery.name ?? t('profile.unknownPlace');
        return (
          <Pressable
            key={discovery.placeId}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${formatDay(discovery.discoveredAt)}`}
            onPress={() => onOpen(discovery.placeId)}
          >
            <Polaroid
              photoUri={discovery.photoUri}
              caption={name}
              tilt={TILTS[index % TILTS.length]}
              accessibilityLabel={name}
            />
            <Text style={[styles.date, { color: colors.muted }]}>
              {formatDay(discovery.discoveredAt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingTop: spacing.sm },
  // Two columns: half the row minus half the gap.
  item: { width: '47%' },
  date: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  empty: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
