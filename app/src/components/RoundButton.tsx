import { Pressable, StyleSheet, Text } from 'react-native';

import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface RoundButtonProps {
  glyph: string;
  label: string;
  onPress: () => void;
  // Inked when the tool is on.
  active?: boolean;
}

// A 48 px round tool button (back, undo, erase). The glyph is decoration, the label is what is read out.
export function RoundButton({ glyph, label, onPress, active = false }: RoundButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.button,
        { borderColor: colors.ink, backgroundColor: active ? colors.ink : colors.paper },
      ]}
    >
      <Text style={[styles.glyph, { color: active ? colors.paper : colors.ink }]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontFamily: fonts.bodyBold, fontSize: 22, lineHeight: 26 },
});
