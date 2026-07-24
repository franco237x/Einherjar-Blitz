import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';

const PARTICLE_COUNT = 30;

interface ParticleProps {
  delay: number;
  width: number;
  height: number;
}

const Particle = ({ delay, width, height }: ParticleProps) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  
  // Randomize size and duration
  const size = Math.random() * 4 + 2; // 2px to 6px
  const duration = Math.random() * 5000 + 4000; // 4s to 9s

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const floatAnimation = Animated.loop(
      Animated.parallel([
        // Move up
        Animated.timing(translateY, {
          toValue: -50,
          duration: duration,
          useNativeDriver: true,
        }),
        // Fade in then out
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: Math.random() * 0.5 + 0.3, // peak opacity 0.3-0.8
            duration: duration * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.8,
            useNativeDriver: true,
          })
        ]),
        // Slight sway horizontally
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 100 + (translateX as any)._value,
          duration: duration,
          useNativeDriver: true,
        })
      ])
    );
    
    // Initial delay so they don't all spawn at once
    timeoutId = setTimeout(() => {
      floatAnimation.start();
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      floatAnimation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: opacity,
          transform: [
            { translateY },
            { translateX }
          ]
        }
      ]}
    />
  );
};

export const ParticlesBackground = () => {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  if (reduceMotion) {
    return null;
  }

  // Generate particles with random delays so they don't spawn all at once
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
    <Particle
      key={`${Math.round(width)}-${Math.round(height)}-${i}`}
      delay={Math.random() * 5000}
      width={width}
      height={height}
    />
  ));

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {particles}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.primaryGold,
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
});
