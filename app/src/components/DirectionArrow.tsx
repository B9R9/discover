import { StyleSheet, Text, View } from 'react-native';

import { formatDistance } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface DirectionArrowProps {
  // Degrees clockwise from the top of the screen.
  rotation: number;
  distance: number;
}

export function DirectionArrow({ rotation, distance }: DirectionArrowProps) {
  const { colors } = useTheme();
  const label = formatDistance(distance);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('places.directionLabel', { distance: label })}
    >
      <View
        style={[
          styles.arrow,
          { borderBottomColor: colors.stamp, transform: [{ rotate: `${rotation}deg` }] },
        ]}
      />
      <Text style={[styles.distance, { color: colors.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  distance: { fontFamily: fonts.stamp, fontSize: 22, lineHeight: 28 },
});
