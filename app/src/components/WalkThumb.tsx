import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Stop } from '@/features/walks/snapWalk';
import { thumbnailDots } from '@/features/walks/thumbnail';
import { useTheme } from '@/theme/useTheme';

const DOT = 4;

// The walk as a stamp-red dotted trail on a square of fog paper. Decorative: the name says what it is.
export function WalkThumb({ path, size = 72 }: { path: readonly Stop[]; size?: number }) {
  const { colors } = useTheme();
  const dots = useMemo(() => thumbnailDots(path, size), [path, size]);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: size, height: size, backgroundColor: colors.fog }]}
    >
      {dots.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { left: dot.x - DOT / 2, top: dot.y - DOT / 2, backgroundColor: colors.stamp },
            (i === 0 || i === dots.length - 1) && styles.end,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2 },
  end: {
    width: DOT * 2,
    height: DOT * 2,
    borderRadius: DOT,
    marginLeft: -DOT / 2,
    marginTop: -DOT / 2,
  },
});
