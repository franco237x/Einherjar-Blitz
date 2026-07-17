/**
 * useGameCharacters — real-time hook for the user's RPG characters.
 *
 * Subscribes to users/{uid}/gameCharacters via onSnapshot.
 * Returns the list of character docs with their current level/HP/MP.
 */

import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import {
  streamGameCharacters,
  type GameCharacterDoc,
} from '@/services/gameData';

export function useGameCharacters() {
  const [characters, setCharacters] = useState<GameCharacterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = streamGameCharacters(
      uid,
      (chars) => {
        setCharacters(chars);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useGameCharacters error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { characters, loading, error };
}
