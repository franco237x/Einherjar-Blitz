import {
  ALBUM_FAMILIES,
  ALBUM_MILESTONES,
  ALBUM_PLANTS,
  type AlbumFamilyId,
} from './agroAlbum';

export const PLOT_COUNT = 6;
export const WATERINGS_TO_GROW = 3;
export const WATER_COOLDOWN_MS = 8_000;
export const MATURE_WATER_COOLDOWN_MS = 60_000;
export const FREE_DRAW_COOLDOWN_MS = 60_000;
export const SINGLE_DRAW_COST = 1;
export const TEN_DRAW_COST = 10;
export const DAILY_POLLEN = 5;
export const DAILY_COIN_LIMIT = 2_000;
export const DAILY_ACTION_LIMIT = 500;
export const PITY_LIMITS = [10, 30, 45, 120] as const;
export const RARITIES = [
  'Común',
  'Rara',
  'Épica',
  'Legendaria',
  'Mítica',
] as const;
export const BASE_ODDS = ['56 %', '29 %', '11 %', '3,5 %', '0,5 %'] as const;
export type PlantTier = 0 | 1 | 2 | 3 | 4;
export const PLANTS = ALBUM_PLANTS.map((plant) => ({
  ...plant,
  color: ALBUM_FAMILIES.find((family) => family.id === plant.family)!.accent,
  yield: [1, 2, 5, 12, 28][plant.tier],
  cycleMs: plant.family === 'alba' ? 60_000 : 75_000,
  reserve: plant.family === 'escarcha' ? 480 : 120,
}));
export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function getPlant(id: string) {
  const plant = PLANTS.find((item) => item.id === id);
  if (!plant) throw new GameError('Esa especie no existe.');
  return plant;
}
export interface FarmPlot {
  plantId: string;
  waterings: number;
  nextWaterAt: number;
  lastHarvestAt: number;
  nextPollenAt: number;
  bonusCycles: number;
  storedCoins?: number;
  plantedAt: number;
}
export interface DailyUsage {
  day: string;
  earned: number;
  redeemed: number;
  actions: number;
}
export interface PlantProgress {
  discovered: boolean;
  cultivated: boolean;
  harvests: number;
}
export interface AgroVoucher {
  id: string;
  playerName: string;
  amount: number;
  createdAt: number;
  totalHarvested: number;
  plantsGrowing: number;
  redeemedAt: number | null;
  environment: 'local' | 'live';
}
export interface FarmState {
  version: 2;
  revision: number;
  coins: number;
  totalHarvested: number;
  pollen: number;
  seeds: Record<string, number>;
  plots: (FarmPlot | null)[];
  album: Record<string, PlantProgress>;
  claimedMilestones: number[];
  familySeals: AlbumFamilyId[];
  theme: AlbumFamilyId;
  nextFreeDrawAt: number;
  pullCount: number;
  pity: number[];
  lastDailyGift: string;
  playerName: string;
  vouchers: AgroVoucher[];
  daily: DailyUsage;
}
export type FarmAction =
  | { type: 'plant'; index: number; plantId: string }
  | { type: 'water' | 'harvest' | 'uproot'; index: number }
  | { type: 'fuse'; index: number; partnerIndex: number }
  | { type: 'harvestAll' | 'daily' }
  | { type: 'draw'; count: 1 | 10; family: AlbumFamilyId }
  | { type: 'milestone'; count: number; choice: AlbumFamilyId }
  | { type: 'theme'; family: AlbumFamilyId }
  | { type: 'voucher'; playerName: string };
