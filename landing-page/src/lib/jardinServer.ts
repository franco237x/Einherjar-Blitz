import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { isLocalStore, transaction, type VoucherRecord } from './agroServer';
import { GameError, type AgroVoucher } from './agroGame';
import {
  LEVELS,
  MAX_LEVEL_TICKS,
  TICKS_PER_SECOND,
  getLevel,
  isEarnedVictory,
  isValidLoadout,
  parseLoggedCommand,
  replayLevel,
  type LoggedCommand,
  type PlantKind,
} from './jardin/engine';

/**
 * Jardín de Yggdrasil — event progress, verified rewards and vouchers.
 *
 * Stored next to the Huerto in the private `agro` database (or the local
 * dev store): `jardin/{hash(uid)}` per player and the shared `vouchers/`
 * collection, so the existing PDF and admin redemption keep working.
 * Rewards are granted only after the server replays the level from its own
 * seed and the player's commands, and only the first time a level is won.
 */

/** The fastest speed the client offers; a match cannot finish sooner. */
const MAX_GAME_SPEED = 3;
const MAX_LOG_ENTRIES = 8000;

interface JardinRun {
  id: string;
  level: number;
  loadout: PlantKind[];
  seed: string;
  startedAt: number;
}

interface JardinRecord {
  completed: Record<string, { coins: number; at: number }>;
  coins: number;
  totalEarned: number;
  vouchers: AgroVoucher[];
  run: JardinRun | null;
}

export interface JardinProgress {
  completed: Record<string, { coins: number; at: number }>;
  coins: number;
  totalEarned: number;
  vouchers: AgroVoucher[];
  /** Highest level the player may start. */
  unlocked: number;
}

const ownerHash = (uid: string) => createHash('sha256').update(`jardin:${uid}`).digest('hex');
const recordKey = (uid: string) => `jardin/${ownerHash(uid)}`;

function emptyRecord(): JardinRecord {
  return { completed: {}, coins: 0, totalEarned: 0, vouchers: [], run: null };
}

function unlockedLevel(record: JardinRecord) {
  let unlocked = 1;
  for (const level of LEVELS) if (record.completed[level.id] && level.id + 1 <= LEVELS.length) unlocked = level.id + 1;
  return unlocked;
}

function publicProgress(record: JardinRecord): JardinProgress {
  return {
    completed: record.completed,
    coins: record.coins,
    totalEarned: record.totalEarned,
    vouchers: record.vouchers,
    unlocked: unlockedLevel(record),
  };
}

export async function loadProgress(uid: string): Promise<JardinProgress> {
  return transaction(async (store) => publicProgress((await store.get<JardinRecord>(recordKey(uid))) ?? emptyRecord()));
}

export async function startRun(uid: string, body: Record<string, unknown>) {
  const level = getLevel(Number(body.nivel));
  if (!level) throw new GameError('Ese nivel no existe.');
  if (!isValidLoadout(body.plantas)) throw new GameError('Elige entre 1 y 6 plantas distintas.');
  const loadout = body.plantas;
  const run: JardinRun = {
    id: randomUUID(),
    level: level.id,
    loadout,
    seed: randomBytes(16).toString('hex'),
    startedAt: Date.now(),
  };
  return transaction(async (store) => {
    const key = recordKey(uid);
    const record = (await store.get<JardinRecord>(key)) ?? emptyRecord();
    if (level.id > unlockedLevel(record)) throw new GameError('Supera el nivel anterior para desbloquear este.', 403);
    // A new match replaces any unfinished one.
    store.set(key, { ...record, run });
    return { runId: run.id, seed: run.seed };
  });
}

function parseLog(value: unknown): LoggedCommand[] {
  if (!Array.isArray(value) || value.length > MAX_LOG_ENTRIES) throw new GameError('Registro de partida inválido.');
  let last = 0;
  return value.map((entry) => {
    const parsed = parseLoggedCommand(entry);
    if (!parsed || parsed[0] < last) throw new GameError('Registro de partida inválido.');
    last = parsed[0];
    return parsed;
  });
}

