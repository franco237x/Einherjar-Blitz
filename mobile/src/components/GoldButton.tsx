import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface GoldButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export const GoldButton = ({ title, loading, style, disabled, ...props }: GoldButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[styles.container, style, disabled && styles.disabled]}
      {...props}
    >
      <LinearGradient
        colors={[Colors.primaryGold, Colors.darkGold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {loading ? (
        <ActivityIndicator color={Colors.bgDark} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4, // Shadow for Android
    shadowColor: Colors.primaryGold, // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  text: {
    color: Colors.bgDark,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.6,
  },
});