export interface ActionOutcome {
  message: string;
  results?: string[];
  voucher?: AgroVoucher;
}
export function createInitialFarm(now = Date.now()): FarmState {
  const seeds: Record<string, number> = {};
  const album: Record<string, PlantProgress> = {};
  for (const plant of PLANTS) {
    seeds[plant.id] = plant.tier === 0 ? 1 : 0;
    album[plant.id] = {
      discovered: plant.tier === 0,
      cultivated: false,
      harvests: 0,
    };
  }
  return {
    version: 2,
    revision: 0,
    coins: 0,
    totalHarvested: 0,
    pollen: 5,
    seeds,
    plots: Array(PLOT_COUNT).fill(null),
    album,
    claimedMilestones: [],
    familySeals: [],
    theme: 'alba',
    nextFreeDrawAt: 0,
    pullCount: 0,
    pity: [0, 0, 0, 0],
    lastDailyGift: '',
    playerName: '',
    vouchers: [],
    daily: { day: eventDay(now), earned: 0, redeemed: 0, actions: 0 },
  };
}
export const cultivatedCount = (farm: FarmState) =>
  Object.values(farm.album).filter((entry) => entry.cultivated).length;
export const isMature = (plot: FarmPlot) => plot.waterings >= WATERINGS_TO_GROW;
export function readyCoins(plot: FarmPlot, now: number): number {
  if (!isMature(plot)) return 0;
  const plant = getPlant(plot.plantId);
  return (
    (plot.storedCoins ?? 0) +
    (Math.min(
      plant.reserve,
      Math.max(0, Math.floor((now - plot.lastHarvestAt) / plant.cycleMs)),
    ) +
      plot.bonusCycles) *
      plant.yield
  );
}
export function nextCoinIn(plot: FarmPlot, now: number): number {
  const plant = getPlant(plot.plantId);
  return (
    plant.cycleMs - (Math.max(0, now - plot.lastHarvestAt) % plant.cycleMs)
  );
}
export function fusionPartner(state: FarmState, index: number): number {
  const plot = state.plots[index];
  if (!plot || !isMature(plot)) return -1;
  const plant = getPlant(plot.plantId);
  if (plant.tier === 4 && state.familySeals.includes(plant.family)) return -1;
  return state.plots.findIndex(
    (other, i) =>
      i !== index && other?.plantId === plot.plantId && isMature(other),
  );
}
export const canFuse = (state: FarmState, index: number) =>
  fusionPartner(state, index) >= 0;
export function eventDay(now: number): string {
  return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function dailyUsage(farm: FarmState, now: number): DailyUsage {
  const day = eventDay(now);
  const current = farm.daily?.day === day ? farm.daily : null;
  // Existing farms may have vouchers from before daily counters were added.
  const vouchersToday = farm.vouchers
    .filter((voucher) => eventDay(voucher.createdAt) === day)
    .reduce((sum, voucher) => sum + voucher.amount, 0);
  return {
    day,
    earned: current?.earned ?? 0,
    redeemed: Math.max(current?.redeemed ?? 0, vouchersToday),
    actions: current?.actions ?? 0,
  };
}
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function rollTier(random: number, pity: number[]): PlantTier {
  const value = Math.max(0, Math.min(0.999999999, random)) * 100;
  let tier: PlantTier =
    value < 56 ? 0 : value < 85 ? 1 : value < 96 ? 2 : value < 99.5 ? 3 : 4;
  for (let i = 0; i < PITY_LIMITS.length; i++) {
    if (pity[i] >= PITY_LIMITS[i] - 1)
      tier = Math.max(tier, i + 1) as PlantTier;
  }
  return tier;
}
function validFamily(value: string): asserts value is AlbumFamilyId {
  if (!ALBUM_FAMILIES.some((family) => family.id === value))
    throw new GameError('Elige uno de los tres linajes.');
}
function validIndex(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= PLOT_COUNT)
    throw new GameError('Parcela inválida.');
}
function needPlot(farm: FarmState, index: number): FarmPlot {
  validIndex(index);
  const plot = farm.plots[index];
  if (!plot) throw new GameError('Esa parcela está vacía.');
  return plot;
}
function creditHarvest(farm: FarmState, index: number, now: number): number {
  const plot = needPlot(farm, index);
  const available = readyCoins(plot, now);
  const amount = Math.min(
    available,
    Math.max(0, DAILY_COIN_LIMIT - farm.daily.earned),
  );
  if (!amount) return 0;
  const plant = getPlant(plot.plantId);
  const elapsed = Math.max(0, now - plot.lastHarvestAt);
  // Preserve the unfinished production cycle, including after a full reserve.
  plot.lastHarvestAt = now - (elapsed % plant.cycleMs);
  plot.bonusCycles = 0;
  plot.storedCoins = available - amount;
  if (now >= plot.nextPollenAt) {
    farm.pollen += 1;
    plot.nextPollenAt = now + 60_000;
  }
  farm.coins += amount;
  farm.totalHarvested += amount;
  farm.daily.earned += amount;
  farm.album[plot.plantId].harvests += 1;
  return amount;
}
function addSeed(farm: FarmState, id: string) {
  farm.seeds[id] += 1;
  farm.album[id].discovered = true;
}

