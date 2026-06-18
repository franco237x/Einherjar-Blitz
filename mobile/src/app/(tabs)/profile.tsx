import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { MiniLoader } from '@/components/MiniLoader';

const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onValueChange(!value)}
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Forms
  const [username, setUsername] = useState('');
  const [frase, setFrase] = useState('');
  
  // Settings (Mock)
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setUsername(data.username || '');
            setFrase(data.frase || '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        username,
        frase
      });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <MiniLoader />;
  }

  return (
    <Background>
      <ParticlesBackground />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.pageTitle}>Mi Perfil</Text>

          {/* Centered Profile Header */}
          <GlassCard style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.avatarWrapper}>
                {userData?.avatar ? (
                  <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color={Colors.primaryGold} />
                  </View>
                )}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{userData?.nivel || 1}</Text>
                </View>
              </View>
              
              <Text style={styles.headerName}>{username || 'GUERRERO'}</Text>
              
              <View style={styles.rankBadge}>
                <Ionicons name="shield" size={14} color={Colors.bgDarker} />
                <Text style={styles.rankText}>{userData?.rango || 'INICIADO'}</Text>
              </View>
              
              <Text style={styles.headerEmail}>{auth.currentUser?.email}</Text>
            </View>
          </GlassCard>

          {/* Personalization Section */}
          <Text style={styles.sectionTitle}>Personalización</Text>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOMBRE DE GUERRERO</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ej. Rey Arturo"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                maxLength={20}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FRASE DE BATALLA</Text>
              <TextInput
                style={styles.input}
                value={frase}
                onChangeText={setFrase}
                placeholder="El honor es mi única recompensa..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                maxLength={40}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>{saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>Ajustes</Text>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="musical-notes-outline" size={22} color={Colors.primaryGold} />
                <Text style={styles.settingText}>Música del Reino</Text>
              </View>
              <CustomSwitch value={music} onValueChange={setMusic} />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high-outline" size={22} color={Colors.primaryGold} />
                <Text style={styles.settingText}>Efectos de Sonido</Text>
              </View>
              <CustomSwitch value={sfx} onValueChange={setSfx} />
            </View>
          </GlassCard>

          {/* Danger Zone */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out" size={24} color={Colors.strengthWeak} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
          </TouchableOpacity>

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
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100, // Extra padding for Bottom Nav
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 32,
    marginBottom: Spacing.xl,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  
  /* Centered Header Card */
  headerCard: {
    paddingHorizontal: 0,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(10, 10, 10, 0.4)', // Match index.tsx default glass darkness
    borderColor: 'rgba(212, 175, 55, 0.2)', // Thin, crisp gold border
    borderWidth: 1,
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.lg,
    alignSelf: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: Colors.primaryGold,
    borderWidth: 2,
    borderColor: Colors.bgDarker,
    borderRadius: 16,
    width: 32,
    height: 32,
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
  headerName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 24,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  headerEmail: {
    color: 'rgba(255, 255, 255, 0.85)', // Higher contrast
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
    marginVertical: Spacing.xs,
  },
  rankText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },

  /* Sections */
  sectionTitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(10, 10, 10, 0.4)',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
  },

  /* Sleek Inputs */
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
    borderRadius: Radius.sm,
  },
  
  /* Premium Button */
  saveBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: Colors.primaryGold,
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
    paddingVertical: Spacing.xs,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginVertical: Spacing.md,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    shadowColor: Colors.strengthWeak,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutIcon: {
    textShadowColor: Colors.strengthWeak,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoutText: {
    color: Colors.strengthWeak, // Use a brighter red
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 2,
  },
});
