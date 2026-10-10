import type { PlaceId } from '@discover/shared';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiscoveryWithPhoto } from '@/db/discoveries';
import { formatDay } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

// ponytail: plain wrapped views, fine for a few hundred photos; switch to a FlatList grid beyond that.
interface DiscoveryGalleryProps {
  discoveries: DiscoveryWithPhoto[];
  onOpen: (placeId: PlaceId) => void;
}

export function DiscoveryGallery({ discoveries, onOpen }: DiscoveryGalleryProps) {
  if (discoveries.length === 0) {
    return <Text style={styles.empty}>{t('profile.noDiscoveries')}</Text>;
  }
  return (
    <View style={styles.grid}>
      {discoveries.map((discovery) => {
        const name = discovery.name ?? t('profile.unknownPlace');
        return (
          <Pressable
            key={discovery.placeId}
            style={styles.item}
            accessibilityRole="button"
            onPress={() => onOpen(discovery.placeId)}
          >
            <Image source={{ uri: discovery.photoUri }} style={styles.photo} resizeMode="cover" />
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.date}>{formatDay(discovery.discoveredAt)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  // Two columns: half the row minus half the gap.
  item: { width: '48%' },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.photo,
    backgroundColor: palette.light.fog,
  },
  name: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: palette.light.text,
    marginTop: spacing.xs,
  },
  date: { fontSize: 12, lineHeight: 16, color: palette.light.textMuted },
  empty: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
});
