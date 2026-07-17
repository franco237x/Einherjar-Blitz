/**
 * Game Data Service — Firestore CRUD for the RPG game state.
 *
 * Collections:
 *   users/{uid}/gameState          — single doc with overall progress
 *   users/{uid}/gameCharacters     — one doc per unlocked character
 *
 * The game module is independent from the gacha system. Its progression
 * (level, XP, dungeon floor) lives entirely in these collections.
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  GAME_CHARACTERS,
  STARTING_ITEMS,
  getStatsAtLevel,
  type CharacterStats,
} from '@/constants/gameData';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface GameState {
  level: number;
  xp: number;
  unlockedCharacters: string[];
  activeCharacter: string;
  currentFloor: number;
  maxFloorReached: number;
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  items: Record<string, number>;   // itemId → quantity
  lastBattleAt: Date | null;
  dungeonCompleted: boolean;
  playthroughs: number;            // how many times the dungeon was cleared
}

export interface GameCharacterDoc {
  charId: string;
  level: number;
  xp: number;
  currentHP: number;
  currentMP: number;
  unlocked: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════════════

export function createDefaultGameState(): GameState {
  const starter = GAME_CHARACTERS.find((c) => c.unlockFloor === 0);
  if (!starter) throw new Error('No starter character found');

  return {
    level: 1,
    xp: 0,
    unlockedCharacters: [starter.id],
    activeCharacter: starter.id,
    currentFloor: 1,
    maxFloorReached: 1,
    totalBattles: 0,
    totalWins: 0,
    totalLosses: 0,
    items: { ...STARTING_ITEMS },
    lastBattleAt: null,
    dungeonCompleted: false,
    playthroughs: 0,
  };
}

export function createDefaultCharacterDoc(charId: string): GameCharacterDoc {
  const stats = getStatsAtLevel(charId, 1);
  return {
    charId,
    level: 1,
    xp: 0,
    currentHP: stats.hp,
    currentMP: stats.mp,
    unlocked: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// GAME STATE CRUD
// ═══════════════════════════════════════════════════════════════════════

const gameStateRef = (uid: string) =>
  doc(db, 'users', uid, 'gameState', 'state');

/** Initialize a new game for the user if one doesn't exist. */
export async function initGame(uid: string): Promise<void> {
  const existing = await getDoc(gameStateRef(uid));
  if (existing.exists()) return;

  const state = createDefaultGameState();
  await setDoc(gameStateRef(uid), {
    ...state,
    lastBattleAt: null,
  });

  // Create the starter character doc
  const starter = GAME_CHARACTERS.find((c) => c.unlockFloor === 0);
  if (starter) {
    await setDoc(
      doc(db, 'users', uid, 'gameCharacters', starter.id),
      createDefaultCharacterDoc(starter.id)
    );
  }
}

/** Read the game state once. */
export async function getGameState(uid: string): Promise<GameState | null> {
  const snap = await getDoc(gameStateRef(uid));
  if (!snap.exists()) return null;
  return deserializeGameState(snap.data() as any);
}

/** Subscribe to real-time game state updates. */
export function streamGameState(
  uid: string,
  onUpdate: (state: GameState | null) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    gameStateRef(uid),
    (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        onUpdate(deserializeGameState(snap.data() as any));
      } else {
        onUpdate(null);
      }
    },
    (err: any) => onError?.(err as Error)
  );
}

/** Update specific fields of the game state. */
export async function updateGameState(
  uid: string,
  updates: Partial<GameState>
): Promise<void> {
  const data: any = { ...updates };
  // Don't serialize Date as null — convert to serverTimestamp if needed
  if (updates.lastBattleAt === undefined) {
    // keep as is
  } else if (updates.lastBattleAt instanceof Date) {
    data.lastBattleAt = updates.lastBattleAt;
  }
  await updateDoc(gameStateRef(uid), data);
}

/** Record a battle result: update wins/losses, floor, XP, spheres. */
export async function recordBattleResult(
  uid: string,
  result: {
    victory: boolean;
    floor: number;
    xpGained: number;
    spheresGained: number;
    fled?: boolean;
  }
): Promise<void> {
  const state = await getGameState(uid);
  if (!state) return;

  const updates: Partial<GameState> = {
    totalBattles: state.totalBattles + 1,
    lastBattleAt: new Date(),
  };

  if (result.victory) {
    updates.totalWins = state.totalWins + 1;
    updates.currentFloor = Math.min(result.floor + 1, 10);
    updates.maxFloorReached = Math.max(state.maxFloorReached, updates.currentFloor);

    // Check if dungeon completed
    if (result.floor >= 10) {
      updates.dungeonCompleted = true;
      updates.playthroughs = state.playthroughs + 1;
      updates.currentFloor = 1; // reset for next playthrough
    }
  } else {
    updates.totalLosses = state.totalLosses + 1;
    // On defeat, go back one floor (min 1)
    updates.currentFloor = Math.max(1, result.floor - 1);
  }

  await updateGameState(uid, updates);
}

