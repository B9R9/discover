import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { t } from '@/lib/i18n/t';
import { motion } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Polaroid } from './Polaroid';
import { Stamp } from './Stamp';

const RISE_FROM = 240;
const HOLD_MS = 900;

interface ValidatedOverlayProps {
  photoUri: string;
  onDone: () => void;
}

// Shown for a moment after a discovery: the polaroid rises, then the stamp lands on it.
export function ValidatedOverlay({ photoUri, onDone }: ValidatedOverlayProps) {
  const { colors } = useTheme();
  const [rise] = useState(() => new Animated.Value(0));
  const [stamp] = useState(() => new Animated.Value(0));
  // The parent re-renders while this plays: a ref keeps the animation from restarting.
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(rise, {
        toValue: 1,
        duration: motion.polaroid,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(stamp, { toValue: 1, duration: motion.stamp, useNativeDriver: true }),
      Animated.delay(HOLD_MS),
    ]);
    animation.start(({ finished }) => {
      if (finished) finish.current();
    });
    return () => animation.stop();
  }, [rise, stamp]);

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.paper }]}>
      <Animated.View
        style={{
          opacity: rise,
          transform: [
            { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [RISE_FROM, 0] }) },
          ],
        }}
      >
        <Polaroid photoUri={photoUri} tilt={-3} accessibilityLabel={t('photo.validatedPhoto')} />
      </Animated.View>
      <Animated.View
        style={[
          styles.stamp,
          {
            opacity: stamp,
            transform: [
              { scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) },
            ],
          },
        ]}
      >
        <Stamp label={t('photo.validated')} tilt={-10} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute', bottom: '30%' },
});
