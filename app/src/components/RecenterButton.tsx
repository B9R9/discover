import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface RecenterButtonProps {
  onPress: () => void;
  bottom: number;
}

export function RecenterButton({ onPress, bottom }: RecenterButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('map.recenter')}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          bottom,
          backgroundColor: colors.paperLight,
          borderColor: colors.ink,
          shadowColor: colors.ink,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.ring, { borderColor: colors.ink }]}>
        <View style={[styles.dot, { backgroundColor: colors.postal }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: radius.round,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pressed: { opacity: 0.8 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: radius.round,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: radius.round },
});
