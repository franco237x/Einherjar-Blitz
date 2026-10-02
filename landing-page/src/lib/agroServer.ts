import 'server-only';
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';
import {
  applyFarmAction,
  createInitialFarm,
  GameError,
  type ActionOutcome,
  type AgroVoucher,
  type FarmAction,
  type FarmState,
} from './agroGame';
import { verifyFirebaseUser } from './serverRequest';

export { assertSameOrigin, requestJson } from './serverRequest';

const DATA_DIR = path.join(process.cwd(), '.agro-data');
export const AGRO_COOKIE = 'agro-session-v2';
export const VOUCHER_PATTERN = /^AGRO-\d{8}-[A-F0-9]{24}$/;
interface FarmRecord {
  farm: FarmState;
  receipts: { id: string; outcome: ActionOutcome }[];
  nextActionAt: number;
  linkedUid?: string;
}
interface AgroAccountRecord {
  ownerId: string;
}
export interface VoucherRecord {
  voucher: AgroVoucher;
  ownerId: string;
}
export interface StoreTransaction {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): void;
}

export function isLocalStore() {
  if (process.env.AGRO_STORE === 'local' && process.env.VERCEL)
    throw new GameError(
      'El evento necesita almacenamiento permanente antes de abrirse.',
      503,
    );
  return (
    process.env.AGRO_STORE === 'local' ||
    (!process.env.VERCEL &&
      process.env.NODE_ENV !== 'production' &&
      process.env.AGRO_STORE !== 'firestore')
  );
}
function firestore() {
  const databaseId = process.env.AGRO_FIRESTORE_DATABASE_ID;
  if (!databaseId || databaseId === '(default)')
    throw new GameError(
      'El evento todavía está preparando su guardado. Intenta más tarde.',
      503,
    );
  const projectId =
    process.env.AGRO_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const existing = getApps().find((app) => app.name === 'agro-server');
  const serviceAccount = process.env.AGRO_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
    throw new GameError(
      'El evento todavía está preparando su guardado. Intenta más tarde.',
      503,
    );
  const app =
    existing ||
    initializeApp(
      {
        projectId,
        credential: serviceAccount
          ? cert(JSON.parse(serviceAccount))
          : applicationDefault(),
      },
      'agro-server',
    );
  return getFirestore(app, databaseId);
}
export async function requireAgroUser(request: NextRequest): Promise<string> {
  return verifyFirebaseUser(request, {
    missing: 'Inicia sesión para abrir tu huerto.',
    expired: 'Tu sesión venció. Vuelve a iniciar sesión.',
    unverified: 'Verifica tu correo antes de abrir el huerto.',
  });
}
async function localTransaction<T>(
  run: (store: StoreTransaction) => Promise<T>,
): Promise<T> {
  await mkdir(DATA_DIR, { recursive: true });
  const lockPath = path.join(DATA_DIR, 'store.lock');
  let lock;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      lock = await open(lockPath, 'wx');
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  if (!lock)
    throw new GameError('El guardado está ocupado. Vuelve a intentarlo.', 503);
  const file = path.join(DATA_DIR, 'store.json');
  const temporary = path.join(
    DATA_DIR,
    `store-${randomBytes(8).toString('hex')}.tmp`,
  );
  try {
    let records: Record<string, unknown> = {};
    try {
      records = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    let dirty = false;
    const result = await run({
      get: async <R>(key: string) =>
        structuredClone((records[key] as R) ?? null),
      set: (key, value) => {
        records[key] = value;
        dirty = true;
      },
    });
    if (dirty) {
      await writeFile(temporary, JSON.stringify(records), {
        flag: 'wx',
        mode: 0o600,
      });
      await rename(temporary, file);
    }
    return result;
  } finally {
    await lock.close();
    await unlink(lockPath);
    await unlink(temporary).catch(() => undefined);
  }
}
export async function transaction<T>(
  run: (store: StoreTransaction) => Promise<T>,
): Promise<T> {
  if (isLocalStore()) return localTransaction(run);
  const db = firestore();
  return db.runTransaction(async (tx) =>
    run({
      get: async <R>(key: string) =>
        ((await tx.get(db.doc(key))).data() as R) ?? null,
      set: (key, value) => {
        tx.set(db.doc(key), value as Record<string, unknown>);
      },
    }),
  );
}
export function legacyOwnerId(request: NextRequest): string | null {
  const token = request.cookies.get(AGRO_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash('sha256').update(token).digest('hex')
    : null;
}
function accountKey(uid: string) {
  return `agroAccounts/${createHash('sha256').update(uid).digest('hex')}`;
}
function newAccountOwnerId(uid: string) {
  return createHash('sha256').update(`firebase-user:${uid}`).digest('hex');
}
/** Read-only lookup for the closed event: never creates, links or migrates a farm. */
export async function readFarm(uid: string): Promise<FarmState | null> {
  return transaction(async (store) => {
    const account = await store.get<AgroAccountRecord>(accountKey(uid));
    if (!account) return null;
    const record = await store.get<FarmRecord>(`farms/${account.ownerId}`);
    return record && record.linkedUid === uid ? record.farm : null;
  });
}
export async function loadFarm(
  uid: string,
  legacyOwner: string | null,
): Promise<FarmState> {
  return transaction(async (store) => {
    const key = accountKey(uid);
    const account = await store.get<AgroAccountRecord>(key);
    if (account) {
      const currentKey = `farms/${account.ownerId}`;
      const current = await store.get<FarmRecord>(currentKey);
      if (!current || current.linkedUid !== uid)
        throw new GameError('No pudimos recuperar el huerto de tu cuenta.', 503);
      // If an empty account was opened on another device first, it can still
      // adopt the older cookie farm before any game action is taken.
      if (
        legacyOwner &&
        legacyOwner !== account.ownerId &&
        current.farm.revision === 0
      ) {
        const previous = await store.get<FarmRecord>(`farms/${legacyOwner}`);
        if (previous && (!previous.linkedUid || previous.linkedUid === uid)) {
          previous.linkedUid = uid;
          store.set(`farms/${legacyOwner}`, previous);
          store.set(key, { ownerId: legacyOwner });
          return previous.farm;
        }
      }
      return current.farm;
    }
    if (legacyOwner) {
      const previous = await store.get<FarmRecord>(`farms/${legacyOwner}`);
      if (previous && (!previous.linkedUid || previous.linkedUid === uid)) {
        previous.linkedUid = uid;
        store.set(`farms/${legacyOwner}`, previous);
        store.set(key, { ownerId: legacyOwner });
        return previous.farm;
      }
    }
    const ownerId = newAccountOwnerId(uid);
    const farmKey = `farms/${ownerId}`;
    const existing = await store.get<FarmRecord>(farmKey);
    if (existing && existing.linkedUid !== uid)
      throw new GameError('No pudimos recuperar el huerto de tu cuenta.', 503);
    if (existing) {
      store.set(key, { ownerId });
      return existing.farm;
    }
    const farm = createInitialFarm();
    store.set(farmKey, { farm, receipts: [], nextActionAt: 0, linkedUid: uid });
    store.set(key, { ownerId });
    return farm;
  });
}
export async function performAction(
  uid: string,
  input: Record<string, unknown>,
) {
  const { requestId, revision, action } = input;
  if (
    typeof requestId !== 'string' ||
    !/^[a-f0-9-]{36}$/i.test(requestId) ||
    !Number.isSafeInteger(revision) ||
    !action ||
    typeof action !== 'object' ||
    Array.isArray(action)
  )
    throw new GameError('Acción inválida.');
  if (
    (action as FarmAction).type === 'voucher' &&
    !isLocalStore() &&
    (!process.env.AGRO_ADMIN_KEY || process.env.AGRO_ADMIN_KEY.length < 32)
  ) {
    throw new GameError('El canje todavía está en preparación. Tus monedas siguen disponibles en el huerto.', 503);
  }
  const now = Date.now();
  const draws = Array.from(
    { length: 10 },
    () => randomInt(0, 1_000_000) / 1_000_000,
  );
  const id = `AGRO-${new Date(now).toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(12).toString('hex').toUpperCase()}`;
  return transaction(async (store) => {
    const account = await store.get<AgroAccountRecord>(accountKey(uid));
    if (!account)
      throw new GameError('Abre el huerto para iniciar tu partida.', 401);
    const ownerId = account.ownerId;
    const key = `farms/${ownerId}`;
    const record = await store.get<FarmRecord>(key);
    if (!record || record.linkedUid !== uid)
      throw new GameError('No pudimos recuperar el huerto de tu cuenta.', 503);
    const receipt = record.receipts.find((item) => item.id === requestId);
    if (receipt) return { farm: record.farm, outcome: receipt.outcome };
    if (revision !== record.farm.revision)
      throw new GameError(
        'Tu partida cambió en otra pestaña. Actualizamos el huerto; vuelve a intentarlo.',
        409,
      );
    if (now < record.nextActionAt)
      throw new GameError(
        'Espera un instante antes de la siguiente acción.',
        429,
      );
    let drawIndex = 0;
    const result = applyFarmAction(
      record.farm,
      action as FarmAction,
      now,
      () => draws[drawIndex++],
      { id, environment: isLocalStore() ? 'local' : 'live' },
    );
    // All reads precede writes in a Firestore transaction.
    if (result.outcome.voucher && (await store.get(`vouchers/${id}`)))
      throw new GameError(
        'No se pudo reservar el folio. Intenta de nuevo.',
        409,
      );
    store.set(key, {
      farm: result.farm,
      receipts: [
        ...record.receipts,
        { id: requestId, outcome: result.outcome },
      ].slice(-40),
      nextActionAt: now + 150,
      linkedUid: uid,
    });
    if (result.outcome.voucher)
      store.set(`vouchers/${id}`, { voucher: result.outcome.voucher, ownerId });
    return result;
  });
}
export async function lookupVoucher(id: string): Promise<AgroVoucher> {
  if (!VOUCHER_PATTERN.test(id)) throw new GameError('Folio inválido.', 404);
  return transaction(async (store) => {
    const record = await store.get<VoucherRecord>(`vouchers/${id}`);
    if (!record) throw new GameError('No encontramos ese vale.', 404);
    return record.voucher;
  });
}
export async function requireAdmin(request: NextRequest) {
  let expected = process.env.AGRO_ADMIN_KEY;
  if (!expected && isLocalStore()) {
    await mkdir(DATA_DIR, { recursive: true });
    const keyFile = path.join(DATA_DIR, 'admin-key.txt');
    try {
      await writeFile(keyFile, randomBytes(32).toString('hex'), {
        flag: 'wx',
        mode: 0o600,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    expected = (await readFile(keyFile, 'utf8')).trim();
  }
  if (!expected || expected.length < 32)
    throw new GameError(
      'La administración del evento todavía no está configurada.',
      503,
    );
  const supplied =
    request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const a = createHash('sha256').update(expected).digest();
  const b = createHash('sha256').update(supplied).digest();
  if (!timingSafeEqual(a, b))
    throw new GameError('Clave de administración incorrecta.', 401);
}
export async function redeemVoucher(id: string) {
  if (!VOUCHER_PATTERN.test(id)) throw new GameError('Folio inválido.', 404);
  return transaction(async (store) => {
    const key = `vouchers/${id}`;
    const record = await store.get<VoucherRecord>(key);
    if (!record) throw new GameError('No encontramos ese vale.', 404);
    if (record.voucher.redeemedAt)
      throw new GameError(
        'Este vale ya fue canjeado. No vuelvas a acreditar sus monedas.',
        409,
      );
    record.voucher.redeemedAt = Date.now();
    // Jardín vouchers keep their copy in the player's event record.
    if (record.ownerId.startsWith('jardin:')) {
      const jardinKey = `jardin/${record.ownerId.slice('jardin:'.length)}`;
      const jardin = await store.get<{ vouchers: AgroVoucher[] }>(jardinKey);
      if (jardin) {
        jardin.vouchers = jardin.vouchers.map((item) => (item.id === id ? record.voucher : item));
        store.set(jardinKey, jardin);
      }
      store.set(key, record);
      return record.voucher;
    }
    const ownerKey = `farms/${record.ownerId}`;
    const owner = await store.get<FarmRecord>(ownerKey);
    if (owner) {
      owner.farm.vouchers = owner.farm.vouchers.map((item) =>
        item.id === id ? record.voucher : item,
      );
      owner.farm.revision += 1;
      store.set(ownerKey, owner);
    }
    store.set(key, record);
    return record.voucher;
  });
}
export function apiError(error: unknown): Response {
  if (error instanceof GameError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { 'Cache-Control': 'no-store' } },
    );
  // Do not leak credentials, request bodies, or database diagnostics to players.
  console.error(
    '[agro] Storage or PDF operation failed:',
    error instanceof Error ? error.name : 'UnknownError',
  );
  return Response.json(
    {
      error:
        'No pudimos confirmar la operación. Actualiza el huerto y consulta tu saldo e historial antes de repetirla.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
