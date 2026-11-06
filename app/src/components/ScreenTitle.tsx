import { StyleSheet, Text } from 'react-native';

import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function ScreenTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.title, fontSize: 36, lineHeight: 40 },
});
