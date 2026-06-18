import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export default function SettingsScreen() {

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AJUSTES</Text>
        </View>

        <View style={styles.content}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>PERFIL DEL GUERRERO</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inscripción</Text>
              <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
            </View>
          </GlassCard>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>ABANDONAR EL REINO</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 32,
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  logoutText: {
    color: '#ef4444',
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 1,
  },
});
