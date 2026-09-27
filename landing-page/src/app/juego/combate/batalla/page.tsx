'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BattleScreen } from '@/components/juego/game/BattleScreen';
import { GAME_CHARACTERS } from '@/constants/battleData';

function Battle() {
  const router = useRouter();
  const charId = useSearchParams().get('charId');

  // Fallback to argos if the param is missing or invalid — never crash.
  const resolvedCharId = charId && GAME_CHARACTERS[charId] ? charId : 'argos';

  // replace() so the back button doesn't return to a finished battle.
  return <BattleScreen charId={resolvedCharId} onExit={() => router.replace('/juego/jugar')} />;
}

export default function GameBattlePage() {
  return (
    <Suspense fallback={null}>
      <Battle />
    </Suspense>
  );
}
