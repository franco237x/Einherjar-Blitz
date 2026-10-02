import { loadZombie, ZombieAnimator } from '../../zombis-vivos/runtime/zombie-rig.mjs';
import { createAromaStatus, applyAroma, updateAroma, applyAcid, applyPunch } from './fresh-mechanics.mjs';

const targets = new Map();
export async function loadPracticeTarget(id = 'conero') {
  if (!targets.has(id)) targets.set(id, loadZombie(id));
  return targets.get(id);
}

/** Static practice position: the actual game owns movement and target selection. */
export class FreshPractice {
  constructor(data, plant) { this.data = data; this.plant = plant; this.reset(); }
  reset() {
    this.bites = 0; this.hits = 0; this.misses = 0; this.flash = 0; this.aroma = createAromaStatus();
    this.target = new ZombieAnimator(this.data.character, this.data.parts, { onEvent: () => this.bites++ });
    this.target.x = this.plant.attackStyle === 'punch' ? 282 : 370;
    this.target.lane = 0; this.target.play('bite');
  }
  setFar(far) { this.target.x = far ? 420 : this.plant.attackStyle === 'punch' ? 282 : 370; }
  receive(event) {
    let result;
    if (event.type === 'aroma') result = { hit: applyAroma(this.aroma, event, this.target) };
    if (event.type === 'acid') result = applyAcid(event, this.target);
    if (event.type === 'punch') result = applyPunch(event, this.target);
    if (!result) return null;
    if (result.hit) { this.hits++; this.flash = 0.25; } else this.misses++;
    return result;
  }
  update(seconds) {
    const canBite = updateAroma(this.aroma, seconds);
    this.flash = Math.max(0, this.flash - seconds);
    this.target.update(seconds);
    if (canBite && this.target.clip === 'walk') this.target.play('bite');
  }
  snapshot() {
    return { health: this.target.health, armor: this.target.armor, hits: this.hits, misses: this.misses,
      bites: this.bites, blocked: this.aroma.biteBlockedRemaining, clip: this.target.clip, x: this.target.x };
  }
  draw(ctx, parts, dark) {
    ctx.save(); ctx.translate(this.target.x - 106, 0); this.target.draw(ctx); ctx.restore();
    if (this.flash > 0) {
      ctx.save(); ctx.globalAlpha *= this.flash / 0.25;
      const size = this.plant.attackStyle === 'aroma' ? 90 : 48;
      const effect = parts.effect;
      ctx.drawImage(effect, this.target.x - size / 2, 181 - size / 2, size, size); ctx.restore();
    }
    ctx.fillStyle = dark ? '#e5f1dd' : '#315345'; ctx.textAlign = 'center'; ctx.font = '11px Trebuchet MS';
    ctx.fillText(this.target.health <= 0 ? 'Sin objetivo' : this.aroma.biteBlockedRemaining > 0 ? 'Mordisco interrumpido' : 'Objetivo de práctica', this.target.x + 56, 315);
    ctx.textAlign = 'start';
  }
}
