import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';

import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Artificial delay for testing LoadingScreen animations
  const [testingDelay, setTestingDelay] = useState(true);

  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_700Bold,
  });

  useEffect(() => {
    // Minimum 2.5s delay to show the loading screen and preload things
    const timer = setTimeout(() => {
      setTestingDelay(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = authLoading || !fontsLoaded || testingDelay;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </ThemeProvider>
  );
}
