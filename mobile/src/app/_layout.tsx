import { DarkTheme, DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthProvider } from '@/providers/AuthProvider';
import { UserDataProvider } from '@/providers/UserDataProvider';
import { FEATURE_FLAGS } from '@/config/featureFlags';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function AppRoutes({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
  const { user } = useAuth();
  const { loading: userDataLoading } = useUserData();
  const router = useRouter();
  const didResetAuthenticatedRoute = useRef(false);

  useEffect(() => {
    if (!user) {
      didResetAuthenticatedRoute.current = false;
      return;
    }

    if (!userDataLoading && !didResetAuthenticatedRoute.current) {
      didResetAuthenticatedRoute.current = true;
      router.replace('/(tabs)');
    }
  }, [router, user, userDataLoading]);

  if (user && userDataLoading) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="light" />
        <LoadingScreen message="SINCRONIZANDO PERFIL..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(user)}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(user) && FEATURE_FLAGS.game}>
          <Stack.Screen name="(game)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

function AppNavigator() {
  const colorScheme = useColorScheme();
  const { loading: authLoading } = useAuth();

  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_700Bold,
  });

  useEffect(() => {
    if (!authLoading && fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, fontsLoaded]);

  if (authLoading || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <UserDataProvider>
        <AppRoutes colorScheme={colorScheme} />
      </UserDataProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
