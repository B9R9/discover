import { useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { routeDots, ROUTE_SPACE } from '@/lib/routeDots';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const LOOP_MS = 8000;
const DOT_COUNT = 36;
const DOT_SIZE = 6;
const DRAW_END = 0.7;
const GRID_LINES = 14;

const DOTS = routeDots(DOT_COUNT);

function RouteDot({ progress, index, x, y, color }: DotProps) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value >= (index / DOT_COUNT) * DRAW_END ? 1 : 0,
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x - DOT_SIZE / 2, top: y - DOT_SIZE / 2 },
        { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}
type DotProps = { progress: SharedValue<number>; index: number; x: number; y: number; color: string };

// Full-screen loading scene: a fog opening, a dotted route drawn to an X, the app name.
// `place` completes the kicker ("Carnet de route · Biscarrosse") when it is known.
export function LoadingScene({ place }: { place?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(1);
  const [size, setSize] = useState({ width: ROUTE_SPACE.width, height: ROUTE_SPACE.height });

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1);
  }, [progress, reducedMotion]);

  const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);
  const sx = size.width / ROUTE_SPACE.width;
  const sy = size.height / ROUTE_SPACE.height;

  const scene = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : interpolate(progress.value, [0, 0.05, 0.92, 1], [0, 1, 1, 0]),
  }));
  const fog = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.45, 1.25]) }],
  }));
  const cross = useAnimatedStyle(() => ({
    opacity: progress.value >= DRAW_END ? 1 : 0,
    transform: [{ scale: interpolate(progress.value, [DRAW_END, DRAW_END + 0.05], [0.3, 1], 'clamp') }],
  }));
  const word = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [0, 0.15], [12, 0], 'clamp') }],
  }));
  const tag = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 0.3], [0, 1], 'clamp'),
  }));
  const blink = useAnimatedStyle(() => ({
    opacity: 0.3 + 0.7 * (Math.floor(progress.value * 12) % 2),
  }));

  const end = DOTS[DOTS.length - 1] ?? { x: 0, y: 0 };
  const kicker = place ? `${t('loading.kicker')} · ${place}` : t('loading.kicker');

  return (
    <View
      style={styles.root}
      onLayout={onLayout}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={t('loading.maps')}
    >
      <Animated.View style={[StyleSheet.absoluteFill, scene]} pointerEvents="none">
        {Array.from({ length: GRID_LINES }, (_, i) => (
          <View key={i} style={[styles.gridLine, { top: ((i + 1) / (GRID_LINES + 1)) * size.height }]} />
        ))}
        <Animated.View
          style={[styles.fog, { left: size.width * 0.62 - 140, top: size.height * 0.46 - 140 }, fog]}
        />
        {DOTS.map((p, i) => (
          <RouteDot
            key={i}
            progress={progress}
            index={i}
            x={p.x * sx}
            y={p.y * sy}
            color={colors.stamp}
          />
        ))}
        <Animated.Text
          style={[styles.cross, { left: end.x * sx - 14, top: end.y * sy - 22 }, cross]}
        >
          ×
        </Animated.Text>
        <View style={styles.center}>
          <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
          <Animated.Text style={[styles.word, word]}>{t('loading.title')}</Animated.Text>
          <Animated.Text style={[styles.tagline, tag]}>{t('loading.tagline')}</Animated.Text>
        </View>
        <Animated.Text style={[styles.footer, blink]}>{t('loading.maps').toUpperCase()}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { ...StyleSheet.absoluteFill, backgroundColor: c.paper, overflow: 'hidden' },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.kraft,
      opacity: 0.5,
    },
    fog: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: c.fog,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.kraft,
      opacity: 0.8,
    },
    cross: { position: 'absolute', width: 28, fontFamily: fonts.stamp, fontSize: 44, lineHeight: 44, color: c.stamp, textAlign: 'center' },
    center: { position: 'absolute', left: 0, right: 0, top: '14%', alignItems: 'center', gap: spacing.sm },
    kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 2.6, color: c.stamp },
    word: { fontFamily: fonts.title, fontSize: 96, lineHeight: 104, color: c.ink },
    tagline: { fontFamily: fonts.hand, fontSize: 30, color: c.ink, transform: [{ rotate: '-2deg' }] },
    footer: {
      position: 'absolute',
      bottom: spacing.xl,
      alignSelf: 'center',
      fontFamily: fonts.stamp,
      fontSize: 12,
      letterSpacing: 2.4,
      color: c.muted,
    },
  });
