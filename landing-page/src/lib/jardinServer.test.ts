import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  COLS,
  ROWS,
  TICKS_PER_SECOND,
  canPlace,
  createGame,
  isAlive,
  plantAt,
  step,
  type Command,
  type JardinState,
  type LoggedCommand,
  type PlantKind,
} from './jardin/engine';

// A fixed match seed keeps the test bot's result stable. With this one the
// mowers alone clear level 1, which must not pay. Voucher folios still differ.
vi.mock('node:crypto', async (importOriginal) => {
  const crypto = await importOriginal<typeof import('node:crypto')>();
  return { ...crypto, randomBytes: (size: number) => (size === 16 ? Buffer.alloc(16, 0x5a) : crypto.randomBytes(size)) };
});

// The local store writes to `<cwd>/.agro-data`; keep it in a temp folder.
const originalCwd = process.cwd();
let server: typeof import('./jardinServer');
let agro: typeof import('./agroServer');

beforeAll(async () => {
  process.chdir(mkdtempSync(path.join(tmpdir(), 'jardin-')));
  vi.stubEnv('AGRO_STORE', 'local');
  server = await import('./jardinServer');
  agro = await import('./agroServer');
});
afterAll(() => {
  process.chdir(originalCwd);
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const LOADOUT: PlantKind[] = ['solmiel', 'nabu', 'cardon', 'cortezon', 'frigora', 'granadin'];
const ATTACK: PlantKind[] = ['nabu', 'cardon', 'frigora', 'mordiseta', 'zarzina'];

/** A player that reacts to threats; good enough to clear the early levels. */
function decide(g: JardinState, sun: number): Command | null {
  const ok = (k: PlantKind, r: number, c: number | undefined) => c !== undefined && canPlace({ ...g, sun }, k, r, c) === 'ok';
  const free = (row: number, cols: number[]) => cols.find((col) => !plantAt(g, row, col));
  const lanes = Array.from({ length: ROWS }, (_, r) => {
    const z = g.zombies.filter((x) => isAlive(x) && x.row === r && x.x < COLS + 0.3);
    return {
      r,
      z,
      hp: z.reduce((a, x) => a + x.hp + x.armor, 0),
      atk: g.plants.filter((p) => p.row === r && ATTACK.includes(p.kind)).length,
      front: Math.min(...z.map((x) => x.x), 99),
    };
  });
  for (const l of lanes)
    if (l.z.length >= 3) {
      const c = Math.max(0, Math.min(COLS - 1, Math.floor(l.front)));
      if (ok('granadin', l.r, c)) return { type: 'place', kind: 'granadin', row: l.r, col: c };
    }
  const need = lanes.filter((l) => l.z.length && l.atk < 1 + Math.ceil(l.hp / 500)).sort((a, b) => a.front - b.front)[0];
  if (need) {
    for (const k of ['cardon', 'nabu', 'frigora'] as PlantKind[]) {
      const c = free(need.r, [1, 2, 3, 4]);
      if (ok(k, need.r, c)) return { type: 'place', kind: k, row: need.r, col: c! };
    }
    return null;
  }
  const sunflowers = g.plants.filter((p) => p.kind === 'solmiel').length;
  if (sunflowers < 8)
    for (const r of [2, 1, 3, 0, 4]) {
      const c = free(r, [0]) ?? (sunflowers >= 5 ? free(r, [5]) : undefined);
      if (ok('solmiel', r, c)) return { type: 'place', kind: 'solmiel', row: r, col: c! };
    }
  for (const r of [2, 1, 3, 0, 4])
    if (lanes[r].atk < 2) {
      const c = free(r, [1, 2, 3]);
      if (ok('nabu', r, c)) return { type: 'place', kind: 'nabu', row: r, col: c! };
    }
  return null;
}

function play(seed: string, level: number) {
  const game = createGame(seed, {}, 'waves', { level, loadout: LOADOUT });
  const log: LoggedCommand[] = [];
  while (!game.outcome && game.tick < 400 * TICKS_PER_SECOND) {
    const commands: Command[] = game.suns.map((sun) => ({ type: 'collect', sunId: sun.id }) as Command);
    const choice = decide(game, game.sun + game.suns.reduce((a, s) => a + s.value, 0));
    if (choice) commands.push(choice);
    for (const command of commands) log.push([game.tick, command]);
    step(game, commands);
  }
  return { game, log };
}

describe('jardín server', () => {
  const uid = 'player-1';

  it('starts with level 1 unlocked and nothing earned', async () => {
    const progress = await server.loadProgress(uid);
    expect(progress).toMatchObject({ coins: 0, totalEarned: 0, unlocked: 1, vouchers: [] });
  });

  it('refuses locked levels and bad loadouts', async () => {
    await expect(server.startRun(uid, { nivel: 2, plantas: LOADOUT })).rejects.toThrow(/desbloquear/);
    await expect(server.startRun(uid, { nivel: 1, plantas: [...LOADOUT, 'zarzina'] })).rejects.toThrow(/plantas/);
    await expect(server.startRun(uid, { nivel: 9, plantas: LOADOUT })).rejects.toThrow(/nivel/);
  });

  it('pays nothing for a match the plants did not win', async () => {
    const { runId } = await server.startRun(uid, { nivel: 1, plantas: LOADOUT });
    vi.useFakeTimers({ now: Date.now() + 10 * 60_000, toFake: ['Date'] });
    const result = await server.finishRun(uid, { runId, comandos: [[0, { type: 'collect', sunId: 1 }]] });
    vi.useRealTimers();
    // Nothing planted: the mowers did all the work.
    expect(result).toMatchObject({ outcome: 'victory', reward: 0, firstClear: false, progress: { unlocked: 1 } });
    expect(result.note).toMatch(/podadoras/);
    await expect(server.finishRun(uid, { runId, comandos: [] })).rejects.toThrow(/terminó/);
  });

  it('rewards a replayed victory once, after a plausible time', async () => {
    const { runId, seed } = await server.startRun(uid, { nivel: 1, plantas: LOADOUT });
    const { game, log } = play(seed, 1);
    expect(game.outcome).toBe('victory');
    // Finishing instantly is impossible even at ×3.
    await expect(server.finishRun(uid, { runId, comandos: log })).rejects.toThrow(/rápido/);
    vi.useFakeTimers({ now: Date.now() + 10 * 60_000, toFake: ['Date'] });
    const result = await server.finishRun(uid, { runId, comandos: log });
    vi.useRealTimers();
    expect(result).toMatchObject({ outcome: 'victory', reward: 250, firstClear: true });
    expect(result.progress).toMatchObject({ coins: 250, totalEarned: 250, unlocked: 2 });

    // Winning level 1 again pays nothing.
    const again = await server.startRun(uid, { nivel: 1, plantas: LOADOUT });
    const replay = play(again.seed, 1);
    vi.useFakeTimers({ now: Date.now() + 10 * 60_000, toFake: ['Date'] });
    const second = await server.finishRun(uid, { runId: again.runId, comandos: replay.log });
    vi.useRealTimers();
    expect(second).toMatchObject({ reward: 0, firstClear: false });
    expect(second.progress.coins).toBe(250);
  });

  it('turns coins into a redeemable voucher', async () => {
    await expect(server.issueVoucher(uid, { nombre: 'x' })).rejects.toThrow(/nombre/);
    const { voucher, progress } = await server.issueVoucher(uid, { nombre: 'Franco' });
    expect(voucher).toMatchObject({ amount: 250, source: 'jardin', playerName: 'Franco', redeemedAt: null });
    expect(progress.coins).toBe(0);
    expect(await agro.lookupVoucher(voucher.id)).toMatchObject({ amount: 250 });
    await agro.redeemVoucher(voucher.id);
    const after = await server.loadProgress(uid);
    expect(after.vouchers[0].redeemedAt).not.toBeNull();
    await expect(agro.redeemVoucher(voucher.id)).rejects.toThrow(/ya fue canjeado/);
    await expect(server.issueVoucher(uid, { nombre: 'Franco' })).rejects.toThrow(/No tienes monedas/);
  });
});
