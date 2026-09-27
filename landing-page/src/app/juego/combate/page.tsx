'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CharacterSelect } from '@/components/juego/game/CharacterSelect';
import { MissionBriefingScreen } from '@/components/juego/game/MissionBriefingScreen';

type GameView = 'briefing' | 'select';

export default function GameIndexPage() {
  const router = useRouter();
  const [view, setView] = useState<GameView>('briefing');

  const handleBriefingComplete = useCallback(() => setView('select'), []);

  if (view === 'briefing') {
    return <MissionBriefingScreen onComplete={handleBriefingComplete} />;
  }

  return (
    <CharacterSelect
      onSelectCharacter={(charId) => router.push(`/juego/combate/batalla?charId=${encodeURIComponent(charId)}`)}
      onCancel={() => router.replace('/juego/jugar')}
    />
  );
}
