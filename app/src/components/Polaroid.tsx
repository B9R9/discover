import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Tape } from './Tape';

interface PolaroidProps {
  photoUri: string;
  /** Handwritten legend on the thick bottom edge. */
  caption?: string;
  /** Degrees, -5 to +5 in the charter. */
  tilt?: number;
  /** Read by screen readers instead of the photo itself. */
  accessibilityLabel: string;
}

export function Polaroid({ photoUri, caption, tilt = 0, accessibilityLabel }: PolaroidProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: colors.paperWhite,
          shadowColor: colors.ink,
          transform: [{ rotate: `${tilt}deg` }],
        },
      ]}
    >
      <Tape tilt={-tilt - 3} />
      <Image
        accessibilityLabel={accessibilityLabel}
        source={{ uri: photoUri }}
        style={[styles.photo, { backgroundColor: colors.fog }]}
        resizeMode="cover"
      />
      <Text style={[styles.caption, { color: colors.ink }]} numberOfLines={1}>
        {caption ?? ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: spacing.sm,
    paddingBottom: spacing.xs,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  photo: { width: '100%', aspectRatio: 1 },
  // Charter: handwriting never goes under 20 px.
  caption: { fontFamily: fonts.hand, fontSize: 20, lineHeight: 28, marginTop: spacing.xs },
});
