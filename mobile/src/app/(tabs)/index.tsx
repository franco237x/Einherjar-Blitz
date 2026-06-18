import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, TouchableOpacity } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { useRouter } from 'expo-router';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          let data;
          if (docSnap.exists()) {
            data = docSnap.data();
            // Sincronizar avatar de Google si no lo tiene en la DB
            if (!data.avatar && auth.currentUser.photoURL) {
              data.avatar = auth.currentUser.photoURL;
              await setDoc(docRef, { avatar: data.avatar }, { merge: true });
            }
          } else {
            // Si el usuario no existe en Firestore (ej: login directo con Google), lo creamos
            data = {
              email: auth.currentUser.email,
              username: auth.currentUser.displayName || 'Guerrero',
              createdAt: new Date(),
              keys: 0,
              spheres: 0,
              avatar: auth.currentUser.photoURL || null,
            };
            await setDoc(docRef, data);
          }
          
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            })
          ]).start();
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (loading) {
    return (
      <Background>
        <ParticlesBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryGold} />
          <Text style={styles.loadingText}>SINCRONIZANDO CON EL REINO...</Text>
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <ParticlesBackground />
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Header: User Profile & Logout */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            {userData?.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={Colors.primaryGold} />
              </View>
            )}
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>BIENVENIDO,</Text>
              <Text style={styles.username}>{userData?.username || 'Guerrero'}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Rank Card */}
        <GlassCard style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primaryGold} />
            <Text style={styles.rankTitle}>RANGO ACTUAL</Text>
          </View>
          <Text style={styles.rankValue}>INICIADO</Text>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressText}>0 / 1000 EXP para Bronce</Text>
        </GlassCard>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="key" size={32} color={Colors.primaryGold} style={styles.statIcon} />
            <Text style={styles.statValue}>{userData?.keys || 0}</Text>
            <Text style={styles.statLabel}>LLAVES</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <Ionicons name="aperture" size={32} color={Colors.primaryGold} style={styles.statIcon} />
            <Text style={styles.statValue}>{userData?.spheres || 0}</Text>
            <Text style={styles.statLabel}>ESFERAS</Text>
          </GlassCard>
        </View>

        {/* Next Mission / Call to Action */}
        <TouchableOpacity style={styles.missionCard}>
          <GlassCard style={styles.missionGlass}>
            <View style={styles.missionContent}>
              <View>
                <Text style={styles.missionLabel}>PRÓXIMA BATALLA</Text>
                <Text style={styles.missionTitle}>El Despertar de las Valquirias</Text>
              </View>
              <Ionicons name="play-circle" size={48} color={Colors.primaryGold} />
            </View>
          </GlassCard>
        </TouchableOpacity>

      </Animated.View>
    </Background>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    marginTop: Spacing.md,
    letterSpacing: 2,
    fontSize: 12,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: 60, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    marginLeft: Spacing.md,
  },
  greeting: {
    color: Colors.textMuted,
    fontFamily: Fonts.title,
    fontSize: 14,
    letterSpacing: 2,
  },
  username: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoutButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rankCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rankTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 16,
    letterSpacing: 2,
    marginLeft: Spacing.sm,
  },
  rankValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 28,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    width: '0%', // 0% progess for 'INICIADO'
    height: '100%',
    backgroundColor: Colors.primaryGold,
  },
  progressText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statIcon: {
    marginBottom: Spacing.sm,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 36,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  missionCard: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  missionGlass: {
    padding: 0, // Let content define padding to allow cool hover/press effects
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: Colors.primaryGold,
  },
  missionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  missionLabel: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  missionTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
  },
});