export async function finishRun(uid: string, body: Record<string, unknown>) {
  if (typeof body.runId !== 'string') throw new GameError('Partida inválida.');
  const log = parseLog(body.comandos);
  return transaction(async (store) => {
    const key = recordKey(uid);
    const record = await store.get<JardinRecord>(key);
    const run = record?.run;
    if (!record || !run || run.id !== body.runId)
      throw new GameError('Esa partida ya terminó o fue reemplazada por otra.', 409);

    let outcome: 'victory' | 'defeat' | null;
    let ticks: number;
    let earned: boolean;
    try {
      const state = replayLevel(run.seed, run.level, run.loadout, log);
      outcome = state.outcome;
      ticks = state.tick;
      earned = isEarnedVictory(state);
    } catch {
      throw new GameError('La partida no coincide con el registro del servidor.', 409);
    }
    if (!outcome || ticks >= MAX_LEVEL_TICKS)
      throw new GameError('La partida todavía no terminó.', 409);
    const minimumMs = ((ticks / TICKS_PER_SECOND) * 1000) / MAX_GAME_SPEED;
    if (Date.now() - run.startedAt < minimumMs * 0.9)
      throw new GameError('La partida terminó demasiado rápido.', 409);

    const level = getLevel(run.level)!;
    const firstClear = earned && !record.completed[level.id];
    const reward = firstClear ? level.reward : 0;
    const next: JardinRecord = {
      ...record,
      run: null,
      completed: firstClear ? { ...record.completed, [level.id]: { coins: reward, at: Date.now() } } : record.completed,
      coins: record.coins + reward,
      totalEarned: record.totalEarned + reward,
    };
    store.set(key, next);
    const note =
      outcome === 'victory' && !earned
        ? 'Las podadoras hicieron casi todo el trabajo: esta victoria no cuenta. ¡Planta tu defensa!'
        : undefined;
    return { outcome, reward, firstClear, note, progress: publicProgress(next) };
  });
}

export async function issueVoucher(uid: string, body: Record<string, unknown>) {
  const playerName = typeof body.nombre === 'string' ? body.nombre.trim().replace(/\s+/g, ' ') : '';
  if (playerName.length < 2 || playerName.length > 40)
    throw new GameError('Escribe tu nombre como aparece en el grupo (2 a 40 caracteres).');
  if (!isLocalStore() && (!process.env.AGRO_ADMIN_KEY || process.env.AGRO_ADMIN_KEY.length < 32))
    throw new GameError('El canje todavía está en preparación. Tus monedas siguen guardadas.', 503);
  const now = Date.now();
  const id = `AGRO-${new Date(now).toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(12).toString('hex').toUpperCase()}`;
  return transaction(async (store) => {
    const key = recordKey(uid);
    const record = await store.get<JardinRecord>(key);
    if (!record || record.coins <= 0) throw new GameError('No tienes monedas para retirar.', 409);
    // All reads precede writes in a Firestore transaction.
    if (await store.get(`vouchers/${id}`)) throw new GameError('No se pudo reservar el folio. Intenta de nuevo.', 409);
    const voucher: AgroVoucher = {
      id,
      playerName,
      amount: record.coins,
      createdAt: now,
      totalHarvested: record.totalEarned,
      plantsGrowing: Object.keys(record.completed).length,
      redeemedAt: null,
      environment: isLocalStore() ? 'local' : 'live',
      source: 'jardin',
    };
    const next: JardinRecord = { ...record, coins: 0, vouchers: [...record.vouchers, voucher] };
    store.set(key, next);
    store.set(`vouchers/${id}`, { voucher, ownerId: `jardin:${ownerHash(uid)}` } satisfies VoucherRecord);
    return { voucher, progress: publicProgress(next) };
  });
}
