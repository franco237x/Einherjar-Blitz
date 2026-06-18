import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { GoldButton } from '@/components/GoldButton';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

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

  useEffect(() => {
    // Staggered entrance animation
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
      if (error.code === 'auth/operation-not-allowed') msg = 'El inicio de sesión no está habilitado. Ve a Firebase Console y actívalo.';
      if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) msg = 'El correo o la contraseña son incorrectos.';
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
      Alert.alert('Info', 'El login de Google nativo requiere configurar el Client ID en la consola de Google Cloud. Módulo en desarrollo.');
    }
  };

  return (
    <Background>
      <ParticlesBackground />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnimHeader, transform: [{ translateY: slideAnimHeader }] }]}>
          <Text style={styles.title}>EINHERJAR</Text>
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
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <GoldButton 
                title="INGRESAR" 
                onPress={handleLogin} 
                loading={loading} 
                style={styles.submitBtn} 
              />

              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
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
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 42,
    color: Colors.primaryGold,
    letterSpacing: 2,
    lineHeight: 48,
  },
  titleBlitz: {
    fontFamily: Fonts.title,
    fontSize: 42,
    color: Colors.textPrimary,
    letterSpacing: 2,
    lineHeight: 48,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 1,
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
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  googleIcon: {
    marginRight: Spacing.sm,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
    marginTop: Spacing.xs,
    textShadowColor: 'rgba(255, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
  },
  linkText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
  },
});