/** Add XP and handle level ups for a character. */
export async function addCharacterXP(
  uid: string,
  charId: string,
  xpGained: number
): Promise<{ leveledUp: boolean; newLevel: number; newSkill: string | null }> {
  const charRef = doc(db, 'users', uid, 'gameCharacters', charId);
  const snap = await getDoc(charRef);
  if (!snap.exists()) return { leveledUp: false, newLevel: 1, newSkill: null };

  const charData = snap.data() as GameCharacterDoc;
  const { xpToNextLevel, getNewSkillAtLevel } = await import('@/constants/gameData');

  let level = charData.level;
  let xp = charData.xp + xpGained;
  let leveledUp = false;
  let newSkill: string | null = null;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    leveledUp = true;
    const skill = getNewSkillAtLevel(charId, level);
    if (skill) newSkill = skill.name;
  }

  // On level up, restore HP/MP to full
  const updates: Partial<GameCharacterDoc> = { level, xp };
  if (leveledUp) {
    const stats = getStatsAtLevel(charId, level);
    updates.currentHP = stats.hp;
    updates.currentMP = stats.mp;
  }

  await updateDoc(charRef, updates as any);

  return { leveledUp, newLevel: level, newSkill };
}

/** Update character HP/MP after a battle (persists between battles). */
export async function updateCharacterHPMP(
  uid: string,
  charId: string,
  currentHP: number,
  currentMP: number
): Promise<void> {
  const charRef = doc(db, 'users', uid, 'gameCharacters', charId);
  await updateDoc(charRef, { currentHP, currentMP });
}

/** Unlock a new character. */
export async function unlockCharacter(
  uid: string,
  charId: string
): Promise<void> {
  const state = await getGameState(uid);
  if (!state) return;
  if (state.unlockedCharacters.includes(charId)) return;

  // Add to unlocked list
  await updateGameState(uid, {
    unlockedCharacters: [...state.unlockedCharacters, charId],
  });

  // Create character doc
  await setDoc(
    doc(db, 'users', uid, 'gameCharacters', charId),
    createDefaultCharacterDoc(charId),
    { merge: true }
  );
}

/** Set the active character. */
export async function setActiveCharacter(
  uid: string,
  charId: string
): Promise<void> {
  await updateGameState(uid, { activeCharacter: charId });
}

/** Use an item (decrement quantity). */
export async function useItem(
  uid: string,
  itemId: string
): Promise<void> {
  const state = await getGameState(uid);
  if (!state) return;
  const currentQty = state.items[itemId] || 0;
  if (currentQty <= 0) return;

  const items = { ...state.items };
  items[itemId] = currentQty - 1;
  if (items[itemId] <= 0) delete items[itemId];

  await updateGameState(uid, { items });
}

/** Add items to inventory (e.g., rewards). */
export async function addItems(
  uid: string,
  itemsToAdd: Record<string, number>
): Promise<void> {
  const state = await getGameState(uid);
  if (!state) return;

  const items = { ...state.items };
  for (const [id, qty] of Object.entries(itemsToAdd)) {
    items[id] = (items[id] || 0) + qty;
  }

  await updateGameState(uid, { items });
}

// ═══════════════════════════════════════════════════════════════════════
// CHARACTER DOCS
// ═══════════════════════════════════════════════════════════════════════

/** Subscribe to all character docs for the user. */
export function streamGameCharacters(
  uid: string,
  onUpdate: (chars: GameCharacterDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = collection(db, 'users', uid, 'gameCharacters');
  return onSnapshot(
    q as any,
    (snap: QuerySnapshot) => {
      const chars = snap.docs.map((d: any) => d.data() as GameCharacterDoc);
      onUpdate(chars);
    },
    (err: any) => onError?.(err as Error)
  );
}

/** Get a single character doc. */
export async function getGameCharacter(
  uid: string,
  charId: string
): Promise<GameCharacterDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'gameCharacters', charId));
  if (!snap.exists()) return null;
  return snap.data() as GameCharacterDoc;
}

// ═══════════════════════════════════════════════════════════════════════
// SERIALIZATION
// ═══════════════════════════════════════════════════════════════════════

function deserializeGameState(data: any): GameState {
  return {
    level: data.level ?? 1,
    xp: data.xp ?? 0,
    unlockedCharacters: data.unlockedCharacters ?? [],
    activeCharacter: data.activeCharacter ?? 'einherjar',
    currentFloor: data.currentFloor ?? 1,
    maxFloorReached: data.maxFloorReached ?? 1,
    totalBattles: data.totalBattles ?? 0,
    totalWins: data.totalWins ?? 0,
    totalLosses: data.totalLosses ?? 0,
    items: data.items ?? {},
    lastBattleAt: data.lastBattleAt?.toDate?.() ?? null,
    dungeonCompleted: data.dungeonCompleted ?? false,
    playthroughs: data.playthroughs ?? 0,
  };
}
