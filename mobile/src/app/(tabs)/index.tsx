import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { useRouter } from 'expo-router';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function DashboardScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          let data;
          if (docSnap.exists()) {
            data = docSnap.data();
            if (!data.avatar && auth.currentUser.photoURL) {
              data.avatar = auth.currentUser.photoURL;
              await setDoc(docRef, { avatar: data.avatar }, { merge: true });
            }
          } else {
            data = {
              email: auth.currentUser.email,
              username: auth.currentUser.displayName || 'Guerrero',
              createdAt: new Date(),
              keys: 0,
              spheres: 0,
              avatar: auth.currentUser.photoURL || null,
              nivel: 1,
              experiencia: 0,
              copas: 0,
              victorias: 0,
              derrotas: 0,
              rango: 'Iniciado',
              horas_jugadas: 0,
              frase: 'Forjando mi destino...'
            };
            await setDoc(docRef, data);
          }
          
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          // Delay to ensure the loading screen animation completes (2.5s) and prevents stuttering on low-end devices
          setTimeout(() => {
            setLoading(false);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start();
          }, 2500);
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

  const calculateWinrate = () => {
    if (!userData) return 0;
    const total = (userData.victorias || 0) + (userData.derrotas || 0);
    return total > 0 ? Math.round(((userData.victorias || 0) / total) * 100) : 0;
  };

  const getProgressInfo = () => {
    if (!userData) return { current: 0, percent: 0, next: 1000, remaining: 1000 };
    const exp = userData.experiencia || 0;
    const current = exp % 1000;
    return {
      current,
      percent: (current / 1000) * 100,
      next: 1000,
      remaining: 1000 - current
    };
  };

  if (loading) {
    return <LoadingScreen message="SINCRONIZANDO..." />;
  }

  const winrate = calculateWinrate();
  const progress = getProgressInfo();

  return (
    <Background>
      <ParticlesBackground />
      <Animated.ScrollView 
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Ionicons name="shield-half" size={24} color={Colors.primaryGold} />
            <Text style={styles.brandText}>Einherjer Blitz</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.avatarWrapper}>
              {userData?.avatar ? (
                <Image source={{ uri: userData.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color={Colors.primaryGold} />
                </View>
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{userData?.nivel || 1}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>¡Bienvenido, {userData?.username || 'Guerrero'}!</Text>
          <Text style={styles.welcomeSubtitle}>{userData?.frase || 'Forjando mi destino...'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="trophy-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{userData?.copas || 0}</Text>
            <Text style={styles.statLabel}>Copas</Text>
            <Text style={styles.statSublabel}>{userData?.rango || 'Iniciado'}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="medal-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{userData?.nivel || 1}</Text>
            <Text style={styles.statLabel}>Nivel</Text>
            <Text style={styles.statSublabel}>{userData?.experiencia || 0} EXP</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="stats-chart-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{winrate}%</Text>
            <Text style={styles.statLabel}>Winrate</Text>
            <Text style={styles.statSublabel}>{userData?.victorias || 0}W / {userData?.derrotas || 0}L</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="key-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{userData?.keys || 0}</Text>
            <Text style={styles.statLabel}>Llaves</Text>
            <Text style={styles.statSublabel}>Para cofres</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="planet-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{userData?.spheres || 0}</Text>
            <Text style={styles.statLabel}>Esferas</Text>
            <Text style={styles.statSublabel}>Moneda del juego</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primaryGold} />
            <Text style={styles.statValue}>{userData?.horas_jugadas || 0}h</Text>
            <Text style={styles.statLabel}>Horas</Text>
            <Text style={styles.statSublabel}>Tiempo total</Text>
          </GlassCard>
        </View>

        {/* Level Progress */}
        <GlassCard style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso de Nivel</Text>
            <Text style={styles.progressLevels}>Nivel {userData?.nivel || 1} → {(userData?.nivel || 1) + 1}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.percent}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{progress.current} EXP</Text>
            <Text style={styles.progressText}>{progress.remaining} restante</Text>
          </View>
        </GlassCard>

        {/* Navigation Grid */}
        <View style={styles.navGrid}>
          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="game-controller-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Jugar</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="bar-chart-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Estadísticas</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="gift-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Cofres</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="cart-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Tienda</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="sync-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Conversión</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="people-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Online</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={[styles.navGlass, { borderColor: Colors.secondaryPurple }]}>
              <Ionicons name="hardware-chip-outline" size={28} color={Colors.secondaryPurple} />
              <Text style={[styles.navTitle, { color: Colors.secondaryPurple }]}>AR-12 Chat</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={[styles.navGlass, { borderColor: Colors.secondaryPurple }]}>
              <Ionicons name="moon-outline" size={28} color={Colors.secondaryPurple} />
              <Text style={[styles.navTitle, { color: Colors.secondaryPurple }]}>Aquelarre</Text>
              <Text style={styles.navDesc}>(Evento)</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <GlassCard style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <View style={[styles.actionBtn, { opacity: 0.5 }]}>
              <Ionicons name="swap-horizontal-outline" size={20} color={Colors.textMuted} />
              <Text style={[styles.actionText, { color: Colors.textMuted }]}>Transferir</Text>
            </View>
            
            <View style={[styles.actionBtn, { opacity: 0.5 }]}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.textMuted} />
              <Text style={[styles.actionText, { color: Colors.textMuted }]}>Perfil</Text>
            </View>

            <View style={[styles.actionBtn, { opacity: 0.5 }]}>
              <Ionicons name="skull-outline" size={20} color={Colors.textMuted} />
              <Text style={[styles.actionText, { color: Colors.textMuted }]}>Mega Jefe</Text>
            </View>
          </View>
        </GlassCard>

      </Animated.ScrollView>
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
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100, // Extra padding for Bottom Nav
  },
  
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  brandText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  avatarWrapper: {
    position: 'relative',
    marginHorizontal: Spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.primaryGold,
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
  },

  /* Welcome */
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 24,
    marginTop: Spacing.xs,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  statSublabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.body,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },

  /* Progress Section */
  progressSection: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 14,
  },
  progressLevels: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryGold,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.body,
    fontSize: 12,
  },

  /* Nav Grid */
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  navCard: {
    width: '47%',
  },
  navGlass: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  navDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 10,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  /* Quick Actions */
  quickActionsSection: {
    padding: Spacing.lg,
  },
  quickActionsTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
