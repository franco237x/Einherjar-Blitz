'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendEmailVerification,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebase';
import { FormMessage, PasswordField, SubmitButton, TextField } from '@/components/juego/AuthFields';
import { AuthShell } from '@/components/juego/auth/AuthShell';
import { GoogleBenefits, GoogleButton, useGoogleSignIn } from '@/components/juego/auth/GoogleSignIn';
import { cn } from '@/lib/utils';
import { parseReturnTo, withReturnTo } from '@/lib/returnTo';

const GOOGLE_BENEFITS = [
  'Entras al instante, sin esperar un correo de verificación.',
  'Sin contraseñas nuevas que recordar.',
  'Tu nombre y foto de Google se usan de inicio; puedes cambiarlos en tu perfil.',
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = parseReturnTo(params.get('next'));
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleError, setGoogleError] = useState('');
  const google = useGoogleSignIn({ onError: setGoogleError, returnTo });
  const busy = loading || google.pending;

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
      router.replace(withReturnTo('/juego/login?registered=verify', returnTo));
    } catch (error: unknown) {
      if (createdUser && !profileCreated) {
        await deleteUser(createdUser).catch(() => {});
      }
      const { code, message } = (error ?? {}) as { code?: string; message?: string };
      let msg = 'Error al registrar usuario.';
      if (code === 'auth/email-already-in-use') msg = 'El correo ya está en uso. Inicia sesión o entra con Google.';
      if (code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      if (code === 'auth/operation-not-allowed') msg = 'El registro no está habilitado.';
      if (message?.includes('EMAIL_EXISTS')) msg = 'El correo ya está en uso. Inicia sesión o entra con Google.';
      if (code === 'permission-denied') msg = 'Error de permisos en Firestore.';
      if (process.env.NODE_ENV !== 'production') console.log('Register Error:', code);
      setErrorMsg(msg);
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="juego-fade-up [--juego-fade-distance:16px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Nueva cuenta</p>
        <h1 className="mt-4 font-title text-[2rem] leading-tight text-white sm:text-[2.4rem]">Únete a los Einherjar</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">
          Una sola cuenta para la app y el navegador. Crearla es gratis.
        </p>

        <div className="mt-9">
          <GoogleButton onClick={google.signIn} pending={google.pending} disabled={busy} label="Crear cuenta con Google" />
          <GoogleBenefits items={GOOGLE_BENEFITS} />
          {googleError ? (
            <div className="mt-5">
              <FormMessage tone="error">{googleError}</FormMessage>
            </div>
          ) : null}
        </div>

        <div className="mt-9 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setShowEmailForm((open) => !open)}
            aria-expanded={showEmailForm}
            aria-controls="email-register"
            className="flex w-full items-center justify-between text-sm text-white/55 transition hover:text-white/85"
          >
            Prefiero registrarme con correo y contraseña
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', showEmailForm && 'rotate-180')} />
          </button>

          <AnimatePresence initial={false}>
            {showEmailForm ? (
              <motion.div
                id="email-register"
                key="email-register"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <form className="flex flex-col gap-5 pt-6" onSubmit={handleRegister} noValidate>
                  <TextField
                    label="Nombre de usuario"
                    autoComplete="username"
                    autoCapitalize="none"
                    maxLength={20}
                    placeholder="Cómo te verán otros jugadores"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <TextField
                    label="Correo electrónico"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <PasswordField
                    label="Contraseña"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <PasswordField
                    label="Confirmar contraseña"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <FormMessage tone="error">{errorMsg}</FormMessage>

                  <SubmitButton loading={loading}>Crear cuenta</SubmitButton>
                  <p className="text-center text-xs text-white/40">
                    Te enviaremos un correo para verificar la dirección antes de tu primer ingreso.
                  </p>
                </form>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="mt-9 text-center text-sm text-white/50">
          ¿Ya tienes cuenta?{' '}
          <Link
            href={withReturnTo('/juego/login', returnTo)}
            className="font-semibold text-gold hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
