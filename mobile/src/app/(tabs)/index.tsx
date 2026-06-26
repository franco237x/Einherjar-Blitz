import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc, runTransaction, collection, where, getDocs, increment, query } from 'firebase/firestore';
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
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Transfer states
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Convert states
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const refreshUserData = async () => {
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const handleTransfer = async () => {
    setTransferMsg(null);
    const email = transferEmail.trim().toLowerCase();
    const amount = parseInt(transferAmount, 10);

    if (!email) {
      setTransferMsg({ type: 'error', text: 'Ingresa el email del destinatario.' });
      return;
    }
    if (!amount || amount <= 0) {
      setTransferMsg({ type: 'error', text: 'Ingresa una cantidad válida de llaves.' });
      return;
    }
    const myKeys = userData?.keys || 0;
    if (amount > myKeys) {
      setTransferMsg({ type: 'error', text: `No tienes suficientes llaves. Tienes ${myKeys}.` });
      return;
    }

    setTransferBusy(true);
    try {
      // Look up recipient by email
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        setTransferMsg({ type: 'error', text: 'No se encontró ningún usuario con ese email.' });
        setTransferBusy(false);
        return;
      }

      const recipientDoc = querySnap.docs[0];
      const recipientId = recipientDoc.id;

      if (recipientId === auth.currentUser?.uid) {
        setTransferMsg({ type: 'error', text: 'No puedes transferirte llaves a ti mismo.' });
        setTransferBusy(false);
        return;
      }

      const senderRef = doc(db, 'users', auth.currentUser!.uid);
      const recipientRef = doc(db, 'users', recipientId);

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const recipientSnap = await transaction.get(recipientRef);

        if (!senderSnap.exists() || !recipientSnap.exists()) {
          throw new Error('Usuario no encontrado.');
        }

        const senderKeys = senderSnap.data().keys || 0;
        if (senderKeys < amount) {
          throw new Error('Saldo insuficiente en el momento de la transacción.');
        }

        transaction.update(senderRef, { keys: senderKeys - amount });
        transaction.update(recipientRef, { keys: (recipientSnap.data().keys || 0) + amount });
      });

      setTransferMsg({ type: 'success', text: `¡Transferiste ${amount} llaves a ${email}!` });
      setTransferEmail('');
      setTransferAmount('');
      await refreshUserData();
    } catch (error: any) {
      console.error('Transfer error:', error);
      setTransferMsg({ type: 'error', text: error?.message || 'Error al transferir llaves.' });
    } finally {
      setTransferBusy(false);
    }
  };

  const handleConvert = async () => {
    setConvertMsg(null);
    const amount = parseInt(convertAmount, 10);

    if (!amount || amount <= 0) {
      setConvertMsg({ type: 'error', text: 'Ingresa una cantidad válida de llaves.' });
      return;
    }
    const myKeys = userData?.keys || 0;
    if (amount > myKeys) {
      setConvertMsg({ type: 'error', text: `No tienes suficientes llaves. Tienes ${myKeys}.` });
      return;
    }

    setConvertBusy(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error('Usuario no encontrado.');
        }
        const currentKeys = userSnap.data().keys || 0;
        if (currentKeys < amount) {
          throw new Error('Saldo insuficiente.');
        }
        transaction.update(userRef, {
          keys: increment(-amount),
          spheres: increment(amount * 50),
        });
      });

      setConvertMsg({ type: 'success', text: `¡Convertiste ${amount} llaves en ${amount * 50} esferas!` });
      setConvertAmount('1');
      await refreshUserData();
    } catch (error: any) {
      console.error('Convert error:', error);
      setConvertMsg({ type: 'error', text: error?.message || 'Error al convertir llaves.' });
    } finally {
      setConvertBusy(false);
    }
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferEmail('');
    setTransferAmount('');
    setTransferMsg(null);
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setConvertAmount('1');
    setConvertMsg(null);
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 80 }
        ]}
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

          <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/gacha')}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="sparkles-outline" size={28} color={Colors.primaryGold} />
              <Text style={styles.navTitle}>Gacha</Text>
              <Text style={styles.navDesc}>Invoca recompensas</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push('/(tabs)/store')}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="cart-outline" size={28} color={Colors.primaryGold} />
              <Text style={styles.navTitle}>Tienda</Text>
              <Text style={styles.navDesc}>Compra artículos</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => setShowConvertModal(true)}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="sync-outline" size={28} color={Colors.primaryGold} />
              <Text style={styles.navTitle}>Conversión</Text>
              <Text style={styles.navDesc}>Llaves → Esferas</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard}>
            <GlassCard style={styles.navGlass}>
              <Ionicons name="people-outline" size={28} color={Colors.textPrimary} />
              <Text style={styles.navTitle}>Online</Text>
              <Text style={styles.navDesc}>(Próximamente)</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <GlassCard style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowTransferModal(true)}>
              <Ionicons name="swap-horizontal-outline" size={20} color={Colors.primaryGold} />
              <Text style={styles.actionText}>Transferir</Text>
            </TouchableOpacity>
            
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

      {/* Transfer Keys Modal */}
      <Modal
        visible={showTransferModal}
        transparent
        animationType="fade"
        onRequestClose={closeTransferModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transferir Llaves</Text>
              <TouchableOpacity onPress={closeTransferModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBalanceRow}>
              <Ionicons name="key-outline" size={18} color={Colors.primaryGold} />
              <Text style={styles.modalBalanceText}>Tienes {userData?.keys || 0} llaves</Text>
            </View>

            <Text style={styles.inputLabel}>Email del destinatario</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="guerrero@ejemplo.com"
              placeholderTextColor={Colors.textMuted}
              value={transferEmail}
              onChangeText={setTransferEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Cantidad de llaves</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={transferAmount}
              onChangeText={setTransferAmount}
              keyboardType="number-pad"
            />

            {transferMsg && (
              <Text style={[styles.modalMsg, transferMsg.type === 'error' ? styles.modalMsgError : styles.modalMsgSuccess]}>
                {transferMsg.text}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, transferBusy && styles.modalBtnDisabled]}
              onPress={handleTransfer}
              disabled={transferBusy}
            >
              {transferBusy ? (
                <ActivityIndicator color={Colors.bgDarker} />
              ) : (
                <Text style={styles.modalBtnText}>TRANSFERIR</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Convert Keys to Spheres Modal */}
      <Modal
        visible={showConvertModal}
        transparent
        animationType="fade"
        onRequestClose={closeConvertModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Convertir Llaves</Text>
              <TouchableOpacity onPress={closeConvertModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBalanceRow}>
              <Ionicons name="key-outline" size={18} color={Colors.primaryGold} />
              <Text style={styles.modalBalanceText}>Llaves: {userData?.keys || 0}</Text>
              <Ionicons name="planet-outline" size={18} color={Colors.primaryGold} style={{ marginLeft: Spacing.md }} />
              <Text style={styles.modalBalanceText}>Esferas: {userData?.spheres || 0}</Text>
            </View>

            <Text style={styles.inputLabel}>Cantidad de llaves a convertir</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setConvertAmount(String(Math.max(1, (parseInt(convertAmount, 10) || 1) - 1)))}>
                <Ionicons name="remove" size={20} color={Colors.primaryGold} />
              </TouchableOpacity>
              <TextInput
                style={[styles.modalInput, { flex: 1, textAlign: 'center', marginHorizontal: 0 }]}
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
                value={convertAmount}
                onChangeText={setConvertAmount}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setConvertAmount(String((parseInt(convertAmount, 10) || 0) + 1))}>
                <Ionicons name="add" size={20} color={Colors.primaryGold} />
              </TouchableOpacity>
            </View>

            <View style={styles.conversionPreview}>
              <Text style={styles.conversionText}>
                {parseInt(convertAmount, 10) || 0} llaves → {(parseInt(convertAmount, 10) || 0) * 50} esferas
              </Text>
              <Text style={styles.conversionRate}>Tasa: 1 llave = 50 esferas</Text>
            </View>

            {convertMsg && (
              <Text style={[styles.modalMsg, convertMsg.type === 'error' ? styles.modalMsgError : styles.modalMsgSuccess]}>
                {convertMsg.text}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, convertBusy && styles.modalBtnDisabled]}
              onPress={handleConvert}
              disabled={convertBusy}
            >
              {convertBusy ? (
                <ActivityIndicator color={Colors.bgDarker} />
              ) : (
                <Text style={styles.modalBtnText}>CONVERTIR</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  modalBalanceText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversionPreview: {
    backgroundColor: 'rgba(201,170,113,0.08)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  conversionText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  conversionRate: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  modalMsg: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  modalMsgError: {
    color: '#e57373',
  },
  modalMsgSuccess: {
    color: '#81c784',
  },
  modalBtn: {
    backgroundColor: Colors.primaryGold,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalBtnText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
  },
});
