import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Barlow_400Regular, Barlow_500Medium, Barlow_700Bold } from '@expo-google-fonts/barlow';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';

import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';

// Prevent native splash screen from hiding until our heavy images are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Preload state
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [testingDelay, setTestingDelay] = useState(true);

  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_700Bold,
  });

  useEffect(() => {
    async function loadResourcesAsync() {
      try {
        // Preload all the heavy background images used in the LoadingScreen
        const imageAssets = [
          require('../../assets/images/loading_screen/argos.jpg'),
          require('../../assets/images/loading_screen/manhattan.jpg'),
          require('../../assets/images/loading_screen/nathan.jpg'),
          require('../../assets/images/loading_screen/orfevre.jpg'),
          require('../../assets/images/logo.jpg'),
        ];
        
        await Asset.loadAsync(imageAssets);
      } catch (e) {
        console.warn('Error preloading assets:', e);
      } finally {
        setAssetsLoaded(true);
        // Hide the native splash screen ONLY when heavy assets are in memory
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAsync();

    // Secondary artificial buffer for the Loading Screen animations
    const timer = setTimeout(() => {
      setTestingDelay(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = authLoading || !fontsLoaded || !assetsLoaded || testingDelay;

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
    return (
      <>
        <StatusBar hidden />
        {Platform.OS === 'android' && <NavigationBar hidden />}
        <LoadingScreen />
      </>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar hidden />
      {Platform.OS === 'android' && <NavigationBar hidden />}
      <Slot />
    </ThemeProvider>
  );
}
