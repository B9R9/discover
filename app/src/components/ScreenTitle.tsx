import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// `kicker` is the small stamped line above the title, as on the notebook's screens.
export function ScreenTitle({ children, kicker }: { children: string; kicker?: string }) {
  const { colors } = useTheme();
  return (
    <View>
      {kicker !== undefined && (
        <Text style={[styles.kicker, { color: colors.stamp }]}>{kicker.toUpperCase()}</Text>
      )}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.9 },
  title: { fontFamily: fonts.title, fontSize: 36, lineHeight: 40 },
});
