/**
 * DamageNumber — Floating animated number for damage/heal display.
 *
 * Pops up, floats upward, and fades out. Red for damage, green for heal,
 * gold for critical hits.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';

interface DamageNumberProps {
  value: number;
  type: 'damage' | 'heal' | 'crit';
  x: number;
  y: number;
  onDone: () => void;
}

export const DamageNumber = ({ value, type, x, y, onDone }: DamageNumberProps) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 100 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(600, withTiming(0, { duration: 400 }))
    );
    translateY.value = withSequence(
      withTiming(-20, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withDelay(300, withTiming(-60, { duration: 500, easing: Easing.inOut(Easing.ease) }))
    );

    const timeout = setTimeout(() => runOnJS(onDone)(), 1100);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const color = type === 'heal' ? '#22c55e' : type === 'crit' ? '#fbbf24' : '#ef4444';
  const prefix = type === 'heal' ? '+' : '';
  const suffix = type === 'crit' ? '!' : '';

  return (
    <Animated.View
      style={[
        styles.container,
        { left: x, top: y },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.Text
        style={[
          styles.text,
          { color, textShadowColor: color },
          type === 'crit' && styles.critText,
        ]}
      >
        {prefix}{value}{suffix}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  text: {
    fontFamily: Fonts.bodyBold,
    fontSize: 24,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  critText: {
    fontSize: 32,
  },
});
