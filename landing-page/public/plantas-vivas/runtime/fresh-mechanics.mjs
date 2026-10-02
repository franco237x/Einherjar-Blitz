/** Optional game adapters. Artwork and animation cues work without this module. */
const amount = value => Number.isFinite(value) ? Math.max(0, value) : 0;
const alive = target => target && !target.dead && !target.dying && target.health > 0;

export const createAromaStatus = () => ({ biteBlockedRemaining: 0 });

/** Interrupt biting, without changing movement speed, health, or armor. */
export function applyAroma(status, event, target) {
  if (!alive(target)) return false;
  status.biteBlockedRemaining = Math.max(status.biteBlockedRemaining, amount(event.interruptSeconds));
  if (target.clip === 'bite') target.play?.('hit');
  return true;
}

export function updateAroma(status, seconds) {
  status.biteBlockedRemaining = Math.max(0, status.biteBlockedRemaining - amount(seconds));
  return status.biteBlockedRemaining === 0;
}

/** Extra corrosion only destroys armor. Its unused amount never damages health. */
export function applyAcid(event, target) {
  if (!alive(target)) return { hit: false, armorLost: 0, healthLost: 0 };
  const armorBefore = amount(target.armor), healthBefore = target.health;
  const corrosion = Math.min(armorBefore, amount(event.armorDamage));
  target.armor = armorBefore - corrosion;
  const result = target.applyDamage(amount(event.damage));
  if (armorBefore > 0 && target.armor === 0 && !result.killed) target.play?.('armor-break');
  return { hit: true, armorLost: armorBefore - target.armor, healthLost: healthBefore - target.health, killed: result.killed };
}

/** Check the SAME lane, forward direction, and current distance on EACH punch cue. */
export function applyPunch(event, target, source = { x: event.origin[0], lane: 0, direction: 1 }) {
  if (!alive(target) || target.lane !== source.lane) return { hit: false, reason: 'unavailable' };
  const distance = (target.x - source.x) * (source.direction ?? 1);
  if (!Number.isFinite(distance) || distance < 0 || distance > event.range) return { hit: false, reason: 'out-of-range' };
  return { hit: true, hand: event.hand, ...target.applyDamage(amount(event.damage)) };
}
