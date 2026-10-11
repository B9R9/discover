import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describeMap } from '@/features/maps/mapDescription';
import type { MapStatus } from '@/features/maps/ownership';
import { useMaps } from '@/features/maps/useMaps';
import { COUNTRY_MAP, mapProductId } from '@/features/purchases/mapProducts';
import { useStore } from '@/features/purchases/StoreProvider';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

const STATUS_LABEL: Record<MapStatus, TranslationKey> = {
  free: 'maps.free',
  purchased: 'maps.purchased',
  locked: 'maps.locked',
};

interface MapRowProps {
  name: string;
  description: string;
  status: MapStatus;
  indented?: boolean;
  // Localized store price; undefined when the store has no product for this map.
  price: string | undefined;
  onBuy: () => void;
}

function MapRow({ name, description, status, indented = false, price, onBuy }: MapRowProps) {
  return (
    <View style={[styles.row, indented && styles.city]}>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {status !== 'locked' && <Text style={styles.status}>{t(STATUS_LABEL[status])}</Text>}
      {status !== 'purchased' && price && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('maps.buyLabel', { map: name, price })}
          onPress={onBuy}
          style={({ pressed }) => [styles.buy, pressed && styles.pressed]}
        >
          <Text style={styles.buyText}>{t('maps.buy', { price })}</Text>
        </Pressable>
      )}
      {status === 'locked' && !price && (
        <Text style={[styles.status, styles.locked]}>{t('maps.locked')}</Text>
      )}
    </View>
  );
}

// ponytail: plain list, fine for a few departments; FlatList with search once all of France is collected.
export function MapsSection() {
  const { maps, country, prices } = useMaps(useSQLiteContext());
  const { message, buy, restore } = useStore();
  const countryProduct = mapProductId(COUNTRY_MAP);

  if (maps.length === 0) return <Text style={styles.hint}>{t('maps.empty')}</Text>;
  return (
    <View>
      <MapRow
        name={t('maps.country')}
        description={t('maps.describe.country')}
        status={country}
        price={prices[countryProduct]}
        onBuy={() => buy(countryProduct)}
      />
      {maps.map((entry) => {
        const { area, status } = entry;
        const { key, params } = describeMap(entry, maps);
        const productId = mapProductId(area.id);
        return (
          <MapRow
            key={area.id}
            name={area.name}
            description={t(key, params)}
            status={status}
            indented={area.departmentId !== null}
            price={prices[productId]}
            onBuy={() => buy(productId)}
          />
        );
      })}
      {message && <Text style={styles.hint}>{t(message)}</Text>}
      <Pressable accessibilityRole="button" onPress={restore} style={styles.restore}>
        <Text style={styles.restoreText}>{t('maps.restore')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  texts: { flex: 1 },
  city: { paddingLeft: spacing.lg },
  name: { fontSize: 16, lineHeight: 24, color: palette.light.text },
  description: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
  status: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: palette.light.text },
  locked: { fontWeight: '400', color: palette.light.textMuted },
  buy: {
    borderWidth: 1,
    borderColor: palette.light.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  buyText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: palette.light.text },
  hint: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted, marginTop: spacing.sm },
  restore: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  restoreText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.light.text,
    textDecorationLine: 'underline',
  },
});
