/** Full-body painted poses. Logical canvas 320×320; ground y=288. */
export const CLIPS = Object.freeze({
  idle: { label: 'Reposo', duration: 2.4, frames: 72, fps: 30, loop: true },
  walk: { label: 'Caminar', duration: 1.2, frames: 36, fps: 30, loop: true },
  run: { label: 'Correr', duration: 0.8, frames: 24, fps: 30, loop: true },
  smash: { label: 'Puñetazo pesado', duration: 1.2, frames: 36, fps: 30, loop: false },
  bite: { label: 'Morder', duration: 0.8, frames: 24, fps: 30, loop: true },
  hit: { label: 'Recibir golpe', duration: 0.4, frames: 12, fps: 30, loop: false },
  spawn: { label: 'Entrar', duration: 0.6, frames: 18, fps: 30, loop: false },
  fall: { label: 'Caer', duration: 0.8, frames: 24, fps: 30, loop: false },
  'armor-break': { label: 'Perder protección', duration: 0.6, frames: 18, fps: 30, loop: false },
});
export const ZOMBIES = [
  { id: 'bruton', name: 'Brutón', role: 'Gigante sin armadura', color: '#777e53',
    description: 'Un gigante de pecho desnudo, brazos largos y puños enormes. Avanza con peso y golpea con todo el cuerpo.',
    motion: 'Cuerpo completo dibujado en cada pose: pasos pesados, preparación del puño, impacto y recuperación.',
    clips: ['idle', 'walk', 'smash', 'hit', 'spawn', 'fall'], locomotion: 'walk',
    health: 800, armor: 0, speed: 11.11111111111111, recommendedScale: 1.75,
    sheets: ['walk', 'smash', 'states'], smashTime: 0.7, smashDamage: 80 },
  { id: 'rafago', name: 'Ráfago', role: 'Corredor acorazado', color: '#337c81',
    description: 'Un corredor de fútbol americano con casco y hombreras. Piernas en extensión y codos bombeando al correr.',
    motion: 'Carrera y ataque dibujados por poses completas. Continúa corriendo al perder el casco y las hombreras.',
    clips: ['idle', 'run', 'bite', 'hit', 'spawn', 'fall', 'armor-break'], locomotion: 'run',
    health: 140, armor: 300, speed: 77.77777777777777, recommendedScale: 1,
    sheets: ['run', 'bite', 'states', 'run-unarmored', 'bite-unarmored', 'states-unarmored'], biteTime: 0.4, biteDamage: 16 },
];
export const clipsFor = character => Object.fromEntries(character.clips.map(clip => [clip, CLIPS[clip]]));
export const moveSpeed = character => character.speed;
export const afterClip = (clip, character) => CLIPS[clip].loop ? clip : clip === 'fall' ? 'dead' : character.locomotion;
export function animationEvents(character, clip) {
  if (clip === 'smash') return [{ type: 'smash', requiresContact: true, plantTarget: true, damage: character.smashDamage, position: [44, 189], time: character.smashTime }];
  if (clip === 'bite') return [{ type: 'bite', plantTarget: true, damage: character.biteDamage, position: [89, 153], time: character.biteTime, repeat: 'once per cycle' }];
  if (clip === 'armor-break') return [{ type: 'animation-cue', cue: 'armor-drop', pieces: ['gear', 'pads'], gameplay: false, time: 0.16 }];
  if (clip === 'fall') return [{ type: 'animation-cue', cue: 'ground-impact', gameplay: false, time: 0.5 }];
  return [];
}
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
export function evaluatePose(character, clip, seconds, armorRatio = 1) {
  const info = CLIPS[clip], progress = clamp(seconds / info.duration);
  const index = count => Math.min(count - 1, Math.floor(progress * count));
  let sheet = 'states', frame = 0, dy = 0, dx = 0, alpha = 1;
  if (['walk', 'run', 'smash', 'bite'].includes(clip)) { sheet = clip; frame = index(12); }
  if (clip === 'idle') { frame = progress >= 0.71 && progress < 0.79 ? 1 : 0; dy = -Math.sin(progress * Math.PI * 2) * 0.7; }
  if (clip === 'hit') frame = [2, 3, 4, 5][index(4)];
  if (clip === 'fall') frame = [0, 6, 7, 8, 9, 10, 11, 11][index(8)];
  if (clip === 'spawn') { alpha = ease(progress / 0.6); dx = (1 - ease(progress)) * 12; }
  if (clip === 'armor-break') frame = [2, 3, 4, 5][index(4)];
  if (character.armor && (armorRatio <= 0 || clip === 'armor-break' && seconds >= 0.16) && clip !== 'spawn') sheet += '-unarmored';
  return { sheet, frame, dy, dx, alpha, progress };
}
function piece(ctx, image, x, y, width, height, angle, opacity) {
  const size = Math.min(width / image.width, height / image.height), w = image.width * size, h = image.height * size;
  ctx.save(); ctx.globalAlpha *= opacity; ctx.translate(x, y); ctx.rotate(angle); ctx.drawImage(image, -w / 2, -h / 2, w, h); ctx.restore();
}
export function renderZombie(ctx, character, parts, clip = character.locomotion, seconds = 0, { armorRatio = 1 } = {}) {
  const p = evaluatePose(character, clip, seconds, armorRatio);
  ctx.save(); ctx.scale(1.25, 1.25); ctx.globalAlpha *= p.alpha;
  ctx.drawImage(parts[p.sheet], (p.frame % 8) * 512, Math.floor(p.frame / 8) * 512, 512, 512, p.dx, p.dy, 256, 256);
  if (clip === 'armor-break' && seconds >= 0.16) {
    const drop = clamp((seconds - 0.16) / 0.44), alpha = 1 - ease((drop - 0.55) / 0.35);
    piece(ctx, parts.gear, 124 + drop * 57, 122 - Math.sin(drop * Math.PI) * 17 + drop * 38, 70, 74, drop * 1.9, alpha);
    piece(ctx, parts.pads, 164 + drop * 42, 148 + drop * 30, 82, 50, drop * 0.8, alpha);
  }
  ctx.restore(); return p;
}
export async function loadZombie(id, baseURL = new URL('../', import.meta.url)) {
  const character = ZOMBIES.find(item => item.id === id); if (!character) throw new Error(`Unknown zombie ${id}`);
  const names = [...character.sheets, ...(character.armor ? ['gear', 'pads'] : [])];
  const parts = Object.fromEntries(await Promise.all(names.map(async name => {
    const image = new Image(); image.src = new URL(`characters/${id}/poses/${name}.png`, baseURL).href; await image.decode(); return [name, image];
  })));
  return { character, parts };
}
export class ZombieAnimator {
  constructor(character, parts, { onEvent } = {}) {
    Object.assign(this, { character, parts, onEvent, clip: character.locomotion, seconds: 0, health: character.health,
      armor: character.armor, dead: false, dying: false, released: false, speedMultiplier: 1 });
  }
  play(clip) {
    if (!CLIPS[clip]) throw new Error(`Unknown clip ${clip}`);
    if (!this.character.clips.includes(clip) || (this.dead || this.dying) && clip !== 'spawn') return false;
    if (clip === 'armor-break' && !this.character.armor) return false;
    this.clip = clip; this.seconds = 0; this.released = false;
    if (clip === 'spawn') Object.assign(this, { health: this.character.health, armor: this.character.armor, dead: false, dying: false, speedMultiplier: 1 });
    if (clip === 'fall') { this.health = 0; this.dying = true; }
    if (clip === 'armor-break') this.armor = 0;
    return true;
  }
  setSpeedMultiplier(value) { this.speedMultiplier = Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 1; }
  applyDamage(damage) {
    if (this.dead || this.dying || !Number.isFinite(damage) || damage <= 0) return { damage: 0, armorLost: 0, healthLost: 0, killed: false };
    const armorBefore = this.armor, healthBefore = this.health, absorbed = Math.min(this.armor, damage);
    this.armor -= absorbed; this.health = Math.max(0, this.health - damage + absorbed);
    const killed = this.health === 0;
    this.play(killed ? 'fall' : armorBefore > 0 && this.armor === 0 ? 'armor-break' : 'hit');
    return { damage, armorLost: absorbed, healthLost: healthBefore - this.health, killed };
  }
  update(seconds) {
    if (this.dead) return 0;
    let remaining = Number.isFinite(seconds) ? Math.max(0, seconds) : 0, movement = 0;
    while (remaining > 1e-10) {
      const current = this.clip, info = CLIPS[current], moving = current === this.character.locomotion;
      const factor = moving ? this.speedMultiplier : 1; if (factor === 0) break;
      const event = animationEvents(this.character, current)[0];
      const step = Math.min(remaining, (info.duration - this.seconds) / factor,
        event && !this.released ? Math.max(0, event.time - this.seconds) / factor : Infinity);
      this.seconds += step * factor; remaining -= step;
      if (moving) movement -= moveSpeed(this.character) * this.speedMultiplier * step;
      if (event && !this.released && this.seconds >= event.time - 1e-10) {
        this.released = true; this.onEvent?.({ ...event, zombie: this.character.id }); if (this.clip !== current) continue;
      }
      if (this.seconds >= info.duration - 1e-10) {
        if (info.loop) { this.seconds = 0; this.released = false; }
        else if (current === 'fall') { this.seconds = info.duration; this.dead = true; break; }
        else this.play(this.character.locomotion);
      }
    }
    return movement;
  }
  draw(ctx) { return renderZombie(ctx, this.character, this.parts, this.clip, this.seconds, { armorRatio: this.character.armor ? this.armor / this.character.armor : 1 }); }
}
