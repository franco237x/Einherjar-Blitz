import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BattleScreen } from '@/components/game/BattleScreen';
import { GAME_CHARACTERS } from '@/constants/battleData';
import { Colors } from '@/constants/theme';

/**
 * Battle route. Receives the selected character id via search params and
 * renders the BattleScreen. On exit, navigates back to the hub (tabs).
 */
export default function GameBattleScreen() {
  const router = useRouter();
  const { charId } = useLocalSearchParams<{ charId?: string }>();

  // Fallback to argos if the param is missing or invalid — never crash.
  const resolvedCharId =
    typeof charId === 'string' && GAME_CHARACTERS[charId]
      ? charId
      : 'argos';

  const handleExit = () => {
    // Exit back to the hub. Using replace so the back stack doesn't keep
    // the (game) group entries (which would re-trigger the landscape lock).
    router.replace('/(tabs)/play');
  };

  return (
    <View style={styles.container}>
      <BattleScreen charId={resolvedCharId} onExit={handleExit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarker,
  },
});
