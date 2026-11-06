import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

// Decorative strip of tape, laid across the top edge of a polaroid or featured card.
export function Tape({ tilt = -4 }: { tilt?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tape,
        { backgroundColor: colors.lantern, transform: [{ rotate: `${tilt}deg` }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tape: { position: 'absolute', top: -9, alignSelf: 'center', width: 64, height: 18, opacity: 0.7 },
});
