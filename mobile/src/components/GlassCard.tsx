import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GlassCard = ({ children, style }: GlassCardProps) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderColor: Colors.glassBorder,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.4)', // Slightly dark backdrop
  },
  content: {
    padding: Spacing.lg,
  },
});
