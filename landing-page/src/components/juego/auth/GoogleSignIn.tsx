'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Check } from 'lucide-react';
import { auth } from '@/config/firebase';
import { GoogleLogo } from '@/components/juego/Icon';
import { Spinner } from '@/components/juego/Spinner';

const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

function googleErrorMessage(code: string | undefined) {
  switch (code) {
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con ese correo. Entra con tu correo y contraseña.';
    case 'auth/unauthorized-domain':
      return 'El acceso con Google todavía no está habilitado en este dominio.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu red e inténtalo de nuevo.';
    default:
      return 'No pudimos conectar con Google. Inténtalo de nuevo.';
  }
}

/**
 * Google sign-in. New Google users get their profile created automatically by
 * UserDataProvider, so this is also the fastest way to register.
 */
export function useGoogleSignIn({
  onError,
  returnTo = '/juego',
}: {
  onError: (message: string) => void;
  returnTo?: '/juego' | '/evento/agro';
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    onError('');
    setPending(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      router.replace(returnTo);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (!code || !SILENT_CODES.has(code)) onError(googleErrorMessage(code));
      if (process.env.NODE_ENV !== 'production') console.log('Google Sign-In Error:', code);
      setPending(false);
    }
  };

  return { signIn, pending };
}

export function GoogleButton({
  onClick,
  pending,
  disabled,
  label = 'Continuar con Google',
}: {
  onClick: () => void;
  pending: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className="group relative flex min-h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-white px-6 text-[15px] font-semibold text-[#1f1f1f] shadow-[0_8px_30px_-12px_rgba(201,170,113,0.45)] transition hover:bg-[#f3efe7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? <Spinner className="text-[#1f1f1f]" /> : <GoogleLogo size={20} />}
      {label}
      <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-foreground">
        Recomendado
      </span>
    </button>
  );
}

export function GoogleBenefits({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-white/60">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AuthDivider({ children }: { children: string }) {
  return (
    <div className="my-8 flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-white/35">
      <span className="h-px flex-1 bg-white/10" />
      {children}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
