import { Pressable, StyleSheet, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

interface RecenterButtonProps {
  onPress: () => void;
  bottom: number;
}

export function RecenterButton({ onPress, bottom }: RecenterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('map.recenter')}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { bottom }, pressed && styles.pressed]}
    >
      <View style={styles.ring}>
        <View style={styles.dot} />
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
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.light.surface,
    shadowColor: palette.light.text,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.8 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: palette.light.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: palette.light.accent },
});
