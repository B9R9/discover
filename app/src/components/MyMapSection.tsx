import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchMyMapStatus, stopSharingMap, type MapStatus } from '@/features/social/mapsApi';
import { shareMyMap } from '@/features/social/shareMyMap';
import type { SocialResult } from '@/features/social/apiClient';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

// The user decides when friends see their map: one snapshot, sent on request, removable.
export function MyMapSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [status, setStatus] = useState<MapStatus | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetchMyMapStatus()
      .then((result) => {
        if (result.ok) setStatus(result.value);
      })
      .catch(console.warn);
  }, []);
  useFocusEffect(reload);

  async function run(action: () => Promise<SocialResult<true>>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action().finally(() => setBusy(false));
    if (result.ok) reload();
    else setError(result.error);
  }

  return (
    <View style={styles.box}>
      <Text style={styles.section} accessibilityRole="header">
        {t('mymap.title')}
      </Text>
      <Text style={styles.hint}>{t('mymap.hint')}</Text>
      <Text style={styles.text}>
        {status ? t('mymap.on', { count: status.count }) : t('mymap.off')}
      </Text>
      <View style={styles.actions}>
        <Button
          label={t(status ? 'mymap.update' : 'mymap.share')}
          variant="primary"
          onPress={() => {
            run(() => shareMyMap(db)).catch(console.warn);
          }}
        />
        {status && (
          <Button
            label={t('mymap.stop')}
            variant="secondary"
            onPress={() => {
              run(stopSharingMap).catch(console.warn);
            }}
          />
        )}
      </View>
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(error)}
        </Text>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.sm },
    section: {
      fontFamily: fonts.title,
      fontSize: 18,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
    text: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
