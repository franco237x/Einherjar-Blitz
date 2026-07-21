import React from 'react';
import { useRouter } from 'expo-router';
import { CharacterSelect } from '@/components/game/CharacterSelect';

/**
 * Game module entry: character selection.
 *
 * The OrientationGuard is no longer needed here because the (game) layout
 * locks the device to landscape at the native level. We still render a
 * graceful portrait fallback in case the lock fails (e.g. on web or when
 * the user has rotation locked at the OS level).
 */
export default function GameIndexScreen() {
  const router = useRouter();

  const handleStartBattle = (charId: string) => {
    // Pass the selected character to the battle route via search params.
    // Cast to any because expo-router's typed `Href` map is generated from
    // the file tree and may not include newly-added route groups until the
    // Metro cache is refreshed. Runtime resolution works regardless.
    router.push({
      pathname: '/(game)/battle',
      params: { charId },
    } as any);
  };

  return <CharacterSelect onSelectCharacter={handleStartBattle} />;
}
