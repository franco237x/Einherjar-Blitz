import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Fonts, Spacing } from '@/constants/theme';

export default function NewsScreen() {
  const newsList = [
    { id: 1, title: 'Nueva Temporada Iniciada', date: 'Oct 24, 2026', content: 'La temporada 3 ha comenzado. Reclama tus recompensas en el santuario.' },
    { id: 2, title: 'Mantenimiento Programado', date: 'Oct 20, 2026', content: 'Los servidores estarán inactivos por 2 horas este viernes para mejorar la estabilidad de las batallas.' },
    { id: 3, title: 'Nuevas Esferas Disponibles', date: 'Oct 15, 2026', content: 'Descubre las nuevas esferas elementales en la armería dorada.' },
  ];

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CRÓNICAS</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {newsList.map((item) => (
            <GlassCard key={item.id} style={styles.newsCard}>
              <Text style={styles.newsDate}>{item.date}</Text>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsContent}>{item.content}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 32,
    letterSpacing: 2,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  newsCard: {
    padding: Spacing.lg,
  },
  newsDate: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  newsTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  newsContent: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
