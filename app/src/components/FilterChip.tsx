import { Pressable, StyleSheet, Text } from 'react-native';

import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// A filter of a list: inked when on, outlined when off.
export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.ink, backgroundColor: selected ? colors.ink : 'transparent' },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.paper : colors.ink }]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md + 2,
    borderWidth: 2,
    borderRadius: radius.card,
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.stamp, fontSize: 13 },
});
