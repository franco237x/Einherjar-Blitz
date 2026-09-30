import { describe, expect, it } from 'vitest';
import {
  applyPlayerAction,
  canPerformAction,
  createSeededRng,
  executeBossTurn,
  initBattle,
  replayBattle,
  type BattleAction,
  type BattleState,
} from './battleEngine';

const SEED = '0123456789abcdef0123456789abcdef';

/** Plays like the UI does: player action now, boss turn later, one shared rng. */
function playLikeClient(charId: string, seed: string, pickAction: (state: BattleState) => BattleAction) {
  const rng = createSeededRng(seed);
  let state = initBattle(charId);
  const actions: BattleAction[] = [];
  while (state.turnPhase === 'player_turn' && actions.length < 200) {
    const action = pickAction(state);
    if (!canPerformAction(state, action)) throw new Error(`illegal ${action}`);
    actions.push(action);
    const result = applyPlayerAction(state, action, rng);
    state = result.state;
    if (result.bossTurnPending) state = executeBossTurn(state, rng).newState;
  }
  return { state, actions };
}

// A reasonable player: special when allowed, regen when low, otherwise attack.
const policy = (state: BattleState): BattleAction => {
  if (canPerformAction(state, 'special')) return 'special';
  if (state.player.currentHealth < state.player.maxHealth * 0.3) return 'regen';
  return 'attack';
};

describe('createSeededRng', () => {
  it('is deterministic and returns floats in [0, 1)', () => {
    const a = createSeededRng(SEED);
    const b = createSeededRng(SEED);
    for (let i = 0; i < 1000; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('diverges for different seeds', () => {
    const a = createSeededRng(SEED);
    const b = createSeededRng('0123456789abcdef0123456789abcdee');
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('rejects malformed seeds', () => {
    expect(() => createSeededRng('xyz')).toThrow();
    expect(() => createSeededRng(SEED.toUpperCase())).toThrow();
  });
});

describe('replayBattle', () => {
  it.each(['argos', 'galileo', 'orfevre', 'nathan', 'yuka', 'dione'])(
    'reproduces the client outcome exactly for %s',
    (charId) => {
      for (let n = 0; n < 20; n++) {
        const seed = n.toString(16).padStart(32, 'a');
        const client = playLikeClient(charId, seed, policy);
        const server = replayBattle(charId, seed, client.actions);
        expect(server.state.turnPhase).toBe(client.state.turnPhase);
        expect(server.state.turnCount).toBe(client.state.turnCount);
        expect(server.state.player.currentHealth).toBe(client.state.player.currentHealth);
        expect(server.state.boss.currentHealth).toBe(client.state.boss.currentHealth);
      }
    }
  );

  it('reaches victories and defeats', () => {
    const phases = new Set<string>();
    for (let n = 0; n < 60; n++) {
      const seed = n.toString(16).padStart(32, '7');
      phases.add(playLikeClient('argos', seed, policy).state.turnPhase);
      phases.add(playLikeClient('argos', seed, () => 'defend').state.turnPhase);
    }
    expect(phases).toContain('victory');
    expect(phases).toContain('defeat');
  });

  it('gives a different result when the seed does not match', () => {
    const { actions } = playLikeClient('argos', SEED, policy);
    const results = Array.from({ length: 10 }, (_, n) => {
      try {
        return replayBattle('argos', n.toString(16).padStart(32, 'c'), actions).state.boss.currentHealth;
      } catch {
        return 'rejected';
      }
    });
    expect(results.some((hp) => hp !== 0)).toBe(true);
  });

  it('rejects actions after the battle ended', () => {
    const { actions } = playLikeClient('argos', SEED, policy);
    expect(() => replayBattle('argos', SEED, [...actions, 'attack'])).toThrow();
  });

  it('rejects special at full health and unknown actions', () => {
    expect(() => replayBattle('argos', SEED, ['special'])).toThrow();
    expect(() => replayBattle('argos', SEED, ['win'])).toThrow();
    expect(() => replayBattle('argos', SEED, [42])).toThrow();
  });

  it('counts one boss turn per non-winning action', () => {
    const { state, bossTurns } = replayBattle('argos', SEED, ['defend', 'regen', 'attack']);
    expect(bossTurns).toBe(3);
    expect(state.turnCount).toBe(4);
  });
});
