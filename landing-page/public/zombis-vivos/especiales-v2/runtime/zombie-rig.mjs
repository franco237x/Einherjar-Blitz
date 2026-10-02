import { CLIPS as REGULAR_CLIPS, evaluatePose as regularPose, ZombieAnimator as RegularAnimator } from './base-rig.mjs';
export const CLIPS = Object.freeze({ ...REGULAR_CLIPS,
  run: { label: 'Correr', duration: 0.8, frames: 24, fps: 30, loop: true },
  smash: { label: 'Puñetazo pesado', duration: 1.6, frames: 48, fps: 30, loop: false },
});
const PARTS = ['reference', 'head', 'head-blink', 'head-bite', 'gear', 'torso', 'upper-back', 'lower-back',
  'upper-front', 'lower-front', 'thigh-back', 'shin-back', 'thigh-front', 'shin-front', 'effect'];
export const ZOMBIES = [
  { id: 'bruton', name: 'Brutón', anatomy: 'brute', role: 'Gigante sin armadura', color: '#777e53', sourceGrid: [4, 4],
    description: 'Hombros enormes, manos desnudas y una cabeza hundida entre ellos. Aguanta por su masa y descarga un puñetazo pesado.',
    motion: 'Pasos lentos con peso. Levanta el puño, carga el cuerpo y golpea; cabeza y brazo trasero llegan después.',
    partNames: [...PARTS, 'impact'], expressions: ['head', 'head-blink', 'head-bite'],
    clips: ['idle', 'walk', 'smash', 'hit', 'spawn', 'fall'], locomotion: 'walk',
    health: 800, armor: 0, gaitTempo: 0.8, stride: 10, stance: 0.6, recommendedScale: 1.25,
    biteTime: 0.52, smashTime: 0.86, smashDamage: 80, contact: [60, 191],
    layout: { hips: [179, 224], head: [138, 121], headSize: [103, 101], torsoSize: [169, 150],
      shoulders: [[245, 113], [123, 113]], arms: [49, 46], legs: [32, 29], legInset: 8,
      hipOffsets: [16, -16], legWidth: 54, shoeWidth: 75, armWidths: [55, 71] } },
  { id: 'rafago', name: 'Ráfago', anatomy: 'runner', role: 'Corredor acorazado', color: '#337c81', sourceGrid: [4, 4],
    description: 'Un corredor de fútbol americano con casco y hombreras. Se inclina hacia el jardín y lo cruza a toda velocidad.',
    motion: 'Rodillas altas, pies en vuelo y brazos bombeando. Casco y hombreras se desprenden juntos; sigue corriendo sin ellos.',
    partNames: [...PARTS, 'pads'], expressions: ['head', 'head-blink', 'head-bite'],
    clips: ['idle', 'run', 'bite', 'hit', 'spawn', 'fall', 'armor-break'], locomotion: 'run',
    health: 140, armor: 300, gaitTempo: 1, stride: 14, stance: 0.45, recommendedScale: 1,
    biteTime: 0.46, biteDamage: 16,
    layout: { hips: [188, 211], head: [133, 143], headSize: [82, 89], torsoSize: [96, 95],
      shoulders: [[197, 139], [159, 144]], arms: [31, 35], legs: [53, 48], legInset: 8,
      hipOffsets: [9, -9], legWidth: 35, shoeWidth: 49, armWidths: [26, 29],
      gear: [133, 145, 112, 112], pads: [179, 169, 130, 77] } },
];
export const clipsFor = character => Object.fromEntries(character.clips.map(clip => [clip, CLIPS[clip]]));
export const moveSpeed = character => 2 * character.stride / (CLIPS[character.locomotion].duration * character.stance) * character.gaitTempo;
export const afterClip = (clip, character) => CLIPS[clip].loop ? clip : clip === 'fall' ? 'dead' : character.locomotion;
export function animationEvents(character, clip) {
  if (clip === 'smash') return [{ type: 'smash', requiresContact: true, plantTarget: true, damage: character.smashDamage,
    position: character.contact, time: character.smashTime }];
  if (clip === 'bite') return [{ type: 'bite', plantTarget: true, damage: character.biteDamage,
    position: [87, 119], time: character.biteTime, repeat: 'once per cycle' }];
  if (clip === 'armor-break') return [{ type: 'animation-cue', cue: 'armor-drop', pieces: ['gear', 'pads'], gameplay: false, time: 0.16 }];
  if (clip === 'fall') return [{ type: 'animation-cue', cue: 'ground-impact', gameplay: false, time: 0.98 }];
  return [];
}
const TAU = Math.PI * 2, rad = n => n * Math.PI / 180, clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const pulse = (n, a, peak, b) => n < peak ? ease((n - a) / (peak - a)) : 1 - ease((n - peak) / (b - peak));
function key(time, values) {
  if (time <= values[0][0]) return values[0][1];
  for (let i = 1; i < values.length; i++) if (time <= values[i][0]) {
    const [t0, a] = values[i - 1], [t1, b] = values[i]; return a + (b - a) * ease((time - t0) / (t1 - t0));
  }
  return values.at(-1)[1];
}
function runningFoot(character, cycle, center) {
  const p = ((cycle % 1) + 1) % 1, stance = character.stance, stride = character.stride;
  if (p < stance) return [center - stride + 2 * stride * p / stance, 288];
  const swing = (p - stance) / (1 - stance);
  return [center + stride - 2 * stride * ease(swing), 288 - Math.sin(swing * Math.PI) * 34];
}
export function evaluatePose(character, clip, seconds) {
  const surrogate = clip === 'run' ? 'walk' : clip === 'smash' ? 'bite' : clip;
  const p = regularPose(character, surrogate, seconds / CLIPS[clip].duration * REGULAR_CLIPS[surrogate].duration);
  const phase = p.progress * TAU, wave = Math.sin(phase), lag = Math.sin(phase - 0.45) + Math.sin(0.45);
  p.fallFit = clip === 'fall' ? key(p.progress, [[0, 1], [0.3, 1], [0.7, 0.77], [1, 0.77]]) : 1;
  if (character.anatomy === 'brute') {
    p.armBack = -6 + lag * 2; p.armFront = 9 - lag * 2; p.elbowBack = 4; p.elbowFront = 8;
    if (clip === 'walk') { p.hipsY -= (1 - Math.cos(phase * 2)) * 0.8; p.torso = lag * 1.5; }
    if (clip === 'smash') {
      p.armFront = key(p.progress, [[0, 9], [0.32, 135], [0.44, 135], [0.5375, 55], [0.65, 40], [1, 9]]);
      p.elbowFront = key(p.progress, [[0, 8], [0.32, -12], [0.44, -12], [0.5375, 4], [1, 8]]);
      p.armBack = key(p.progress, [[0, -6], [0.35, -18], [0.58, 18], [1, -6]]);
      p.hipsY += key(p.progress, [[0, 0], [0.3, -5], [0.44, -5], [0.56, 9], [1, 0]]);
      p.torso = key(p.progress, [[0, 0], [0.35, 4], [0.5375, -5], [1, 0]]);
      p.head = key(p.progress, [[0, 0], [0.4, -4], [0.62, 6], [1, 0]]);
      p.biting = p.progress > 0.18 && p.progress < 0.76;
      p.dust = pulse(p.progress, 0.5375, 0.59, 0.86);
    }
    if (clip === 'fall') { p.armFront = 8; p.armBack = -6; }
  } else {
    p.torso -= clip === 'run' ? 21 : 12;
    p.armBack = 18 - lag * 4; p.armFront = 28 + lag * 4; p.elbowBack = 87; p.elbowFront = 82;
    if (clip === 'run') {
      [p.footBackX, p.footBackY] = runningFoot(character, p.progress + 0.5, character.layout.hips[0] + 9);
      [p.footFrontX, p.footFrontY] = runningFoot(character, p.progress, character.layout.hips[0] - 9);
      p.armBack = 20 - wave * 52; p.armFront = 20 + wave * 52;
      p.hipsY -= (1 - Math.cos(phase * 2)) * 4; p.headY = -Math.sin(phase * 2) * 1.1;
      p.head = lag * 1.1; p.gearWobble = lag * 0.8; p.blink = false;
    }
    if (clip === 'bite') { p.armFront += pulse(p.progress, 0.12, character.biteTime / 1.2, 0.7) * 16; }
    if (clip === 'fall') { p.armFront = 28; p.armBack = 18; }
  }
  return p;
}
function image(ctx, part, x, y, maxWidth, maxHeight, angle = 0, ax = 0.5, ay = 0.5) {
  const scale = Math.min(maxWidth / part.width, maxHeight / part.height), w = part.width * scale, h = part.height * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rad(angle)); ctx.drawImage(part, -w * ax, -h * ay, w, h); ctx.restore();
}
function bone(ctx, part, from, to, width, ax = 0.55) {
  const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy), h = length + 8;
  const w = width;
  ctx.save(); ctx.translate(...from); ctx.rotate(Math.atan2(-dx, dy)); ctx.drawImage(part, -w * ax, -5, w, h); ctx.restore();
}
function chain(ctx, upper, lower, origin, lengths, a, b, widths, section = 'both') {
  const elbow = [origin[0] - Math.sin(rad(a)) * lengths[0], origin[1] + Math.cos(rad(a)) * lengths[0]];
  const wrist = [elbow[0] - Math.sin(rad(a + b)) * lengths[1], elbow[1] + Math.cos(rad(a + b)) * lengths[1]];
  if (section !== 'upper') bone(ctx, lower, elbow, wrist, widths[1]);
  if (section !== 'lower') bone(ctx, upper, origin, elbow, widths[0]);
}
function leg(ctx, thigh, shin, hip, target, lengths, widths) {
  // Split the painted shin/boot mechanically; the boot stays flat during support.
  const cut = Math.floor(shin.height * 0.48), shoeH = (shin.height - cut) / shin.width * widths[1];
  const ankle = [target[0] + widths[1] * 0.2, target[1] - shoeH * 0.72];
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1], distance = Math.max(0.001, Math.hypot(dx, dy));
  const d = Math.min(distance, lengths[0] + lengths[1] - 0.01), ux = dx / distance, uy = dy / distance;
  const along = (lengths[0] ** 2 - lengths[1] ** 2 + d ** 2) / (2 * d), bend = Math.sqrt(Math.max(0, lengths[0] ** 2 - along ** 2));
  const knee = [hip[0] + ux * along - uy * bend, hip[1] + uy * along + ux * bend];
  const calfDX = ankle[0] - knee[0], calfDY = ankle[1] - knee[1], calfH = Math.hypot(calfDX, calfDY) + 8;
  ctx.save(); ctx.translate(...knee); ctx.rotate(Math.atan2(-calfDX, calfDY));
  ctx.drawImage(shin, 0, 0, shin.width, cut + 6, -widths[0] * 0.4, -5, widths[0] * 0.8, calfH); ctx.restore();
  bone(ctx, thigh, hip, knee, widths[0], 0.5);
  ctx.save(); ctx.translate(...target); ctx.rotate(rad(Math.min(18, (288 - target[1]) * 0.55)));
  ctx.drawImage(shin, 0, cut, shin.width, shin.height - cut, -widths[1] * 0.5, -shoeH, widths[1], shoeH); ctx.restore();
}
export function renderZombie(ctx, character, parts, clip = character.locomotion, seconds = 0,
  { armorRatio = 1, transitionPose = null, transitionWeight = 1 } = {}) {
  const p = evaluatePose(character, clip, seconds);
  if (transitionPose) for (const field of Object.keys(p)) if (typeof p[field] === 'number' && field !== 'progress')
    p[field] = transitionPose[field] + (p[field] - transitionPose[field]) * ease(transitionWeight);
  const l = character.layout, hips = [p.hipsX, p.hipsY], widths = l.armWidths;
  ctx.save(); ctx.globalAlpha *= p.opacity;
  ctx.translate(160, 288); ctx.scale(1, p.grow); ctx.translate(-160, -288);
  ctx.translate(160, 180); ctx.scale(p.fallFit, p.fallFit); ctx.translate(-160, -180);
  ctx.translate(160 + p.fallShift, 180 + p.fallDrop); ctx.rotate(rad(p.fallAngle)); ctx.translate(-160, -180);
  leg(ctx, parts['thigh-back'], parts['shin-back'], [hips[0] + l.hipOffsets[0], hips[1] - l.legInset], [p.footBackX, p.footBackY], l.legs, [l.legWidth, l.shoeWidth]);
  leg(ctx, parts['thigh-front'], parts['shin-front'], [hips[0] + l.hipOffsets[1], hips[1] - l.legInset], [p.footFrontX, p.footFrontY], l.legs, [l.legWidth, l.shoeWidth]);
  ctx.save(); ctx.translate(...hips); ctx.rotate(rad(p.torso)); ctx.translate(-l.hips[0], -l.hips[1]);
  chain(ctx, parts['upper-back'], parts['lower-back'], l.shoulders[0], l.arms, p.armBack, p.elbowBack, widths);
  chain(ctx, parts['upper-front'], parts['lower-front'], l.shoulders[1], l.arms, p.armFront, p.elbowFront, widths, 'upper');
  image(ctx, parts.torso, ...l.hips, ...l.torsoSize, 0, 0.5, 1);
  const armored = character.armor > 0 && (armorRatio > 0 || clip === 'armor-break');
  const dropped = clip === 'armor-break' && seconds >= 0.16;
  const drop = clamp((seconds - 0.16) / 0.64);
  if (armored) {
    ctx.save(); if (dropped) ctx.globalAlpha *= 1 - ease((drop - 0.55) / 0.45);
    const [x, y, w, h] = l.pads;
    image(ctx, parts.pads, x + (dropped ? drop * 55 : 0), y + (dropped ? drop * 70 : 0), w, h, dropped ? drop * 40 : p.gearWobble, 0.5, 1); ctx.restore();
  }
  ctx.save(); ctx.translate(l.head[0] + p.headX, l.head[1] + p.headY); ctx.rotate(rad(p.head)); ctx.translate(-l.head[0], -l.head[1]);
  image(ctx, parts[p.blink ? 'head-blink' : p.biting ? 'head-bite' : 'head'], ...l.head, ...l.headSize, 0, 0.5, 1);
  if (armored) {
    ctx.save(); if (dropped) ctx.globalAlpha *= 1 - ease((drop - 0.55) / 0.45);
    const [x, y, w, h] = l.gear;
    image(ctx, parts.gear, x + (dropped ? drop * 66 : 0), y + (dropped ? -Math.sin(drop * Math.PI) * 23 + drop * 68 : 0), w, h,
      dropped ? drop * 110 : p.gearWobble, 0.5, 1); ctx.restore();
  }
  ctx.restore();
  chain(ctx, parts['upper-front'], parts['lower-front'], l.shoulders[1], l.arms, p.armFront, p.elbowFront, widths, 'lower');
  ctx.restore(); ctx.restore();
  if (p.dust > 0) {
    ctx.save(); ctx.globalAlpha *= p.dust * 0.75;
    const smash = clip === 'smash', ground = clip === 'fall' || clip === 'spawn';
    image(ctx, smash ? parts.impact : parts.effect, smash ? 63 : ground ? 160 : 107,
      smash ? 229 : ground ? 282 : 163, smash ? 90 : ground ? 100 : 54, smash ? 79 : ground ? 40 : 40); ctx.restore();
  }
  return p;
}
export async function loadZombie(id, baseURL = new URL('../', import.meta.url)) {
  const character = ZOMBIES.find(item => item.id === id); if (!character) throw new Error(`Unknown special zombie ${id}`);
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name => {
    const image = new Image(); image.src = new URL(`characters/${id}/parts/${name}.png`, baseURL).href; await image.decode(); return [name, image];
  })));
  return { character, parts };
}
export class ZombieAnimator extends RegularAnimator {
  constructor(character, parts, options = {}) { super(character, parts, options); this.clip = character.locomotion; }
  play(clip) {
    if (!CLIPS[clip]) throw new Error(`Unknown clip ${clip}`);
    if (!this.character.clips.includes(clip) || (this.dead || this.dying) && clip !== 'spawn') return false;
    if (clip === 'armor-break' && !this.character.armor) return false;
    this.transitionPose = clip === 'spawn' ? null : evaluatePose(this.character, this.clip, this.seconds);
    this.transitionTime = 0; this.clip = clip; this.seconds = 0; this.released = false;
    if (clip === 'spawn') { this.health = this.character.health; this.armor = this.character.armor; this.dead = false; this.dying = false; this.speedMultiplier = 1; }
    if (clip === 'fall') { this.health = 0; this.dying = true; }
    if (clip === 'armor-break') this.armor = 0;
    return true;
  }
  update(seconds) {
    if (this.dead) return 0;
    let remaining = Number.isFinite(seconds) ? Math.max(0, seconds) : 0, movement = 0;
    while (remaining > 1e-10) {
      const info = CLIPS[this.clip], current = this.clip, moving = current === this.character.locomotion;
      const factor = moving ? this.character.gaitTempo * this.speedMultiplier : 1; if (factor === 0) break;
      const event = animationEvents(this.character, current)[0];
      const toEvent = event && !this.released ? Math.max(0, event.time - this.seconds) / factor : Infinity;
      const step = Math.min(remaining, (info.duration - this.seconds) / factor, toEvent);
      this.transitionTime += step;
      if (moving) movement -= moveSpeed(this.character) * this.speedMultiplier * step;
      this.seconds += step * factor; remaining -= step;
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
  draw(ctx) { return renderZombie(ctx, this.character, this.parts, this.clip, this.seconds,
    { armorRatio: this.character.armor ? this.armor / this.character.armor : 1,
      transitionPose: this.transitionPose, transitionWeight: this.transitionTime / 0.16 }); }
}
