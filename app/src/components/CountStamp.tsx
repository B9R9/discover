import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface CountStampProps {
  value: string;
  label: string;
  tone: 'stamp' | 'postal';
  round?: boolean;
  /** Degrees, as in the charter's stamps. */
  tilt?: number;
}

// A number inked on the page, like a postmark. Decorative: the label carries the meaning.
export function CountStamp({ value, label, tone, round = false, tilt = -6 }: CountStampProps) {
  const { colors } = useTheme();
  const color = tone === 'stamp' ? colors.stamp : colors.postalText;
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[
        styles.box,
        { borderColor: color, borderRadius: round ? 46 : 8, transform: [{ rotate: `${tilt}deg` }] },
      ]}
    >
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 92,
    height: 92,
    borderWidth: 3,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.stamp, fontSize: 30, lineHeight: 34 },
  label: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.1 },
});
