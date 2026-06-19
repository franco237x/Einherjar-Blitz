/**
 * Gacha Data Constants — Einherjar Blitz Mobile
 * Centralized reward pool, rarity configs, and banner definitions.
 *
 * Local images use require() for static bundling.
 * Every item includes a `fallbackIcon` (Ionicons name) for when images fail or are missing.
 */

import { ImageSourcePropType } from 'react-native';
import { Colors } from './theme';

// ─── Rarity Configuration ───────────────────────────────────────────
export type RarityKey = 'mythic' | 'legendary' | 'epic' | 'rare' | 'common';

export interface RarityConfig {
  label: string;
  color: string;
  glowColor: string;
  stars: number;
  particleCount: number;
}

export const RARITIES: Record<RarityKey, RarityConfig> = {
  mythic: {
    label: 'MÍTICO',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    stars: 5,
    particleCount: 60,
  },
  legendary: {
    label: 'LEGENDARIO',
    color: Colors.primaryGold,
    glowColor: 'rgba(201, 170, 113, 0.6)',
    stars: 5,
    particleCount: 40,
  },
  epic: {
    label: 'ÉPICO',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    stars: 4,
    particleCount: 25,
  },
  rare: {
    label: 'RARO',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    stars: 3,
    particleCount: 15,
  },
  common: {
    label: 'COMÚN',
    color: 'rgba(255,255,255,0.6)',
    glowColor: 'rgba(255,255,255,0.15)',
    stars: 2,
    particleCount: 8,
  },
};

// ─── Reward Item ────────────────────────────────────────────────────
export interface RewardItem {
  name: string;
  type: 'persona' | 'invocacion' | 'otros';
  rarity: RarityKey;
  weight: number;
  image: ImageSourcePropType | null; // null = no image, use fallback
  fallbackIcon: string; // Ionicons name
}

// ─── Local Image Requires ───────────────────────────────────────────
// React Native requires static paths for require() — no dynamic strings.
const PERSONA_IMAGES = {
  // Personas
  wildCard: require('../../assets/images/gacha/rewards/persona/wild_card.jpg'),
  izanagi: require('../../assets/images/gacha/rewards/persona/izanagi.jpg'),
  satanael: require('../../assets/images/gacha/rewards/persona/satanael.jpg'),
  messiah: require('../../assets/images/gacha/rewards/persona/messiah.jpg'),
  orpheus: require('../../assets/images/gacha/rewards/persona/orpheus.jpg'),
  yoshitsune: require('../../assets/images/gacha/rewards/persona/yoshitsune.jpg'),
  lucifer: require('../../assets/images/gacha/rewards/persona/lucifer.jpg'),
  thanatos: require('../../assets/images/gacha/rewards/persona/thanatos.jpg'),
  jackFrost: require('../../assets/images/gacha/rewards/persona/jack_frost.jpg'),
  // Invocaciones
  makotoYuki: require('../../assets/images/gacha/rewards/persona/makoto_yuki.jpg'),
  renAmamiya: require('../../assets/images/gacha/rewards/persona/ren_amamiya.jpg'),
  yuNarukami: require('../../assets/images/gacha/rewards/persona/yu_narukami.jpg'),
  tatsuyaSuou: require('../../assets/images/gacha/rewards/persona/tatsuya_suou.jpg'),
  mayaAmano: require('../../assets/images/gacha/rewards/persona/maya_amano.jpg'),
  aigis: require('../../assets/images/gacha/rewards/persona/aigis.jpg'),
  kotoneShiomi: require('../../assets/images/gacha/rewards/persona/kotone_shiomi.jpg'),
  naoyaTodo: require('../../assets/images/gacha/rewards/persona/naoya_todou.jpg'),
  // Otros
  esencias: require('../../assets/images/gacha/rewards/persona/esencias_azules.avif'),
};

const BANNER_IMAGES = {
  persona: require('../../assets/images/gacha/banners/persona_banner.jpg'),
};

// ═══════════════════════════════════════════════════════════════════════
// REWARDS TABLE
// Ordered by rarity (rarest first). Weights determine drop probability.
// Total weight ≈ 1000 → easy to reason about percentages.
// ═══════════════════════════════════════════════════════════════════════

