'use client';

import { useEffect, type PropsWithChildren } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider } from '@/providers/AuthProvider';
import { UserDataProvider } from '@/providers/UserDataProvider';
import { DialogProvider } from '@/providers/DialogProvider';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { LoadingScreen } from './LoadingScreen';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { parseReturnTo } from '@/lib/returnTo';

const AUTH_ROUTES = ['/juego/login', '/juego/registro'];
const GAME_ROUTE_PREFIX = '/juego/combate';

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Route guard — mirrors the Stack.Protected groups of the mobile app:
 *   - signed out  → only /juego/login and /juego/registro
 *   - signed in   → the lobby tabs (and the battle module when enabled)
 */
function RouteGuard({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const { loading: userDataLoading } = useUserData();
  const pathname = usePathname();
  const router = useRouter();

  const onAuthRoute = isAuthRoute(pathname);
  const onGameRoute = pathname.startsWith(GAME_ROUTE_PREFIX);
  const returnTo =
    onAuthRoute && typeof window !== 'undefined'
      ? parseReturnTo(new URLSearchParams(window.location.search).get('next'))
      : '/juego';

  let redirectTo: string | null = null;
  if (!authLoading) {
    if (!user && !onAuthRoute) redirectTo = '/juego/login';
    else if (user && onAuthRoute) redirectTo = returnTo;
    else if (user && onGameRoute && !FEATURE_FLAGS.game) redirectTo = '/juego';
  }

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (authLoading || redirectTo) {
    return <LoadingScreen />;
  }

  if (user && userDataLoading) {
    return <LoadingScreen message="SINCRONIZANDO PERFIL..." />;
  }

  return children;
}

export function JuegoProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <UserDataProvider>
        <DialogProvider>
          <RouteGuard>{children}</RouteGuard>
        </DialogProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
