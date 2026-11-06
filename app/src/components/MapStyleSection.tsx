import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getSetting, setSetting } from '@/db/settings';
import { MAP_STYLE_KINDS, type MapStyleKind } from '@/features/map/mapStyle';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function MapStyleSection() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [current, setCurrent] = useState<MapStyleKind>('carnet');

  useEffect(() => {
    getSetting(db, 'mapStyle').then(setCurrent);
  }, [db]);

  async function choose(kind: MapStyleKind) {
    setCurrent(kind);
    await setSetting(db, 'mapStyle', kind);
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('profile.mapStyle')}>
      {MAP_STYLE_KINDS.map((kind) => {
        const checked = kind === current;
        return (
          <Pressable
            key={kind}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            onPress={() => choose(kind)}
            style={[
              styles.row,
              { borderColor: colors.ink },
              checked && { backgroundColor: colors.paperWhite },
            ]}
          >
            {/* Not color alone: the chosen one is also a filled ring. */}
            <View style={[styles.ring, { borderColor: colors.ink }]}>
              {checked && <View style={[styles.fill, { backgroundColor: colors.stamp }]} />}
            </View>
            <View style={styles.texts}>
              <Text style={[styles.label, { color: colors.ink }]}>
                {t(`profile.mapStyle.${kind}`)}
              </Text>
              <Text style={[styles.hint, { color: colors.muted }]}>
                {t(`profile.mapStyle.${kind}.hint`)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
    borderWidth: 2,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
  },
  ring: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { width: 10, height: 10, borderRadius: radius.round },
  texts: { flex: 1 },
  label: { fontFamily: fonts.stamp, fontSize: 15, lineHeight: 20 },
  hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
