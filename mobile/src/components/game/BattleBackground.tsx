/**
 * BattleBackground — Themed background for the battle screen.
 *
 * Uses a gradient + subtle particle effect. When a sprite image is provided
 * (for the dungeon background), it renders that instead.
 */

import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

interface BattleBackgroundProps {
  backgroundImage?: any;  // ImageSourcePropType | null
  isBoss?: boolean;
}

export const BattleBackground = ({ backgroundImage, isBoss = false }: BattleBackgroundProps) => {
  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.imageBg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,10,0.3)', 'rgba(10,10,10,0.7)']}
          style={styles.overlay}
        />
      </ImageBackground>
    );
  }

  // Procedural gradient background
  const colors = isBoss
    ? ['#1a0505', '#0a0a0a', '#050505']
    : ['#0f0a1a', '#0a0a0a', '#050505'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Subtle radial glow at center */}
      <View style={[styles.glow, isBoss && styles.glowBoss]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  imageBg: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  glow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    opacity: 0.6,
  },
  glowBoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
});
