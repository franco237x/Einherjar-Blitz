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
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { GoldButton } from '@/components/GoldButton';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '618656654443-37njkq2qia9a5qs7393dn4jhtjgihutr.apps.googleusercontent.com';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation values
  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const slideAnimHeader = useRef(new Animated.Value(30)).current;
  const fadeAnimForm = useRef(new Animated.Value(0)).current;
  const slideAnimForm = useRef(new Animated.Value(50)).current;

  // Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
  });

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

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        setLoading(true);
        signInWithCredential(auth, credential)
          .then(() => router.replace('/(tabs)'))
          .catch((err) => {
            console.log('Google credential error:', err);
            setErrorMsg('Error al autenticar con Google.');
          })
          .finally(() => setLoading(false));
      }
    } else if (response?.type === 'error') {
      setErrorMsg('Error al iniciar sesión con Google.');
    }
  }, [response]);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let msg = 'Error al iniciar sesión.';
      if (error.code === 'auth/invalid-credential') msg = 'Credenciales inválidas.';
      if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
      if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta.';
      if (error.code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (error.code === 'auth/operation-not-allowed') msg = 'Inicio de sesión no habilitado.';
      if (error.message?.includes('INVALID_LOGIN_CREDENTIALS')) msg = 'El correo o la contraseña son incorrectos.';
      console.log('Login Error:', error);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      try {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace('/(tabs)');
      } catch (error: any) {
        console.log('Google Login Error:', error);
        setErrorMsg('Error al iniciar sesión con Google.');
        setLoading(false);
      }
    } else {
      await promptAsync();
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
            <Text style={styles.title}>EINHERJER</Text>
            <Text style={styles.titleBlitz}>BLITZ</Text>
            <Text style={styles.subtitle}>PORTAL DEL GUERRERO</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnimForm, transform: [{ translateY: slideAnimForm }] }}>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>ACCESO AL REINO</Text>
              </View>

              <View style={styles.form}>
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

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <GoldButton
                  title="INGRESAR"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleLogin}
                  disabled={loading || (!request && Platform.OS !== 'web')}
                >
                  <Ionicons name="logo-google" size={20} color={Colors.textPrimary} style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.linkText}>Regístrate</Text>
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
  },
  header: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 38,
    color: Colors.primaryGold,
    letterSpacing: 4,
    lineHeight: 46,
  },
  titleBlitz: {
    fontFamily: Fonts.title,
    fontSize: 38,
    color: Colors.textPrimary,
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
  cardHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Fonts.title,
    color: Colors.primaryGold,
    fontSize: 20,
    letterSpacing: 1,
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
