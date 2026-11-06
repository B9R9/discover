import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// Covers the map while its style and tiles load, so the first seconds are not a blank screen.
export function MapLoading({ failed = false }: { failed?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.cover} pointerEvents="none" accessibilityLiveRegion="polite">
      {!failed && <ActivityIndicator color={colors.ink} />}
      <Text style={styles.text}>{t(failed ? 'map.loadFailed' : 'map.loading')}</Text>
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
