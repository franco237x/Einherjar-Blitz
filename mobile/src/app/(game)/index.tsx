import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { MissionBriefingScreen } from '@/components/game/MissionBriefingScreen';

type GameView = 'briefing' | 'select';

export default function GameIndexScreen() {
  const router = useRouter();
  const [view, setView] = useState<GameView>('briefing');

  const handleBriefingComplete = useCallback(() => {
    setView('select');
  }, []);

  const handleStartBattle = (charId: string) => {
    router.push({ pathname: '/(game)/battle', params: { charId } } as any);
  };

  if (view === 'briefing') {
    return <MissionBriefingScreen onComplete={handleBriefingComplete} />;
  }

  return (
    <CharacterSelect
      onSelectCharacter={handleStartBattle}
      onCancel={() => router.replace('/(tabs)/play' as any)}
    />
  );
}
