import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PlayScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const iconSize = Math.min(80, width * 0.22);

  return (
    <Background>
      <ParticlesBackground />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Ionicons name="game-controller-outline" size={iconSize} color={Colors.primaryGold} style={styles.icon} />
        <Text style={styles.title}>MÓDULO DE JUEGO</Text>
        <Text style={styles.subtitle}>PRÓXIMAMENTE</Text>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  icon: { marginBottom: Spacing.lg, opacity: 0.8 },
  title: { color: Colors.textPrimary, fontFamily: Fonts.title, fontSize: 24, letterSpacing: 3, marginBottom: Spacing.sm },
  subtitle: { color: Colors.primaryGold, fontFamily: Fonts.bodyBold, fontSize: 16, letterSpacing: 5 },
});
