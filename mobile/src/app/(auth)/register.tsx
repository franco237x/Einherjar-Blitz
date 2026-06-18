import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

import { Background } from '@/components/Background';
import { GlassCard } from '@/components/GlassCard';
import { GoldButton } from '@/components/GoldButton';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: username,
        createdAt: new Date(),
        keys: 0,
        spheres: 0,
        avatar: null,
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      let msg = 'Error al registrar usuario.';
      if (error.code === 'auth/email-already-in-use') msg = 'El correo ya está en uso.';
      if (error.code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (error.code === 'auth/weak-password') msg = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      if (error.code === 'auth/operation-not-allowed') msg = 'El registro no está habilitado. Ve a Firebase Console y actívalo.';
      if (error.message && error.message.includes('EMAIL_EXISTS')) msg = 'El correo ya está en uso.';
      if (error.code === 'permission-denied') msg = 'Error de permisos: Asegúrate de crear la base de datos Firestore en modo prueba.';
      console.log('Register Error:', error);
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
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        // Ensure user exists in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          username: user.displayName || 'Guerrero',
          createdAt: new Date(),
          keys: 0,
          spheres: 0,
          avatar: user.photoURL || null,
        }, { merge: true });

        router.replace('/(tabs)');
      } catch (error: any) {
        console.log('Google Login Error:', error);
        setErrorMsg('Error al registrarse con Google.');
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors.textMuted} />
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
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <GoldButton 
                  title="REGISTRARSE" 
                  onPress={handleRegister} 
                  loading={loading} 
                  style={styles.submitBtn} 
                />

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                  <Ionicons name="logo-google" size={20} color={Colors.textPrimary} style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                    <Text style={styles.linkText}>Inicia Sesión</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 42,
    color: Colors.primaryGold,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: Spacing.xs,
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
