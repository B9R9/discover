import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesStoreProduct } from 'react-native-purchases';

import type { MapStatus } from '@/features/maps/ownership';
import { useMaps } from '@/features/maps/useMaps';
import { buyMap, restoreMaps, type PurchaseOutcome } from '@/features/purchases/buyMap';
import { COUNTRY_MAP, mapProductId } from '@/features/purchases/mapProducts';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

const STATUS_LABEL: Record<MapStatus, TranslationKey> = {
  free: 'maps.free',
  purchased: 'maps.purchased',
  locked: 'maps.locked',
};

interface MapRowProps {
  name: string;
  status: MapStatus;
  indented?: boolean;
  product: PurchasesStoreProduct | undefined;
  onBuy: (product: PurchasesStoreProduct) => void;
}

function MapRow({ name, status, indented = false, product, onBuy }: MapRowProps) {
  return (
    <View style={[styles.row, indented && styles.city]}>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {status !== 'locked' && <Text style={styles.status}>{t(STATUS_LABEL[status])}</Text>}
      {status !== 'purchased' && product && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('maps.buyLabel', { map: name, price: product.priceString })}
          onPress={() => onBuy(product)}
          style={({ pressed }) => [styles.buy, pressed && styles.pressed]}
        >
          <Text style={styles.buyText}>{t('maps.buy', { price: product.priceString })}</Text>
        </Pressable>
      )}
      {status === 'locked' && !product && (
        <Text style={[styles.status, styles.locked]}>{t('maps.locked')}</Text>
      )}
    </View>
  );
}

// ponytail: plain list, fine for a few departments; FlatList with search once all of France is collected.
export function MapsSection() {
  const { maps, country, products } = useMaps(useSQLiteContext());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<TranslationKey | null>(null);

  async function run(action: () => Promise<PurchaseOutcome>) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setMessage(await action());
    setBusy(false);
  }

  const buy = (product: PurchasesStoreProduct) => run(() => buyMap(product));

  if (maps.length === 0) return <Text style={styles.hint}>{t('maps.empty')}</Text>;
  return (
    <View>
      <MapRow
        name={t('maps.country')}
        status={country}
        product={products[mapProductId(COUNTRY_MAP)]}
        onBuy={buy}
      />
      {maps.map(({ area, status }) => (
        <MapRow
          key={area.id}
          name={area.name}
          status={status}
          indented={area.departmentId !== null}
          product={products[mapProductId(area.id)]}
          onBuy={buy}
        />
      ))}
      {message && <Text style={styles.hint}>{t(message)}</Text>}
      <Pressable accessibilityRole="button" onPress={() => run(restoreMaps)} style={styles.restore}>
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
    minHeight: 48,
  },
  city: { paddingLeft: spacing.lg },
  name: { flex: 1, fontSize: 16, lineHeight: 24, color: palette.light.text },
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
