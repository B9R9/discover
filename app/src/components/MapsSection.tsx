import { StyleSheet, Text, View } from 'react-native';

import type { MapEntry, MapStatus } from '@/features/maps/ownership';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { palette, spacing } from '@/theme/tokens';

const STATUS_LABEL: Record<MapStatus, TranslationKey> = {
  free: 'maps.free',
  purchased: 'maps.purchased',
  locked: 'maps.locked',
};

// ponytail: plain list, fine for a few departments; FlatList with search once all of France is collected.
export function MapsSection({ maps }: { maps: MapEntry[] }) {
  if (maps.length === 0) return <Text style={styles.hint}>{t('maps.empty')}</Text>;
  return (
    <View>
      {maps.map(({ area, status }) => (
        <View key={area.id} style={[styles.row, area.departmentId !== null && styles.city]}>
          <Text style={styles.name} numberOfLines={1}>
            {area.name}
          </Text>
          <Text style={[styles.status, status === 'locked' && styles.locked]}>
            {t(STATUS_LABEL[status])}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  city: { paddingLeft: spacing.lg },
  name: { flex: 1, fontSize: 16, lineHeight: 24, color: palette.light.text },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: palette.light.text },
  locked: { fontWeight: '400', color: palette.light.textMuted },
  hint: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
});
