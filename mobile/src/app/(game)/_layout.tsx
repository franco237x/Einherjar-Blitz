import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

/**
 * Game module layout.
 *
 * Encapsulates the battle experience as a separate phase from the hub:
 *  - Forces LANDSCAPE orientation on mount, restores the previous lock on
 *    unmount (so the hub stays portrait).
 *  - Hides the tab bar (Stack with headerShown:false) so the game is a
 *    self-contained flow: select → battle → exit back to hub.
 *
 * The orientation lock is real (native), not just a visual hint. On web it
 * is a no-op (browsers don't allow locking orientation).
 */
export default function GameLayout() {
  useEffect(() => {
    let previousLock: ScreenOrientation.OrientationLock | null = null;

    async function applyLandscapeLock() {
      // Web doesn't support orientation locking — skip silently.
      if (Platform.OS === 'web') return;
      try {
        const info = await ScreenOrientation.getOrientationLockAsync();
        previousLock = info;
      } catch {
        // getOrientationLockAsync can throw if no lock has been set yet;
        // ignore and let unlockAsync restore default behavior.
        previousLock = null;
      }
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (e) {
        console.warn('[game] Failed to lock landscape orientation:', e);
      }
    }

    applyLandscapeLock();

    return () => {
      // Restore the previous orientation lock when leaving the game module.
      if (Platform.OS === 'web') return;
      try {
        if (previousLock != null) {
          ScreenOrientation.lockAsync(previousLock).catch(() => {
            ScreenOrientation.unlockAsync().catch(() => {});
          });
        } else {
          ScreenOrientation.unlockAsync().catch(() => {});
        }
      } catch (e) {
        console.warn('[game] Failed to restore orientation:', e);
      }
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="battle" />
    </Stack>
  );
}
