/**
 * DefeatScreen — Shown after losing a battle.
 *
 * Informs the player and lets them retry from the previous floor.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

interface DefeatScreenProps {
  onRetry: () => void;
  onExit: () => void;
}

export const DefeatScreen = ({ onRetry, onExit }: DefeatScreenProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#1a0505', '#0a0a0a', '#050505']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="skull" size={64} color="#ef4444" />
        </View>

        <Text style={styles.title}>DERROTA</Text>

        <Text style={styles.message}>
          Has caído en batalla. Volverás al piso anterior.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.retryBtn]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={Colors.bgDarker} />
            <Text style={styles.retryText}>REINTENTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.exitBtn]}
            onPress={onExit}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={18} color={Colors.textSecondary} />
            <Text style={styles.exitText}>SALIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 1,
  },
  iconWrap: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    color: '#ef4444',
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  message: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  retryBtn: {
    backgroundColor: Colors.primaryGold,
  },
  exitBtn: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  retryText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.bgDarker,
    letterSpacing: 1,
  },
  exitText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