export const REWARDS_TABLE: RewardItem[] = [
  // ── MÍTICO — 0.1 % ────────────────────────────────────────────────
  {
    name: 'Wild Card',
    type: 'otros',
    rarity: 'mythic',
    weight: 1,
    image: PERSONA_IMAGES.wildCard,
    fallbackIcon: 'flash',
  },

  // ── LEGENDARIO — ~0.4 % ───────────────────────────────────────────
  {
    name: 'Izanagi-no-Okami',
    type: 'persona',
    rarity: 'legendary',
    weight: 2,
    image: PERSONA_IMAGES.izanagi,
    fallbackIcon: 'sunny',
  },
  {
    name: 'Makoto Yuki',
    type: 'invocacion',
    rarity: 'legendary',
    weight: 2,
    image: PERSONA_IMAGES.makotoYuki,
    fallbackIcon: 'person',
  },

  // ── ÉPICO — ~3 % ─────────────────────────────────────────────────
  {
    name: 'Satanael',
    type: 'persona',
    rarity: 'epic',
    weight: 5,
    image: PERSONA_IMAGES.satanael,
    fallbackIcon: 'skull',
  },
  {
    name: 'Ren Amamiya',
    type: 'invocacion',
    rarity: 'epic',
    weight: 5,
    image: PERSONA_IMAGES.renAmamiya,
    fallbackIcon: 'person',
  },
  {
    name: 'Messiah',
    type: 'persona',
    rarity: 'epic',
    weight: 10,
    image: PERSONA_IMAGES.messiah,
    fallbackIcon: 'star',
  },
  {
    name: 'Yu Narukami',
    type: 'invocacion',
    rarity: 'epic',
    weight: 10,
    image: PERSONA_IMAGES.yuNarukami,
    fallbackIcon: 'person',
  },

  // ── RARO — ~10 % ─────────────────────────────────────────────────
  {
    name: 'Orpheus Telos',
    type: 'persona',
    rarity: 'rare',
    weight: 20,
    image: PERSONA_IMAGES.orpheus,
    fallbackIcon: 'musical-notes',
  },
  {
    name: 'Tatsuya Suou',
    type: 'invocacion',
    rarity: 'rare',
    weight: 20,
    image: PERSONA_IMAGES.tatsuyaSuou,
    fallbackIcon: 'person',
  },
  {
    name: 'Yoshitsune',
    type: 'persona',
    rarity: 'rare',
    weight: 30,
    image: PERSONA_IMAGES.yoshitsune,
    fallbackIcon: 'shield',
  },
  {
    name: 'Maya Amano',
    type: 'invocacion',
    rarity: 'rare',
    weight: 30,
    image: PERSONA_IMAGES.mayaAmano,
    fallbackIcon: 'person',
  },

  // ── COMÚN — ~50 % ─────────────────────────────────────────────────
  {
    name: 'Lucifer',
    type: 'persona',
    rarity: 'common',
    weight: 50,
    image: PERSONA_IMAGES.lucifer,
    fallbackIcon: 'flame',
  },
  {
    name: 'Aigis',
    type: 'invocacion',
    rarity: 'common',
    weight: 50,
    image: PERSONA_IMAGES.aigis,
    fallbackIcon: 'hardware-chip',
  },
  {
    name: 'Thanatos',
    type: 'persona',
    rarity: 'common',
    weight: 80,
    image: PERSONA_IMAGES.thanatos,
    fallbackIcon: 'skull',
  },
  {
    name: 'Kotone Shiomi',
    type: 'invocacion',
    rarity: 'common',
    weight: 80,
    image: PERSONA_IMAGES.kotoneShiomi,
    fallbackIcon: 'person',
  },
  {
    name: 'Jack Frost',
    type: 'persona',
    rarity: 'common',
    weight: 120,
    image: PERSONA_IMAGES.jackFrost,
    fallbackIcon: 'snow',
  },
  {
    name: 'Naoya Todo',
    type: 'invocacion',
    rarity: 'common',
    weight: 120,
    image: PERSONA_IMAGES.naoyaTodo,
    fallbackIcon: 'person',
  },

  // ── RECURSO — base drop (~36 %) ───────────────────────────────────
  {
    name: '150 Esencias Azules',
    type: 'otros',
    rarity: 'common',
    weight: 365,
    image: PERSONA_IMAGES.esencias,
    fallbackIcon: 'water',
  },
];

// ─── Banner Definitions ─────────────────────────────────────────────
export interface BannerDef {
  id: string;
  title: string;
  subtitle: string;
  costType: 'keys' | 'spheres';
  costAmount: number;
  accentColor: string;
  bannerImage: ImageSourcePropType;
  iconName: string; // Ionicons
  rewards: RewardItem[];
}

export const BANNERS: BannerDef[] = [
  {
    id: 'persona',
    title: 'Habitación Terciopelo',
    subtitle: 'Personas · Invocaciones · Artefactos',
    costType: 'keys',
    costAmount: 1,
    accentColor: '#6366f1',
    bannerImage: BANNER_IMAGES.persona,
    iconName: 'diamond',
    rewards: REWARDS_TABLE,
  },
];

// ─── Pull Logic (Weighted RNG) ──────────────────────────────────────
export function pullReward(rewards: RewardItem[]): RewardItem {
  const totalWeight = rewards.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of rewards) {
    if (random < item.weight) return item;
    random -= item.weight;
  }

  return rewards[rewards.length - 1];
}

export function pullMultiple(rewards: RewardItem[], count: number): RewardItem[] {
  return Array.from({ length: count }, () => pullReward(rewards));
}

// ─── Drop-rate breakdown ────────────────────────────────────────────
// Aggregates the per-item weights into a probability (%) per rarity, derived
// directly from the reward table so it stays accurate if weights change.
export interface RarityOdds {
  rarity: RarityKey;
  percent: number; // 0–100
}

export function getRarityOdds(rewards: RewardItem[]): RarityOdds[] {
  const totalWeight = rewards.reduce((sum, item) => sum + item.weight, 0) || 1;
  const order: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
  const byRarity: Record<string, number> = {};
  for (const item of rewards) {
    byRarity[item.rarity] = (byRarity[item.rarity] || 0) + item.weight;
  }
  return order
    .filter((r) => byRarity[r] > 0)
    .map((r) => ({ rarity: r, percent: (byRarity[r] / totalWeight) * 100 }));
}
