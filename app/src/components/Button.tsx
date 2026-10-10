import { Pressable, StyleSheet, Text } from 'react-native';

import { palette, radius, spacing } from '@/theme/tokens';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: palette.light.accent },
  secondary: { borderWidth: 1, borderColor: palette.light.border },
  pressed: { opacity: 0.8 },
  label: { fontSize: 16, lineHeight: 20, fontWeight: '600', color: palette.light.onAccent },
});
