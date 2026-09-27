'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firebaseConfig } from '@/config/firebase';
import { Background } from '@/components/juego/Background';
import { GlassCard } from '@/components/juego/GlassCard';
import { GoldButton } from '@/components/juego/GoldButton';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
import { GoogleLogo } from '@/components/juego/Icon';
import { PasswordField, TextField } from '@/components/juego/AuthFields';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (event?: FormEvent) => {
    event?.preventDefault();
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
      const secondaryAuth = getAuth(secondaryApp);
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
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Verification email warning:', (cause as Error)?.message);
        }
      });
      await signOut(secondaryAuth).catch(() => {});
      router.replace('/juego/login?registered=verify');
    } catch (error: unknown) {
      if (createdUser && !profileCreated) {
        await deleteUser(createdUser).catch(() => {});
      }
      const { code, message } = (error ?? {}) as { code?: string; message?: string };
      let msg = 'Error al registrar usuario.';
      if (code === 'auth/email-already-in-use') msg = 'El correo ya está en uso.';
      if (code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      if (code === 'auth/operation-not-allowed') msg = 'El registro no está habilitado.';
      if (message?.includes('EMAIL_EXISTS')) msg = 'El correo ya está en uso.';
      if (code === 'permission-denied') msg = 'Error de permisos en Firestore.';
      if (process.env.NODE_ENV !== 'production') console.log('Register Error:', code);
      setErrorMsg(msg);
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace('/juego');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setErrorMsg('Error al registrarse con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <ParticlesBackground />
      <div className="relative z-10 flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-6">
        <header className="juego-fade-up mb-6 text-center sm:mb-8">
          <h1 className="font-title text-[30px] leading-9 tracking-[0.1em] text-gold sm:text-[38px] sm:leading-[46px]">
            UNIRSE
          </h1>
          <p className="mt-2 text-xs font-medium tracking-[0.2em] text-white/70 sm:text-sm">CREA TU CUENTA</p>
        </header>

        <div className="juego-fade-up mx-auto w-full max-w-[480px] [animation-delay:200ms] [--juego-fade-distance:50px]">
          <GlassCard>
            <form className="flex flex-col gap-4" onSubmit={handleRegister} noValidate>
              <TextField
                label="Nombre de Usuario"
                autoComplete="username"
                autoCapitalize="none"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Correo Electrónico"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PasswordField
                label="Contraseña"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordField
                label="Confirmar Contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {errorMsg ? (
                <p className="text-center text-sm text-red-500" role="alert">
                  {errorMsg}
                </p>
              ) : null}

              <GoldButton type="submit" title="REGISTRARSE" loading={loading} className="mt-2" />

              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading}
                className="flex items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-[15px] font-medium text-white/95 transition hover:bg-white/15 disabled:opacity-60"
              >
                <GoogleLogo />
                Continuar con Google
              </button>

              <p className="mt-2 flex min-h-11 items-center justify-center text-sm text-white/70">
                ¿Ya tienes cuenta?&nbsp;
                <Link href="/juego/login" className="font-bold text-gold hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </form>
          </GlassCard>
        </div>
      </div>
    </Background>
  );
}
