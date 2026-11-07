import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GeoPoint } from '@/db/types';
import { cardinalKey } from '@/lib/cardinal';
import { bearingDegrees, distanceMeters } from '@/lib/geo';
import { formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// How far and which way, as the crow flies. A place the user has not discovered never gets an itinerary.
export function CrowDirection({ here, target }: { here: GeoPoint | null; target: GeoPoint }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View>
      <Text style={styles.direction}>
        {here
          ? t('outings.direction', {
              distance: formatDistance(distanceMeters(here, target)),
              cardinal: t(cardinalKey(bearingDegrees(here, target))),
            })
          : t('outings.noPosition')}
      </Text>
      <Text style={styles.note}>{t('outings.directionNote')}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    direction: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 30,
      color: c.ink,
      marginTop: spacing.lg,
    },
    note: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: c.muted,
      marginBottom: spacing.md,
    },
  });
