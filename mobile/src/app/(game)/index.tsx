import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { GameHub } from '@/components/game/GameHub';

type GameView = 'hub' | 'select';

export default function GameIndexScreen() {
  const router = useRouter();
  const [view, setView] = useState<GameView>('hub');

  const handleStartBattle = (charId: string) => {
    router.push({ pathname: '/(game)/battle', params: { charId } } as any);
  };

  if (view === 'select') {
    return <CharacterSelect onSelectCharacter={handleStartBattle} onCancel={() => setView('hub')} />;
  }

  return (
    <GameHub
      onContinue={() => setView('select')}
      onQuickDuel={() => setView('select')}
      onExit={() => router.replace('/(tabs)/play' as any)}
    />
  );
}
