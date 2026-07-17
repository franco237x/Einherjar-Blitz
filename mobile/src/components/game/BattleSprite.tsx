/**
 * BattleSprite — Renders a combatant's sprite with idle/attack/hit/dead animations.
 *
 * Uses Reanimated 4 for 60fps animations on the UI thread.
 * Falls back to an Ionicon + colored circle when no sprite image is provided.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Fonts, Radius } from '@/constants/theme';

export type SpriteState = 'idle' | 'attack' | 'hit' | 'dead';

interface BattleSpriteProps {
  sprite: any;              // ImageSourcePropType | null
  fallbackIcon: string;
  accentColor: string;
  name: string;
  isPlayer: boolean;
  state: SpriteState;
  size?: number;
}

export const BattleSprite = ({
  sprite,
  fallbackIcon,
  accentColor,
  name,
  isPlayer,
  state,
  size = 140,
}: BattleSpriteProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Idle: gentle floating
  useEffect(() => {
    if (state === 'idle') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(translateY);
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [state]);

  // Attack: lunge forward
  useEffect(() => {
    if (state === 'attack') {
      const dir = isPlayer ? 1 : -1;
      translateX.value = withSequence(
        withTiming(dir * 40, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
      scale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 300 })
      );
    }
  }, [state]);

  // Hit: flash + shake
  useEffect(() => {
    if (state === 'hit') {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(0.4, { duration: 80 }),
        withTiming(1, { duration: 120 })
      );
    }
  }, [state]);

  // Dead: fade + fall
  useEffect(() => {
    if (state === 'dead') {
      opacity.value = withTiming(0.2, { duration: 600 });
      translateY.value = withTiming(30, { duration: 600 });
      rotation.value = withTiming(isPlayer ? -15 : 15, { duration: 600 });
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        {sprite ? (
          <ExpoImage
            source={sprite}
            style={styles.sprite}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: `${accentColor}22`,
                borderColor: accentColor,
              },
            ]}
          >
            <Ionicons name={fallbackIcon as any} size={size * 0.4} color={accentColor} />
          </View>
        )}
      </Animated.View>
      <Text style={[styles.name, { color: accentColor }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
