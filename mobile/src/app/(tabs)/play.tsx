import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Background } from '@/components/Background';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Play tab — launcher for the game module.
 *
 * The actual battle experience lives in the isolated (game) route group,
 * which locks the device to landscape and hides the tab bar. This tab is
 * just a portrait-mode entry point with a "Enter Combat" button.
 */
export default function PlayScreen() {
  if (!FEATURE_FLAGS.game) {
    return <Redirect href="/(tabs)" />;
  }

  return <PlayLauncher />;
}

function PlayLauncher() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEnterGame = () => {
    // Cast to any: expo-router's typed Href map is generated from the file
    // tree and may not pick up newly-added route groups until the Metro
    // cache is refreshed. Runtime resolution works regardless.
    router.push('/(game)' as any);
  };

  return (
    <Background>
      <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="game-controller" size={64} color={Colors.primaryGold} />
          </View>

          <Text style={styles.title}>MODO COMBATE</Text>
          <Text style={styles.subtitle}>
            Enfrenta al Rey Escarlata con tu campeón.{'\n'}
            El juego se rotará a horizontal automáticamente.
          </Text>

          <TouchableOpacity
            style={styles.enterBtn}
            activeOpacity={0.85}
            onPress={handleEnterGame}
          >
            <Ionicons name="game-controller" size={22} color={Colors.bgDarker} />
            <Text style={styles.enterBtnText}>ENTRAR AL COMBATE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 170, 113, 0.12)',
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryGold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGold,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  enterBtnText: {
    fontFamily: Fonts.title,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.bgDarker,
    letterSpacing: 1,
  },
});
