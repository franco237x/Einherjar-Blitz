'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Background } from '@/components/juego/Background';
import { GlassCard } from '@/components/juego/GlassCard';
import { GoldButton } from '@/components/juego/GoldButton';
import { ParticlesBackground } from '@/components/juego/ParticlesBackground';
import { GoogleLogo } from '@/components/juego/Icon';
import { PasswordField, TextField } from '@/components/juego/AuthFields';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(
    params.get('registered') === 'verify'
      ? 'Registro exitoso. Revisa tu correo antes de iniciar sesión.'
      : ''
  );

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => {});
        await signOut(auth);
        setErrorMsg('Debes verificar tu correo antes de ingresar. Te enviamos un nuevo enlace.');
        return;
      }
      router.replace('/juego');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      let msg = 'El correo o la contraseña no son correctos.';
      if (code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (code === 'auth/operation-not-allowed') msg = 'Inicio de sesión no habilitado.';
      if (process.env.NODE_ENV !== 'production') console.log('Login Error:', code);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setErrorMsg('');
    setSuccessMsg('');
    if (!normalizedEmail) {
      setErrorMsg('Ingresa tu correo para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    const genericMsg =
      'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar el acceso.';
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setSuccessMsg(genericMsg);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/invalid-email') setErrorMsg('El correo no es válido.');
      else setSuccessMsg(genericMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace('/juego');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setErrorMsg('Error al iniciar sesión con Google.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-6">
      <header className="juego-fade-up mb-6 text-center sm:mb-12">
        <h1 className="font-title text-[30px] leading-[35px] tracking-[0.1em] sm:text-[38px] sm:leading-[46px]">
          <span className="block text-gold">EINHERJAR</span>
          <span className="block text-white/95">BLITZ</span>
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.2em] text-white/70 sm:text-sm">PORTAL DEL GUERRERO</p>
      </header>

      <div className="juego-fade-up mx-auto w-full max-w-[480px] [animation-delay:200ms] [--juego-fade-distance:50px]">
        <GlassCard>
          <h2 className="mb-6 text-center font-title text-xl tracking-wide text-gold">ACCESO AL REINO</h2>

          <form className="flex flex-col gap-4" onSubmit={handleLogin} noValidate>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {successMsg ? (
              <p className="text-center text-sm font-medium text-green-500" aria-live="polite">
                {successMsg}
              </p>
            ) : null}
            {errorMsg ? (
              <p className="text-center text-sm text-red-500" role="alert">
                {errorMsg}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={loading}
              className="min-h-11 self-start text-sm font-bold text-gold hover:underline disabled:opacity-60"
            >
              ¿Olvidaste tu contraseña?
            </button>

            <GoldButton type="submit" title="INGRESAR" loading={loading} className="mt-2" />

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-[15px] font-medium text-white/95 transition hover:bg-white/15 disabled:opacity-60"
            >
              <GoogleLogo />
              Continuar con Google
            </button>

            <p className="mt-2 flex min-h-11 items-center justify-center text-sm text-white/70">
              ¿No tienes cuenta?&nbsp;
              <Link href="/juego/registro" className="font-bold text-gold hover:underline">
                Regístrate
              </Link>
            </p>
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-xs text-white/40">
          <Link href="/" className="hover:text-gold">
            ← Volver a la página principal
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Background>
      <ParticlesBackground />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </Background>
  );
}
