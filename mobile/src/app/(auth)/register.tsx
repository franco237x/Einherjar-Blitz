import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  getAuth,
  initializeAuth,
  signOut,
  deleteUser,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, firebaseConfig } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { GoldButton } from '@/components/GoldButton';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Layout, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_WEB_CLIENT_ID = '618656654443-37njkq2qia9a5qs7393dn4jhtjgihutr.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 360;
  const short = height < 760;
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation values
  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const slideAnimHeader = useRef(new Animated.Value(30)).current;
  const fadeAnimForm = useRef(new Animated.Value(0)).current;
  const slideAnimForm = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnimHeader, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnimHeader, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnimForm, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnimForm, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleRegister = async () => {
    setErrorMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    if (!normalizedEmail || !normalizedUsername || !password || !confirmPassword) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setLoading(true);
    // Use a secondary Firebase app so creating the account does NOT sign the
    // user into the main app (we want them to log in manually afterwards).
    const secondaryApp = initializeApp(firebaseConfig, `Registration-${Date.now()}`);
    let createdUser: User | null = null;
    let profileCreated = false;
    try {
      const secondaryAuth =
        Platform.OS === 'web' ? getAuth(secondaryApp) : initializeAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        normalizedEmail,
        password
      );
      const user = userCredential.user;
      createdUser = user;
      await setDoc(doc(secondaryDb, 'users', user.uid), {
        email: user.email ?? normalizedEmail,
        username: normalizedUsername,
        createdAt: serverTimestamp(),
        keys: 0,
        spheres: 0,
        avatar: null,
        nivel: 1,
        experiencia: 0,
        copas: 0,
        victorias: 0,
        derrotas: 0,
        rango: 'Iniciado',
        horas_jugadas: 0,
        frase: 'Forjando mi destino...',
      });
      profileCreated = true;

      await sendEmailVerification(user).catch((cause) => {
        if (__DEV__) {
          console.warn('Verification email warning:', (cause as Error)?.message);
        }
      });
      await signOut(secondaryAuth).catch(() => {});
      router.replace('/(auth)/login?registered=verify');
    } catch (error: any) {
      if (createdUser && !profileCreated) {
        await deleteUser(createdUser).catch(() => {});
      }
      let msg = 'Error al registrar usuario.';
      if (error.code === 'auth/email-already-in-use') msg = 'El correo ya está en uso.';
      if (error.code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (error.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      if (error.code === 'auth/operation-not-allowed') msg = 'El registro no está habilitado.';
      if (error.message?.includes('EMAIL_EXISTS')) msg = 'El correo ya está en uso.';
      if (error.code === 'permission-denied') msg = 'Error de permisos en Firestore.';
      if (__DEV__) console.log('Register Error:', error?.code);
      setErrorMsg(msg);
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');
    if (Platform.OS === 'web') {
      try {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace('/(tabs)');
      } catch (error: any) {
        if (__DEV__) console.log('Google Register Error:', error?.code);
        setErrorMsg('Error al registrarse con Google.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result: any = await GoogleSignin.signIn();
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) {
        setLoading(false);
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (__DEV__) console.log('Google Register Error:', error?.code);
      if (error?.code !== 'SIGN_IN_CANCELLED' && error?.code !== '-5') {
        setErrorMsg('Error al registrarse con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <ParticlesBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            compact && styles.containerCompact,
            short && styles.containerShort,
            { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.lg }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              short && styles.headerShort,
              { opacity: fadeAnimHeader, transform: [{ translateY: slideAnimHeader }] },
            ]}
          >
            <Text style={[styles.title, compact && styles.titleCompact]}>UNIRSE</Text>
            <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
              CREA TU CUENTA
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formShell,
              { opacity: fadeAnimForm, transform: [{ translateY: slideAnimForm }] },
            ]}
          >
            <GlassCard style={styles.card}>
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de Usuario"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username-new"
                  textContentType="username"
                  returnKeyType="next"
                  maxLength={20}
                  accessibilityLabel="Nombre de usuario"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo Electrónico"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="Correo electrónico"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Contraseña"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    accessibilityLabel="Contraseña"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirmar Contraseña"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    accessibilityLabel="Confirmar contraseña"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {errorMsg ? (
                  <Text style={styles.errorText} accessibilityRole="alert">
                    {errorMsg}
                  </Text>
                ) : null}

                <GoldButton
                  title="REGISTRARSE"
                  onPress={handleRegister}
                  loading={loading}
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleRegister}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continuar con Google"
                  accessibilityState={{ disabled: loading }}
                >
                  <Ionicons name="logo-google" size={20} color={Colors.textPrimary} style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/login')}
                    accessibilityRole="link"
                    accessibilityLabel="Iniciar sesión"
                  >
                    <Text style={styles.linkText}>Inicia sesión</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  containerCompact: {
    paddingHorizontal: Spacing.md,
  },
  containerShort: {
    justifyContent: 'flex-start',
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  headerShort: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 38,
    color: Colors.primaryGold,
    letterSpacing: 4,
    lineHeight: 46,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginTop: Spacing.sm,
  },
  subtitleCompact: {
    fontSize: 12,
    letterSpacing: 2,
  },
  formShell: {
    width: '100%',
    maxWidth: Layout.authMaxWidth,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: Colors.borderGold,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: Colors.borderGold,
    borderRadius: Radius.md,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  eyeIcon: {
    padding: Spacing.md,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  googleIcon: {
    marginRight: Spacing.xs,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    minHeight: Layout.touchTarget,
  },
  footerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
});
