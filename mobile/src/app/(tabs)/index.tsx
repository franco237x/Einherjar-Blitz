import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '@/config/firebase';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Layout, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useUserData } from '@/hooks/useUserData';
import { TransferModal } from '@/components/TransferModal';
import { convertKeysToSpheres } from '@/services/economy';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const stackedHeader = width < 620;
  const wide = width >= 720;
  const { userData, loading, error: userDataError } = useUserData();

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Convert states
  const [convertAmount, setConvertAmount] = useState('1');
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger fade-in animation once data finishes loading
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

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

  const handleConvert = async () => {
    setConvertMsg(null);
    if (userDataError) {
      setConvertMsg({
        type: 'error',
        text: 'Espera a que el perfil vuelva a sincronizarse.',
      });
      return;
    }
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
      await convertKeysToSpheres(auth.currentUser!.uid, amount);

      setConvertMsg({ type: 'success', text: `¡Convertiste ${amount} llaves en ${amount * 50} esferas!` });
      setConvertAmount('1');
      // onSnapshot in useUserData will auto-refresh balances
    } catch (error: any) {
      if (__DEV__) console.error('Convert error:', error?.code || error?.message);
      setConvertMsg({ type: 'error', text: error?.message || 'Error al convertir llaves.' });
    } finally {
      setConvertBusy(false);
    }
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
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
          compact && styles.scrollContentCompact,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + 88,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.lobbyHeader, stackedHeader && styles.lobbyHeaderCompact]}>
          <TouchableOpacity
            style={styles.playerIdentity}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${userData?.username || 'Guerrero'}, nivel ${userData?.nivel || 1}`}
          >
            <View style={styles.avatarFrame}>
              {userData?.avatar ? (
                <Image
                  source={{ uri: userData.avatar }}
                  style={styles.playerAvatar}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.playerAvatarPlaceholder}>
                  <Ionicons name="person" size={25} color={Colors.primaryGold} />
                </View>
              )}
              <View style={styles.playerLevelBadge}>
                <Text style={styles.playerLevelText}>{userData?.nivel || 1}</Text>
              </View>
            </View>

            <View style={styles.playerCopy}>
              <Text style={styles.playerName} numberOfLines={1}>
                {userData?.username || 'Guerrero'}
              </Text>
              <Text style={styles.playerRank} numberOfLines={1}>
                {userData?.rango || 'Iniciado'}
              </Text>
              <View style={styles.headerProgressTrack}>
                <View
                  style={[
                    styles.headerProgressFill,
                    { width: `${progress.percent}%` },
                  ]}
                />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.wallet} accessibilityLabel="Tus recursos">
            <View style={[styles.currencyPill, stackedHeader && styles.currencyPillCompact]}>
              <Ionicons name="key-outline" size={18} color={Colors.primaryGold} />
              <View>
                <Text style={styles.currencyLabel}>LLAVES</Text>
                <Text style={styles.currencyValue}>{userData?.keys || 0}</Text>
              </View>
            </View>
            <View style={[styles.currencyPill, stackedHeader && styles.currencyPillCompact]}>
              <Ionicons name="planet-outline" size={18} color="#7ed9e7" />
              <View>
                <Text style={styles.currencyLabel}>ESFERAS</Text>
                <Text style={styles.currencyValue}>{userData?.spheres || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {userDataError ? (
          <Text style={styles.syncError} accessibilityRole="alert">
            No se pudieron sincronizar tus datos. Comprueba tu conexión antes de operar.
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.showcase, wide && styles.showcaseWide]}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil y trayectoria"
        >
          <Image
            source={require('../../../assets/images/loading_screen/orfevre.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
            transition={220}
          />
          <LinearGradient
            colors={[
              'rgba(5, 5, 5, 0.06)',
              'rgba(5, 5, 5, 0.44)',
              'rgba(5, 5, 5, 0.96)',
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.showcaseTop}>
            <View>
              <Text style={styles.showcaseEyebrow}>PERFIL DE GUERRERO</Text>
              <Text style={styles.showcaseSeason}>Temporada actual</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>EN LÍNEA</Text>
            </View>
          </View>

          <View style={styles.showcaseBottom}>
            <Text style={styles.showcaseRank}>{userData?.rango || 'Iniciado'}</Text>
            <Text style={styles.showcaseQuote} numberOfLines={2}>
              {userData?.frase || 'Forjando mi destino...'}
            </Text>
            <View style={styles.showcaseStats}>
              <View style={styles.showcaseStat}>
                <Text style={styles.showcaseStatValue}>{userData?.copas || 0}</Text>
                <Text style={styles.showcaseStatLabel}>COPAS</Text>
              </View>
              <View style={styles.showcaseStatDivider} />
              <View style={styles.showcaseStat}>
                <Text style={styles.showcaseStatValue}>{userData?.victorias || 0}</Text>
                <Text style={styles.showcaseStatLabel}>VICTORIAS</Text>
              </View>
              <View style={styles.showcaseStatDivider} />
              <View style={styles.showcaseStat}>
                <Text style={styles.showcaseStatValue}>{winrate}%</Text>
                <Text style={styles.showcaseStatLabel}>WINRATE</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <GlassCard style={styles.progressSection} contentStyle={styles.progressContent}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressEyebrow}>PROGRESO GENERAL</Text>
              <Text style={styles.progressTitle}>Nivel {userData?.nivel || 1}</Text>
            </View>
            <View style={styles.nextLevelBadge}>
              <Text style={styles.nextLevelLabel}>SIGUIENTE</Text>
              <Text style={styles.nextLevelValue}>{(userData?.nivel || 1) + 1}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.percent}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{progress.current} EXP</Text>
            <Text style={styles.progressText}>{progress.remaining} restante</Text>
          </View>
        </GlassCard>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Operaciones</Text>
            <Text style={styles.sectionSubtitle}>Gestiona tu economía</Text>
          </View>
        </View>

        <View style={styles.operationsGrid}>
          <TouchableOpacity
            style={[
              styles.operationCard,
              wide && styles.operationCardWide,
              userDataError && styles.operationCardDisabled,
            ]}
            onPress={() => setShowTransferModal(true)}
            disabled={Boolean(userDataError)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Transferir llaves"
            accessibilityState={{ disabled: Boolean(userDataError) }}
          >
            <View style={styles.operationIcon}>
              <Ionicons name="swap-horizontal-outline" size={23} color={Colors.primaryGold} />
            </View>
            <Text style={styles.operationTitle}>Transferir</Text>
            <Text style={styles.operationDescription}>Envía llaves a otro usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.operationCard,
              wide && styles.operationCardWide,
              userDataError && styles.operationCardDisabled,
            ]}
            onPress={() => setShowConvertModal(true)}
            disabled={Boolean(userDataError)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Convertir llaves en esferas"
            accessibilityState={{ disabled: Boolean(userDataError) }}
          >
            <View style={styles.operationIcon}>
              <Ionicons name="sync-outline" size={23} color={Colors.primaryGold} />
            </View>
            <Text style={styles.operationTitle}>Convertir</Text>
            <Text style={styles.operationDescription}>Cambia llaves por esferas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.operationCard, wide && styles.operationCardWide]}
            onPress={() => router.push('/(tabs)/gacha')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir gacha"
          >
            <View style={styles.operationIcon}>
              <Ionicons name="sparkles-outline" size={23} color={Colors.primaryGold} />
            </View>
            <Text style={styles.operationTitle}>Gacha</Text>
            <Text style={styles.operationDescription}>Usa esferas y reclama premios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.operationCard, wide && styles.operationCardWide]}
            onPress={() => router.push('/(tabs)/store')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir tienda"
          >
            <View style={styles.operationIcon}>
              <Ionicons name="bag-handle-outline" size={23} color={Colors.primaryGold} />
            </View>
            <Text style={styles.operationTitle}>Tienda</Text>
            <Text style={styles.operationDescription}>Compra y revisa el catálogo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Modo de juego</Text>
        <TouchableOpacity
          style={styles.arenaStrip}
          onPress={() => router.push('/(tabs)/play')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Abrir arena de combate"
        >
          <View style={styles.arenaIcon}>
            <Ionicons name="game-controller-outline" size={25} color={Colors.primaryGold} />
          </View>
          <View style={styles.arenaCopy}>
            <Text style={styles.arenaTitle}>Arena de combate</Text>
            <Text style={styles.arenaDescription} numberOfLines={2}>
              Prueba tus personajes en el modo RPG
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* Transfer Keys Modal */}
      <TransferModal
        visible={showTransferModal}
        onClose={closeTransferModal}
        myKeys={userData?.keys || 0}
      />

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
              <TouchableOpacity
                onPress={closeConvertModal}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Cerrar conversión"
              >
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
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setConvertAmount(String(Math.max(1, (parseInt(convertAmount, 10) || 1) - 1)))}
                accessibilityRole="button"
                accessibilityLabel="Restar una llave"
              >
                <Ionicons name="remove" size={20} color={Colors.primaryGold} />
              </TouchableOpacity>
              <TextInput
                style={[styles.modalInput, { flex: 1, textAlign: 'center', marginHorizontal: 0 }]}
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
                value={convertAmount}
                onChangeText={setConvertAmount}
                keyboardType="number-pad"
                accessibilityLabel="Cantidad de llaves a convertir"
              />
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setConvertAmount(String((parseInt(convertAmount, 10) || 0) + 1))}
                accessibilityRole="button"
                accessibilityLabel="Sumar una llave"
              >
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
              accessibilityRole="button"
              accessibilityLabel="Confirmar conversión"
              accessibilityState={{ disabled: convertBusy, busy: convertBusy }}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
  },
  scrollContentCompact: {
    paddingHorizontal: Spacing.md,
  },

  /* Player lobby header */
  lobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  lobbyHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  playerIdentity: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  avatarFrame: {
    width: 52,
    height: 52,
    position: 'relative',
  },
  playerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
  },
  playerAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.primaryGold,
    backgroundColor: '#17140f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLevelBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryGold,
    borderWidth: 2,
    borderColor: Colors.bgDarker,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLevelText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
  },
  playerCopy: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  playerRank: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginTop: 1,
  },
  headerProgressTrack: {
    height: 3,
    marginTop: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: '#67d9e7',
  },
  wallet: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  currencyPill: {
    minWidth: 104,
    minHeight: Layout.touchTarget,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.22)',
    backgroundColor: 'rgba(10,10,10,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyPillCompact: {
    flex: 1,
  },
  currencyLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  currencyValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 18,
  },

  /* Player showcase */
  showcase: {
    height: 270,
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  showcaseWide: {
    height: 330,
    padding: Spacing.lg,
  },
  showcaseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  showcaseEyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  showcaseSeason: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(5,5,5,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.strengthStrong,
  },
  statusText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  showcaseBottom: {
    maxWidth: 520,
  },
  showcaseRank: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 27,
    letterSpacing: 0.5,
  },
  showcaseQuote: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 3,
  },
  showcaseStats: {
    minHeight: 52,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(5,5,5,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  showcaseStat: {
    flex: 1,
  },
  showcaseStatValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  showcaseStatLabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  showcaseStatDivider: {
    width: 1,
    height: 28,
    marginHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },

  /* Economy operations */
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  operationCard: {
    width: '48.5%',
    minHeight: 112,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.18)',
    backgroundColor: '#121212',
    alignItems: 'flex-start',
  },
  operationCardWide: {
    width: '23.5%',
  },
  operationCardDisabled: {
    opacity: 0.45,
  },
  operationIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(201,170,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  operationTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  operationDescription: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  arenaStrip: {
    minHeight: 76,
    marginTop: 2,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  arenaIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(201,170,113,0.08)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaCopy: {
    flex: 1,
    minWidth: 0,
  },
  arenaTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  arenaDescription: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
    letterSpacing: 1.2,
  },

  syncError: {
    color: Colors.strengthWeak,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  /* Progress Section */
  progressSection: {
    marginBottom: Spacing.xl,
  },
  progressContent: {
    padding: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressEyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  progressTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 17,
  },
  nextLevelBadge: {
    minWidth: 58,
    minHeight: 42,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(201,170,113,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLevelLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  nextLevelValue: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 17,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#67d9e7',
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
