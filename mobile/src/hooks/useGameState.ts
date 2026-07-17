/**
 * useGameState — real-time hook for the user's RPG game state.
 *
 * Subscribes to users/{uid}/gameState via onSnapshot.
 * Returns the game state, loading flag, and helper to initialize a new game.
 */

import { useEffect, useState, useCallback } from 'react';
import { auth } from '@/config/firebase';
import {
  streamGameState,
  initGame,
  type GameState,
} from '@/services/gameData';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setGameState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = streamGameState(
      uid,
      (state) => {
        setGameState(state);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useGameState error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const startNewGame = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await initGame(uid);
  }, []);

  return { gameState, loading, error, startNewGame };
}
