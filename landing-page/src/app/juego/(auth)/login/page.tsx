'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FormMessage, PasswordField, SubmitButton, TextField } from '@/components/juego/AuthFields';
import { AuthShell } from '@/components/juego/auth/AuthShell';
import { AuthDivider, GoogleButton, useGoogleSignIn } from '@/components/juego/auth/GoogleSignIn';
import { parseReturnTo, withReturnTo } from '@/lib/returnTo';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = parseReturnTo(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(
    params.get('registered') === 'verify'
      ? 'Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.'
      : ''
  );
  const google = useGoogleSignIn({
    returnTo,
    onError: (message) => {
      setSuccessMsg('');
      setErrorMsg(message);
    },
  });
  const busy = loading || google.pending;

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
        setErrorMsg(
          'Debes verificar tu correo antes de ingresar. Te enviamos un nuevo enlace. Si prefieres no esperar, entra con Google.'
        );
        return;
      }
      router.replace(returnTo);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      let msg = 'El correo o la contraseña no son correctos.';
      if (code === 'auth/invalid-email') msg = 'El correo no es válido.';
      if (code === 'auth/too-many-requests') msg = 'Demasiados intentos. Espera un momento o entra con Google.';
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

  return (
    <div className="juego-fade-up [--juego-fade-distance:16px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Portal del guerrero</p>
      <h1 className="mt-4 font-title text-[2rem] leading-tight text-white sm:text-[2.4rem]">Vuelve al Valhalla</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">
        Entra con la misma cuenta que usas en la app. Tu progreso te espera.
      </p>

      <div className="mt-9">
        <GoogleButton onClick={google.signIn} pending={google.pending} disabled={busy} />
        <p className="mt-3 text-center text-xs text-white/40">Un clic, sin contraseñas ni correos de verificación.</p>
      </div>

      <AuthDivider>o con tu correo</AuthDivider>

      <form className="flex flex-col gap-5" onSubmit={handleLogin} noValidate>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={busy}
              className="text-xs text-white/45 transition hover:text-gold disabled:opacity-60"
            >
              ¿La olvidaste?
            </button>
          }
        />

        <FormMessage tone="success">{successMsg}</FormMessage>
        <FormMessage tone="error">{errorMsg}</FormMessage>

        <SubmitButton loading={loading}>Ingresar</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-white/50">
        ¿Primera vez aquí?{' '}
        <Link
          href={withReturnTo('/juego/registro', returnTo)}
          className="font-semibold text-gold hover:underline"
        >
          Crea tu cuenta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
