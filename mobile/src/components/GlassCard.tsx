import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const GlassCard = ({ children, style, contentStyle }: GlassCardProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, contentStyle]}>
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
    backgroundColor: Colors.bgCard,
  },
  content: {
    padding: Spacing.lg,
  },
});
