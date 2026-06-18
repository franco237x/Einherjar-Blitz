import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <Background>
      <ParticlesBackground />
      <View style={styles.container}>
        <Ionicons name="person-circle-outline" size={80} color={Colors.primaryGold} style={styles.icon} />
        <Text style={styles.title}>PERFIL DE JUGADOR</Text>
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