/** Only the server calls this reducer with its own time, randomness and voucher ID. */
export function applyFarmAction(
  source: FarmState,
  action: FarmAction,
  now: number,
  random: () => number,
  voucherContext?: { id: string; environment: 'local' | 'live' },
): { farm: FarmState; outcome: ActionOutcome } {
  const farm: FarmState = structuredClone(source);
  farm.daily = dailyUsage(source, now);
  if (farm.daily.actions >= DAILY_ACTION_LIMIT)
    throw new GameError(
      'Llegaste a 500 acciones hoy. Tu huerto vuelve a abrir a las 00:00 de Argentina.',
      429,
    );
  let outcome: ActionOutcome;
  switch (action.type) {
    case 'plant': {
      validIndex(action.index);
      const plant = getPlant(action.plantId);
      if (farm.plots[action.index] || farm.seeds[plant.id] < 1)
        throw new GameError(
          'Selecciona una semilla disponible y una parcela vacía.',
        );
      farm.seeds[plant.id] -= 1;
      farm.plots[action.index] = {
        plantId: plant.id,
        waterings: 0,
        nextWaterAt: now,
        lastHarvestAt: now,
        nextPollenAt: now,
        bonusCycles: 0,
        storedCoins: 0,
        plantedAt: now,
      };
      outcome = {
        message: `${plant.name} plantada. Dale tres riegos para que crezca.`,
      };
      break;
    }
    case 'water': {
      const plot = needPlot(farm, action.index);
      if (now < plot.nextWaterAt)
        throw new GameError('Espera a que termine el descanso del riego.');
      if (isMature(plot)) {
        const bonus = getPlant(plot.plantId).family === 'brasas' ? 2 : 1;
        if (plot.bonusCycles >= bonus * 3)
          throw new GameError(
            'Cosecha el bono acumulado antes de volver a regar.',
          );
        plot.bonusCycles += bonus;
        plot.nextWaterAt = now + MATURE_WATER_COOLDOWN_MS;
        outcome = {
          message: 'Riego listo. Tu próxima cosecha incluye un bono.',
        };
      } else {
        plot.waterings += 1;
        plot.nextWaterAt =
          now + (isMature(plot) ? MATURE_WATER_COOLDOWN_MS : WATER_COOLDOWN_MS);
        if (isMature(plot)) {
          plot.lastHarvestAt = now;
          farm.album[plot.plantId].cultivated = true;
        }
        outcome = {
          message: isMature(plot)
            ? '¡Planta madura! Su lámina ya cuenta en tu álbum.'
            : `Riego ${plot.waterings} de 3.`,
        };
      }
      break;
    }
    case 'harvest': {
      const amount = creditHarvest(farm, action.index, now);
      if (!amount)
        throw new GameError(
          farm.daily.earned >= DAILY_COIN_LIMIT
            ? 'Llegaste a 2.000 monedas cosechadas hoy. La cosecha pendiente seguirá disponible mañana.'
            : 'Todavía no hay cosecha disponible.',
          farm.daily.earned >= DAILY_COIN_LIMIT ? 429 : 400,
        );
      outcome = { message: `Cosechaste ${amount} monedas.` };
      break;
    }
    case 'harvestAll': {
      let amount = 0;
      farm.plots.forEach((plot, i) => {
        if (plot) amount += creditHarvest(farm, i, now);
      });
      if (!amount)
        throw new GameError(
          farm.daily.earned >= DAILY_COIN_LIMIT
            ? 'Llegaste a 2.000 monedas cosechadas hoy. La cosecha pendiente seguirá disponible mañana.'
            : 'Todavía no hay cosecha disponible.',
          farm.daily.earned >= DAILY_COIN_LIMIT ? 429 : 400,
        );
      outcome = { message: `Cosechaste ${amount} monedas en todo el huerto.` };
      break;
    }
    case 'uproot': {
      const plot = needPlot(farm, action.index);
      creditHarvest(farm, action.index, now);
      if (readyCoins(plot, now) > 0)
        throw new GameError(
          'Quedan monedas pendientes. Recógelas después del reinicio diario antes de retirar esta planta.',
          429,
        );
      farm.plots[action.index] = null;
      outcome = {
        message: `${getPlant(plot.plantId).name} retirada. Tu descubrimiento permanece en el álbum.`,
      };
      break;
    }
    case 'fuse': {
      const first = needPlot(farm, action.index);
      const second = needPlot(farm, action.partnerIndex);
      const plant = getPlant(first.plantId);
      if (
        action.index === action.partnerIndex ||
        first.plantId !== second.plantId ||
        !isMature(first) ||
        !isMature(second)
      )
        throw new GameError(
          'Necesitas dos plantas maduras de la misma especie.',
        );
      if (plant.tier === 4 && farm.familySeals.includes(plant.family))
        throw new GameError('Ya tienes el sello de este linaje.');
      creditHarvest(farm, action.index, now);
      creditHarvest(farm, action.partnerIndex, now);
      if (readyCoins(first, now) > 0 || readyCoins(second, now) > 0)
        throw new GameError(
          'Quedan monedas pendientes. Recógelas después del reinicio diario antes de fusionar.',
          429,
        );
      farm.plots[action.partnerIndex] = null;
      if (plant.tier === 4) {
        farm.familySeals.push(plant.family);
        outcome = {
          message:
            '¡Sello de linaje conseguido! Conservas una planta mítica madura.',
        };
      } else {
        const next = PLANTS.find(
          (item) =>
            item.family === plant.family && item.tier === plant.tier + 1,
        )!;
        farm.album[next.id].discovered = true;
        farm.plots[action.index] = {
          plantId: next.id,
          waterings: 0,
          nextWaterAt: now,
          lastHarvestAt: now,
          nextPollenAt: now,
          bonusCycles: 0,
          storedCoins: 0,
          plantedAt: now,
        };
        outcome = {
          message: `¡Fusión completa! Riega tu nueva ${next.name}.`,
          results: [next.id],
        };
      }
      break;
    }
    case 'draw': {
      validFamily(action.family);
      if (action.count !== 1 && action.count !== 10)
        throw new GameError('Elige una o diez invocaciones.');
      const free = action.count === 1 && now >= farm.nextFreeDrawAt;
      const cost = free
        ? 0
        : action.count === 1
          ? SINGLE_DRAW_COST
          : TEN_DRAW_COST;
      if (farm.pollen < cost)
        throw new GameError(
          'Te falta polen. Cosecha o recoge el regalo diario.',
        );
      farm.pollen -= cost;
      if (free) farm.nextFreeDrawAt = now + FREE_DRAW_COOLDOWN_MS;
      const results: string[] = [];
      for (let i = 0; i < action.count; i++) {
        const tier = rollTier(random(), farm.pity);
        const plant = PLANTS.find(
          (item) => item.family === action.family && item.tier === tier,
        )!;
        addSeed(farm, plant.id);
        results.push(plant.id);
        farm.pullCount += 1;
        farm.pity = farm.pity.map((value, index) =>
          tier >= index + 1 ? 0 : value + 1,
        );
      }
      outcome = {
        message: `${results.length} semillas añadidas al semillero.`,
        results,
      };
      break;
    }
    case 'daily': {
      const day = eventDay(now);
      if (farm.lastDailyGift === day)
        throw new GameError('Ya recogiste el regalo de hoy.');
      farm.lastDailyGift = day;
      farm.pollen += DAILY_POLLEN;
      outcome = {
        message:
          'Recibiste 5 de polen. El regalo vuelve a medianoche de Argentina.',
      };
      break;
    }
    case 'milestone': {
      if (
        !ALBUM_MILESTONES.some((item) => item.count === action.count) ||
        cultivatedCount(farm) < action.count ||
        farm.claimedMilestones.includes(action.count)
      )
        throw new GameError(
          'Esta recompensa todavía no está disponible o ya fue recogida.',
        );
      validFamily(action.choice);
      farm.claimedMilestones.push(action.count);
      if (action.count === 6) farm.pollen += 3;
      if (action.count === 9) farm.theme = action.choice;
      if (action.count === 12)
        addSeed(
          farm,
          PLANTS.find(
            (plant) => plant.family === action.choice && plant.tier === 2,
          )!.id,
        );
      outcome = { message: '¡Recompensa del álbum recogida!' };
      break;
    }
    case 'theme': {
      validFamily(action.family);
      if (!farm.claimedMilestones.includes(9))
        throw new GameError(
          'Desbloquea primero el fondo botánico con 9 plantas cultivadas.',
        );
      farm.theme = action.family;
      outcome = { message: 'Fondo del herbario actualizado.' };
      break;
    }
    case 'voucher': {
      if (typeof action.playerName !== 'string')
        throw new GameError('Escribe tu nombre del grupo.');
      const name = action.playerName
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 48 || /[\p{Cc}\p{Cf}]/u.test(name))
        throw new GameError('Usa un nombre de entre 2 y 48 caracteres.');
      if (farm.coins < 1 || !voucherContext)
        throw new GameError('Cosecha monedas antes de emitir un vale.');
      const amount = Math.min(
        farm.coins,
        DAILY_COIN_LIMIT - farm.daily.redeemed,
      );
      if (amount < 1)
        throw new GameError(
          'Llegaste a 2.000 monedas en vales hoy. El saldo restante seguirá disponible mañana.',
          429,
        );
      if (farm.vouchers[0] && now - farm.vouchers[0].createdAt < 60_000)
        throw new GameError(
          'Espera un minuto entre vales. Puedes descargar otra vez el último.',
        );
      const voucher: AgroVoucher = {
        id: voucherContext.id,
        playerName: name,
        amount,
        createdAt: now,
        totalHarvested: farm.totalHarvested,
        plantsGrowing: farm.plots.filter(Boolean).length,
        redeemedAt: null,
        environment: voucherContext.environment,
      };
      farm.playerName = name;
      farm.coins -= amount;
      farm.daily.redeemed += amount;
      farm.vouchers = [voucher, ...farm.vouchers].slice(0, 100);
      outcome = {
        message:
          farm.coins > 0
            ? 'Vale emitido hasta el límite diario. Tu saldo restante seguirá disponible mañana.'
            : 'Vale emitido. Puedes descargarlo otra vez sin gastar monedas.',
        voucher,
      };
      break;
    }
    default:
      throw new GameError('Acción desconocida.');
  }
  farm.daily.actions += 1;
  farm.revision += 1;
  return { farm, outcome };
}
