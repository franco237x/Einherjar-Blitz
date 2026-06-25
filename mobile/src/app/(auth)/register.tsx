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
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db, firebaseConfig } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { GoldButton } from '@/components/GoldButton';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_WEB_CLIENT_ID = '618656654443-37njkq2qia9a5qs7393dn4jhtjgihutr.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

export default function RegisterScreen() {
  const router = useRouter();
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
    if (!email || !username || !password || !confirmPassword) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    // Use a secondary Firebase app so creating the account does NOT sign the
    // user into the main app (we want them to log in manually afterwards).
    const secondaryApp = initializeApp(firebaseConfig, `Registration-${Date.now()}`);
    try {
      const secondaryAuth =
        Platform.OS === 'web' ? getAuth(secondaryApp) : initializeAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const user = userCredential.user;
      await setDoc(doc(secondaryDb, 'users', user.uid), {
        email: user.email,
        username: username,
        createdAt: new Date(),
        keys: 0,
        spheres: 0,
        avatar: null,
      });

      await signOut(secondaryAuth).catch(() => {});
      // Send them to login with a success flag — the main session stays logged out.
      router.replace('/(auth)/login?registered=1');
    } catch (error: any) {
      let msg = 'Error al registrar usuario.';
      if (error.code === 'auth/email-already-in-use') msg = 'El correo ya está en uso.';
      if (error.code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (error.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      if (error.code === 'auth/operation-not-allowed') msg = 'El registro no está habilitado.';
      if (error.message?.includes('EMAIL_EXISTS')) msg = 'El correo ya está en uso.';
      if (error.code === 'permission-denied') msg = 'Error de permisos en Firestore.';
      console.log('Register Error:', error);
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
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        await setDoc(
          doc(db, 'users', user.uid),
          {
            email: user.email,
            username: user.displayName || 'Guerrero',
            createdAt: new Date(),
            keys: 0,
            spheres: 0,
            avatar: user.photoURL || null,
          },
          { merge: true }
        );
        router.replace('/(tabs)');
      } catch (error: any) {
        console.log('Google Register Error:', error);
        setErrorMsg('Error al registrarse con Google.');
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
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email,
          username: user.displayName || 'Guerrero',
          createdAt: new Date(),
          keys: 0,
          spheres: 0,
          avatar: user.photoURL || null,
        },
        { merge: true }
      );
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('Google Register Error:', error?.code, error?.message);
      if (error?.code !== 'SIGN_IN_CANCELLED' && error?.code !== '-5') {
        setErrorMsg('Error al registrarse con Google.');
      }
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
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnimHeader, transform: [{ translateY: slideAnimHeader }] }]}>
            <Text style={styles.title}>UNIRSE</Text>
            <Text style={styles.subtitle}>CREA TU CUENTA</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnimForm, transform: [{ translateY: slideAnimForm }] }}>
            <GlassCard style={styles.card}>
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de Usuario"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo Electrónico"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Contraseña"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
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
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

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
                >
                  <Ionicons name="logo-google" size={20} color={Colors.textPrimary} style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
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
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 38,
    color: Colors.primaryGold,
    letterSpacing: 4,
    lineHeight: 46,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginTop: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.sm,
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
