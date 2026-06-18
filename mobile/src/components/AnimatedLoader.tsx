import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface AnimatedLoaderProps {
  size?: number;
}

export const AnimatedLoader = ({ size = 60 }: AnimatedLoaderProps) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Rotation Animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse Glow Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: size,
            height: size,
            opacity: pulse,
            transform: [{ scale: pulse.interpolate({ inputRange: [0.5, 1], outputRange: [0.8, 1.2] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.innerDot,
          {
            opacity: pulse,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: Colors.primaryGold,
    borderRadius: 999,
    filter: 'blur(10px)', // web only, will just be an opacity pulse on native
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.primaryGold,
    borderRightColor: Colors.darkGold,
    borderLeftColor: Colors.lightGold,
  },
  innerDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.primaryGold,
    borderRadius: 4,
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});
