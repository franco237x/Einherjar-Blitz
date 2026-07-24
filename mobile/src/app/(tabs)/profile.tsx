import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Layout, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { MiniLoader } from '@/components/MiniLoader';
import { LobbyPageHeader } from '@/components/LobbyPageHeader';
import { useUserData } from '@/hooks/useUserData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomSwitch = ({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={[
        styles.switchTrack, 
        value ? styles.switchTrackActive : styles.switchTrackInactive
      ]}
    >
      <View style={[styles.switchThumb, value ? styles.switchThumbActive : styles.switchThumbInactive]} />
      {value && <View style={styles.switchGlow} />}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 390;
  const wide = screenWidth >= 720;
  const { userData, loading, error: userDataError } = useUserData();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  
  // Forms
  const [username, setUsername] = useState('');
  const [frase, setFrase] = useState('');
  
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    void AsyncStorage.getItem(`preferences:${uid}`)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as { music?: boolean; sfx?: boolean };
          if (typeof parsed.music === 'boolean') setMusic(parsed.music);
          if (typeof parsed.sfx === 'boolean') setSfx(parsed.sfx);
        }
      })
      .catch((cause) => {
        if (__DEV__) console.warn('Preferences load error:', (cause as Error)?.message);
      })
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !settingsLoaded) return;
    void AsyncStorage.setItem(
      `preferences:${uid}`,
      JSON.stringify({ music, sfx })
    ).catch((cause) => {
      if (__DEV__) console.warn('Preferences save error:', (cause as Error)?.message);
    });
  }, [music, sfx, settingsLoaded]);

  // Sync form state when userData loads/changes
  useEffect(() => {
    if (userData) {
      setUsername(userData.username || '');
      setFrase(userData.frase || '');
    }
  }, [userData]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    const normalizedUsername = username.trim();
    const normalizedPhrase = frase.trim();
    if (!normalizedUsername) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre de guerrero válido.');
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        username: normalizedUsername,
        frase: normalizedPhrase,
      });
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
    } catch (error) {
      if (__DEV__) console.error('Error saving profile:', (error as Error)?.message);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!auth.currentUser) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para elegir un avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const pickedUri = result.assets[0].uri;

    setUploadingAvatar(true);
    try {
      // Keep the private profile document small on the Spark plan.
      // This prevents exceeding Firestore's 1MB document limit.
      // Uses the new SDK 56 ImageManipulator API (non-deprecated).
      const context = ImageManipulator.ImageManipulator.manipulate(pickedUri);
      context.resize({ width: 128, height: 128 });
      const renderedImage = await context.renderAsync();
      const result = await renderedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.2,
        base64: true,
      });

      if (!result.base64) {
        throw new Error('No se pudo codificar la imagen.');
      }

      const dataUri = `data:image/jpeg;base64,${result.base64}`;
      if (dataUri.length > 150000) {
        throw new Error('La imagen resultante es demasiado grande.');
      }
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { avatar: dataUri });
      Alert.alert('Avatar actualizado', 'Tu nuevo avatar se guardó correctamente.');
    } catch (error) {
      if (__DEV__) console.error('Error uploading avatar:', (error as Error)?.message);
      Alert.alert('Error', 'No se pudo actualizar el avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const performLogout = async () => {
    setSecurityMessage(null);
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      if (__DEV__) console.error('Error logging out:', (error as Error)?.message);
      setSecurityMessage({ type: 'error', text: 'No se pudo cerrar la sesión.' });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('¿Quieres cerrar la sesión?')) {
        void performLogout();
      }
      return;
    }
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void performLogout() },
    ]);
  };

  const handlePasswordChange = async () => {
    setSecurityMessage(null);
    const currentUser = auth.currentUser;
    const email = currentUser?.email;
    if (!email) {
      setSecurityMessage({
        type: 'error',
        text: 'Esta cuenta no tiene un correo asociado.',
      });
      return;
    }
    if (!currentUser.providerData.some((provider) => provider.providerId === 'password')) {
      setSecurityMessage({
        type: 'info',
        text: 'Esta cuenta utiliza Google. La contraseña se administra desde Google.',
      });
      return;
    }
    setSecurityBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSecurityMessage({
        type: 'success',
        text: `Enviamos el enlace para cambiar la contraseña a ${email}.`,
      });
    } catch (error) {
      if (__DEV__) console.error('Password change error:', (error as Error)?.message);
      setSecurityMessage({
        type: 'error',
        text: 'No se pudo enviar el correo para cambiar la contraseña.',
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  if (loading) {
    return <MiniLoader />;
  }

  const totalBattles = (userData?.victorias || 0) + (userData?.derrotas || 0);
  const winrate =
    totalBattles > 0
      ? Math.round(((userData?.victorias || 0) / totalBattles) * 100)
      : 0;

  return (
    <Background>
      <ParticlesBackground />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
            {
              paddingTop: insets.top + Spacing.md,
              paddingBottom: insets.bottom + 88,
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LobbyPageHeader
            eyebrow="IDENTIDAD DEL JUGADOR"
            title="Perfil y ajustes"
            subtitle="Administra tu identidad, preferencias y seguridad."
            badges={[
              { icon: 'key-outline', label: 'LLAVES', value: userData?.keys || 0 },
              {
                icon: 'planet-outline',
                label: 'ESFERAS',
                value: userData?.spheres || 0,
                color: '#7ed9e7',
              },
            ]}
          />

          {userDataError ? (
            <Text style={styles.syncError} accessibilityRole="alert">
              No se pudo sincronizar tu perfil. Comprueba tu conexión.
            </Text>
          ) : null}

          <GlassCard
            style={styles.headerCard}
            contentStyle={[styles.headerContent, wide && styles.headerContentWide]}
          >
            <View style={styles.identityBlock}>
              <View style={styles.avatarWrapper}>
                {uploadingAvatar ? (
                  <View style={styles.avatar}>
                    <MiniLoader />
                  </View>
                ) : userData?.avatar ? (
                  <Image
                    source={{ uri: userData.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                    accessibilityLabel={`Avatar de ${username || 'Guerrero'}`}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={42} color={Colors.primaryGold} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar || Boolean(userDataError)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar avatar"
                  accessibilityState={{
                    disabled: uploadingAvatar || Boolean(userDataError),
                    busy: uploadingAvatar,
                  }}
                >
                  <Ionicons name="camera" size={16} color={Colors.bgDarker} />
                </TouchableOpacity>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{userData?.nivel || 1}</Text>
                </View>
              </View>

              <View style={styles.identityCopy}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {username || 'GUERRERO'}
                </Text>
                <View style={styles.rankBadge}>
                  <Ionicons name="shield" size={13} color={Colors.bgDarker} />
                  <Text style={styles.rankText}>{userData?.rango || 'INICIADO'}</Text>
                </View>
                <Text style={styles.headerEmail} numberOfLines={1}>
                  {auth.currentUser?.email}
                </Text>
                <Text style={styles.profileQuote} numberOfLines={2}>
                  {frase || 'Forjando mi destino...'}
                </Text>
              </View>
            </View>

            <View style={[styles.profileStats, wide && styles.profileStatsWide]}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{userData?.nivel || 1}</Text>
                <Text style={styles.profileStatLabel}>NIVEL</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{userData?.copas || 0}</Text>
                <Text style={styles.profileStatLabel}>COPAS</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{winrate}%</Text>
                <Text style={styles.profileStatLabel}>WINRATE</Text>
              </View>
            </View>
          </GlassCard>

          <View style={[styles.contentColumns, wide && styles.contentColumnsWide]}>
            <View style={[styles.contentColumn, wide && styles.contentColumnWide]}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Personalización</Text>
                <Text style={styles.sectionSubtitle}>Cómo te verán los demás</Text>
              </View>

              <GlassCard style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOMBRE DE GUERRERO</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Ej. Rey Arturo"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={20}
                    autoCapitalize="words"
                    accessibilityLabel="Nombre de guerrero"
                  />
                  <Text style={styles.characterCount}>{username.length}/20</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FRASE DE PERFIL</Text>
                  <TextInput
                    style={[styles.input, styles.phraseInput]}
                    value={frase}
                    onChangeText={setFrase}
                    placeholder="El honor es mi única recompensa..."
                    placeholderTextColor={Colors.textMuted}
                    maxLength={40}
                    multiline
                    accessibilityLabel="Frase de perfil"
                  />
                  <Text style={styles.characterCount}>{frase.length}/40</Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, (saving || userDataError) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving || Boolean(userDataError)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: saving || Boolean(userDataError),
                    busy: saving,
                  }}
                >
                  <Ionicons name="save-outline" size={18} color={Colors.bgDarker} />
                  <Text style={styles.saveBtnText}>
                    {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            </View>

            <View style={[styles.contentColumn, wide && styles.contentColumnWide]}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Preferencias</Text>
                <Text style={styles.sectionSubtitle}>Experiencia en este dispositivo</Text>
              </View>
              <GlassCard style={styles.sectionCard} contentStyle={styles.sectionCardContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingIcon}>
                      <Ionicons name="musical-notes-outline" size={20} color={Colors.primaryGold} />
                    </View>
                    <View>
                      <Text style={styles.settingText}>Música</Text>
                      <Text style={styles.settingDescription}>Ambiente del lobby y combate</Text>
                    </View>
                  </View>
                  <CustomSwitch value={music} onValueChange={setMusic} label="Música" />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingIcon}>
                      <Ionicons name="volume-high-outline" size={20} color={Colors.primaryGold} />
                    </View>
                    <View>
                      <Text style={styles.settingText}>Efectos</Text>
                      <Text style={styles.settingDescription}>Sonidos de acciones y recompensas</Text>
                    </View>
                  </View>
                  <CustomSwitch value={sfx} onValueChange={setSfx} label="Efectos de sonido" />
                </View>
              </GlassCard>

              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Cuenta y seguridad</Text>
                <Text style={styles.sectionSubtitle}>Acciones sensibles de tu cuenta</Text>
              </View>
              <GlassCard style={styles.sectionCard} contentStyle={styles.accountCardContent}>
                <TouchableOpacity
                  style={styles.accountAction}
                  onPress={handlePasswordChange}
                  disabled={securityBusy}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar contraseña"
                  accessibilityState={{ disabled: securityBusy, busy: securityBusy }}
                >
                  <View style={styles.accountActionIcon}>
                    {securityBusy ? (
                      <ActivityIndicator size="small" color={Colors.primaryGold} />
                    ) : (
                      <Ionicons name="key-outline" size={20} color={Colors.primaryGold} />
                    )}
                  </View>
                  <View style={styles.accountActionCopy}>
                    <Text style={styles.accountActionTitle}>Cambiar contraseña</Text>
                    <Text style={styles.accountActionDescription}>
                      Recibe un enlace seguro por correo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {securityMessage ? (
                  <Text
                    style={[
                      styles.securityMessage,
                      securityMessage.type === 'success'
                        ? styles.securityMessageSuccess
                        : securityMessage.type === 'error'
                          ? styles.securityMessageError
                          : styles.securityMessageInfo,
                    ]}
                    accessibilityLiveRegion="polite"
                  >
                    {securityMessage.text}
                  </Text>
                ) : null}

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.accountAction}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar sesión"
                >
                  <View style={[styles.accountActionIcon, styles.logoutActionIcon]}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.strengthWeak} />
                  </View>
                  <View style={styles.accountActionCopy}>
                    <Text style={[styles.accountActionTitle, styles.logoutText]}>
                      Cerrar sesión
                    </Text>
                    <Text style={styles.accountActionDescription}>
                      Salir de esta cuenta en el dispositivo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </GlassCard>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },
  scrollContentCompact: {
    paddingHorizontal: Spacing.md,
  },
  syncError: {
    color: Colors.strengthWeak,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  
  headerCard: {
    marginBottom: Spacing.xl,
    backgroundColor: '#121212',
    borderColor: Colors.borderGold,
  },
  headerContent: {
    gap: Spacing.lg,
  },
  headerContentWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: -3,
    left: -3,
    backgroundColor: Colors.primaryGold,
    borderWidth: 2,
    borderColor: Colors.bgDarker,
    borderRadius: 16,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  levelBadgeText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: Colors.primaryGold,
    borderWidth: 2,
    borderColor: Colors.bgDarker,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 3,
  },
  headerName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 23,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  headerEmail: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
    alignSelf: 'flex-start',
  },
  rankText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  profileQuote: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  profileStats: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(5,5,5,0.55)',
    paddingHorizontal: Spacing.sm,
  },
  profileStatsWide: {
    width: 330,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 19,
  },
  profileStatLabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  /* Sections */
  contentColumns: {
    gap: Spacing.lg,
  },
  contentColumnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentColumn: {
    minWidth: 0,
  },
  contentColumnWide: {
    flex: 1,
  },
  sectionHeading: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: Spacing.xl,
    backgroundColor: '#121212',
  },
  sectionCardContent: {
    padding: Spacing.lg,
  },
  accountCardContent: {
    padding: Spacing.md,
  },

  /* Sleek Inputs */
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
    borderRadius: Radius.sm,
  },
  phraseInput: {
    minHeight: 76,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },

  saveBtn: {
    minHeight: 48,
    backgroundColor: Colors.primaryGold,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
  },

  /* Custom Switch */
  switchTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1,
    position: 'relative',
  },
  switchTrackActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: Colors.primaryGold,
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  switchTrackInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
  },
  switchThumbActive: {
    backgroundColor: Colors.primaryGold,
    alignSelf: 'flex-end',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  switchThumbInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-start',
  },
  switchGlow: {
    position: 'absolute',
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.lightGold,
    opacity: 0.5,
    zIndex: 1,
  },

  /* Settings */
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  settingInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(201,170,113,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  settingDescription: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginVertical: Spacing.md,
  },

  /* Account */
  accountAction: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
  },
  accountActionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(201,170,113,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  accountActionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  accountActionDescription: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  securityMessage: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  securityMessageSuccess: {
    color: '#81c784',
  },
  securityMessageError: {
    color: Colors.strengthWeak,
  },
  securityMessageInfo: {
    color: Colors.textSecondary,
  },
  logoutActionIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  logoutText: {
    color: Colors.strengthWeak,
  },
});
