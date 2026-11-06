import { Pressable, StyleSheet, Text } from 'react-native';

import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  const { colors } = useTheme();
  const look = lookOf(variant, colors);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, look.box, pressed && styles.pressed]}
    >
      <Text style={[styles.label, { color: look.text }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

function lookOf(variant: NonNullable<ButtonProps['variant']>, c: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { box: { backgroundColor: c.stamp }, text: c.onStamp };
    case 'danger':
      return { box: { borderWidth: 2, borderColor: c.stamp }, text: c.stamp };
    case 'secondary':
      return { box: { borderWidth: 2, borderColor: c.ink }, text: c.ink };
  }
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.stamp, fontSize: 15, lineHeight: 20, letterSpacing: 1.8 },
});
