import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface StampProps {
  label: string;
  /** Degrees, -14 to +6 in the charter. */
  tilt?: number;
}

// Double-bordered rubber stamp: validates, counts or flags something. Decorative, never a control.
export function Stamp({ label, tilt = -6 }: StampProps) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.outer, { borderColor: colors.stamp, transform: [{ rotate: `${tilt}deg` }] }]}
    >
      <View style={[styles.inner, { borderColor: colors.stamp }]}>
        <Text style={[styles.text, { color: colors.stamp }]}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignSelf: 'flex-start', borderWidth: 3, borderRadius: 3, padding: 2 },
  inner: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: { fontFamily: fonts.stamp, fontSize: 12, lineHeight: 16, letterSpacing: 1.6 },
});
