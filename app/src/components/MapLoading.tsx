import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { LoadingScene } from './LoadingScene';

// Covers the map while its style and tiles load, so the first seconds are not a blank screen.
export function MapLoading({ failed = false }: { failed?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!failed) return <LoadingScene />;
  return (
    <View style={styles.cover} pointerEvents="none" accessibilityLiveRegion="polite">
      <Text style={styles.text}>{t('map.loadFailed')}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    cover: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: c.paper,
    },
    text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
  });
