/** Left-facing articulated cutouts. Logical canvas 320×320; soles at y=288. */
export const CLIPS = Object.freeze({
  idle: { label: 'Reposo', duration: 2.4, frames: 72, fps: 30, loop: true },
  walk: { label: 'Caminar', duration: 2.4, frames: 72, fps: 30, loop: true },
  bite: { label: 'Morder', duration: 1.2, frames: 36, fps: 30, loop: true },
  hit: { label: 'Recibir golpe', duration: 0.6, frames: 18, fps: 30, loop: false },
  spawn: { label: 'Entrar', duration: 1, frames: 30, fps: 30, loop: false },
  fall: { label: 'Caer', duration: 1.4, frames: 42, fps: 30, loop: false },
  'armor-break': { label: 'Perder protección', duration: 0.8, frames: 24, fps: 30, loop: false },
});
const PARTS = ['reference', 'head', 'head-blink', 'head-bite', 'gear', 'torso', 'upper-back', 'lower-back',
  'upper-front', 'lower-front', 'thigh-back', 'shin-back', 'thigh-front', 'shin-front', 'effect'];
const BASE = ['idle', 'walk', 'bite', 'hit', 'spawn', 'fall'];
export const ZOMBIES = [
  {
    id: 'despistado', name: 'Despistado', role: 'Zombi común', color: '#70846d',
    description: 'Largo, desgarbado y distraído. Arrastra los zapatos y alcanza el jardín con las manos flojas.',
    motion: 'Paso arrastrado, rodillas blandas y cabeza que llega tarde. Estira los brazos antes de morder.',
    partNames: PARTS, clips: BASE, expressions: ['head', 'head-blink', 'head-bite'],
    health: 100, armor: 0, gaitTempo: 1, stride: 16, biteTime: 0.52, biteDamage: 10,
    layout: { hips: [173, 211], head: [143, 152], headSize: [83, 88], torsoSize: [76, 78],
      shoulders: [[184, 151], [161, 156]], arms: [31, 35], legs: [41, 43],
      hipOffsets: [8, -8], legWidth: 34, shoeWidth: 43, gear: [143, 72, 25, 29] },
  },
  {
    id: 'conero', name: 'Conero', role: 'Zombi con cono', color: '#c88943',
    description: 'Bajo, testarudo y confundido. Su cono torcido absorbe los primeros golpes.',
    motion: 'Pasos cortos y codos inquietos. El cono se bambolea y sale despedido cuando pierde su protección.',
    partNames: PARTS, clips: [...BASE, 'armor-break'], expressions: ['head', 'head-blink', 'head-bite'],
    health: 100, armor: 100, gaitTempo: 1.08, stride: 14, biteTime: 0.52, biteDamage: 10,
    layout: { hips: [171, 218], head: [146, 168], headSize: [94, 83], torsoSize: [91, 81], torsoOffset: 11,
      shoulders: [[153, 165], [184, 167]], arms: [27, 31], legs: [37, 40],
      hipOffsets: [10, -10], legWidth: 40, shoeWidth: 52, gear: [147, 107, 81, 75] },
  },
  {
    id: 'balderon', name: 'Balderón', role: 'Zombi con balde', color: '#738ea0',
    description: 'Ancho, pesado y sin ninguna prisa. Su balde abollado aguanta más golpes antes de desprenderse.',
    motion: 'Pisadas pesadas, torso con inercia y brazos bajos. El balde cae con un giro corto y un golpe seco.',
    partNames: PARTS, clips: [...BASE, 'armor-break'], expressions: ['head', 'head-blink', 'head-bite'],
    health: 100, armor: 240, gaitTempo: 0.82, stride: 13, biteTime: 0.52, biteDamage: 10,
    layout: { hips: [174, 221], head: [150, 166], headSize: [96, 89], torsoSize: [108, 83],
      shoulders: [[166, 168], [196, 166]], arms: [30, 34], legs: [36, 40],
      hipOffsets: [12, -12], legWidth: 45, shoeWidth: 55, gear: [152, 112, 100, 65] },
  },
];
export const clipsFor = character => Object.fromEntries(character.clips.map(clip => [clip, CLIPS[clip]]));
export const moveSpeed = character => 2 * character.stride / (CLIPS.walk.duration * 0.6) * character.gaitTempo;
export const afterClip = clip => CLIPS[clip].loop ? clip : clip === 'fall' ? 'dead' : 'walk';
export function animationEvents(character, clip) {
  if (clip === 'bite') return [{ type: 'bite', plantTarget: true, damage: character.biteDamage,
    position: [91, character.layout.head[1] - 21], time: character.biteTime, repeat: 'once per cycle' }];
  if (clip === 'armor-break') return [{ type: 'animation-cue', cue: 'armor-drop', gameplay: false, time: 0.16 }];
  if (clip === 'fall') return [{ type: 'animation-cue', cue: 'ground-impact', gameplay: false, time: 0.98 }];
  return [];
}
const TAU = Math.PI * 2, rad = value => value * Math.PI / 180;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const pulse = (t, a, peak, b) => t < peak ? ease((t - a) / (peak - a)) : 1 - ease((t - peak) / (b - peak));
function key(t, values) {
  if (t <= values[0][0]) return values[0][1];
  for (let i = 1; i < values.length; i++) if (t <= values[i][0]) {
    const [at, av] = values[i - 1], [bt, bv] = values[i]; return av + (bv - av) * ease((t - at) / (bt - at));
  }
  return values.at(-1)[1];
}

/** A stance foot moves backwards relative to world travel; the swing returns it in an arc. */
function foot(character, cycle, center) {
  const p = ((cycle % 1) + 1) % 1, stride = character.stride;
  if (p < 0.6) return [center - stride + 2 * stride * p / 0.6, 288];
  const swing = (p - 0.6) / 0.4;
  return [center + stride - 2 * stride * ease(swing), 288 - Math.sin(swing * Math.PI) * (character.id === 'balderon' ? 8 : 12)];
}

export function evaluatePose(character, clip, seconds) {
  const info = CLIPS[clip]; if (!info) throw new Error(`Unknown clip ${clip}`);
  const progress = clamp(seconds / info.duration), phase = progress * TAU;
  const hips = character.layout.hips, [backOffset, frontOffset] = character.layout.hipOffsets;
  const pose = { progress, hipsX: hips[0], hipsY: hips[1], torso: 0, head: 0, headX: 0, headY: 0,
    armBack: 39, armFront: 48, elbowBack: 17, elbowFront: 20, blink: false, biting: false,
    footBackX: hips[0] + backOffset + 5, footBackY: 288,
    footFrontX: hips[0] + frontOffset - 7, footFrontY: 288,
    grow: 1, opacity: 1, dust: 0, fallAngle: 0, fallDrop: 0, fallShift: 0, gearWobble: 0 };
  if (clip === 'idle' || clip === 'walk') {
    const wave = Math.sin(phase), lag = Math.sin(phase - 0.45) + Math.sin(0.45);
    pose.torso = wave * (character.id === 'balderon' ? 1 : 1.8);
    pose.head = lag * 2; pose.headY = Math.sin(phase * 2) * 0.75;
    pose.armBack += lag * 3.5; pose.armFront -= lag * 4.2; pose.gearWobble = lag * 1.3;
    pose.blink = progress > 0.71 && progress < 0.78;
    if (clip === 'walk') {
      pose.hipsY -= (1 - Math.cos(phase * 2)) * (character.id === 'balderon' ? 1.7 : 1.1);
      [pose.footBackX, pose.footBackY] = foot(character, progress + 0.5, hips[0] + backOffset);
      [pose.footFrontX, pose.footFrontY] = foot(character, progress, hips[0] + frontOffset);
      pose.armBack += wave * 6; pose.armFront -= wave * 7;
      pose.headX = -Math.sin(phase * 2) * 1.2;
    }
  }
  if (clip === 'bite') {
    const impact = character.biteTime / info.duration;
    const anticipation = pulse(progress, 0.04, impact - 0.10, impact + 0.03);
    const chomp = pulse(progress, impact - 0.09, impact, impact + 0.24);
    pose.hipsX += anticipation * 2 - chomp * 5;
    pose.torso = anticipation * 2.5 - chomp * 4; pose.head = -anticipation * 3 + chomp * 2;
    pose.headX = -chomp * 5; pose.armBack += chomp * 13; pose.armFront += chomp * 18;
    pose.elbowBack += chomp * 2; pose.elbowFront -= chomp * 5;
    pose.biting = progress > impact - 0.16 && progress < impact + 0.17;
  }
  if (clip === 'hit' || clip === 'armor-break') {
    const hit = pulse(progress, 0, 0.16, 0.85);
    pose.hipsX += hit * 4; pose.torso = hit * 4; pose.head = -hit * 5;
    pose.armFront -= hit * 9; pose.armBack += hit * 5; pose.blink = progress < 0.45;
    pose.dust = pulse(progress, 0, 0.15, 0.55); pose.gearWobble = hit * -5;
  }
  if (clip === 'spawn') {
    pose.grow = key(progress, [[0, 0.04], [0.30, 0.68], [0.55, 1.025], [0.78, 0.99], [1, 1]]);
    pose.opacity = ease(progress / 0.18); pose.head = (1 - pose.grow) * -4;
    pose.dust = pulse(progress, 0.12, 0.35, 0.72);
  }
  if (clip === 'fall') {
    pose.fallAngle = key(progress, [[0, 0], [0.15, 8], [0.30, -19], [0.66, -72], [0.86, -88], [1, -88]]);
    pose.fallDrop = key(progress, [[0, 0], [0.17, 6], [0.38, -5], [0.70, 45], [0.87, 62], [1, 62]]);
    pose.fallShift = key(progress, [[0, 0], [0.70, 8], [1, 4]]);
    pose.armFront = key(progress, [[0, 48], [0.18, 62], [0.56, 8], [1, 8]]);
    pose.armBack = key(progress, [[0, 39], [0.18, 52], [0.56, 6], [1, 6]]);
    pose.elbowFront = key(progress, [[0, 20], [0.4, -12], [1, -12]]);
    pose.elbowBack = key(progress, [[0, 17], [0.4, -10], [1, -10]]);
    pose.blink = true; pose.dust = pulse(progress, 0.61, 0.73, 0.99);
  }
  return pose;
}

function image(ctx, part, x, y, maxWidth, maxHeight, angle = 0, ax = 0.5, ay = 0.5) {
  const scale = Math.min(maxWidth / part.width, maxHeight / part.height), w = part.width * scale, h = part.height * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rad(angle)); ctx.drawImage(part, -w * ax, -h * ay, w, h); ctx.restore();
}

// Each bone is painted downwards with rounded proximal joints. Extend overlap by 3 px.
function bone(ctx, part, from, to, width, ax = 0.55) {
  const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
  const h = length + 8, w = Math.min(width, part.width * h / part.height);
  ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(Math.atan2(-dx, dy));
  ctx.drawImage(part, -w * ax, -5, w, h); ctx.restore();
}
function chain(ctx, upper, lower, origin, lengths, a, b, widths, section = 'both') {
  const elbow = [origin[0] - Math.sin(rad(a)) * lengths[0], origin[1] + Math.cos(rad(a)) * lengths[0]];
  const wrist = [elbow[0] - Math.sin(rad(a + b)) * lengths[1], elbow[1] + Math.cos(rad(a + b)) * lengths[1]];
  if (section !== 'upper') bone(ctx, lower, elbow, wrist, widths[1]);
  if (section !== 'lower') bone(ctx, upper, origin, elbow, widths[0]);
}
function leg(ctx, thigh, shin, hip, target, lengths, widths) {
  const dx = target[0] - hip[0], dy = target[1] - hip[1], d = Math.min(Math.hypot(dx, dy), lengths[0] + lengths[1] - 0.01);
  const rawDistance = Math.hypot(dx, dy), ux = dx / rawDistance, uy = dy / rawDistance;
  const along = (lengths[0] ** 2 - lengths[1] ** 2 + d ** 2) / (2 * d);
  const bend = Math.sqrt(Math.max(0, lengths[0] ** 2 - along ** 2));
  const knee = [hip[0] + ux * along - uy * bend, hip[1] + uy * along + ux * bend];
  bone(ctx, shin, knee, target, widths[1], 0.65); bone(ctx, thigh, hip, knee, widths[0], 0.5);
}

/** Character only; walking distance and gameplay collisions belong to the caller. */
export function renderZombie(ctx, character, parts, clip = 'walk', seconds = 0,
  { armorRatio = 1, transitionPose = null, transitionWeight = 1 } = {}) {
  const pose = evaluatePose(character, clip, seconds);
  if (transitionPose) for (const field of Object.keys(pose)) {
    if (typeof pose[field] === 'number' && field !== 'progress') pose[field] = transitionPose[field] + (pose[field] - transitionPose[field]) * ease(transitionWeight);
  }
  const layout = character.layout, hips = [pose.hipsX, pose.hipsY];
  ctx.save(); ctx.globalAlpha *= pose.opacity;
  ctx.translate(160, 288); ctx.scale(1, pose.grow); ctx.translate(-160, -288);
  ctx.translate(160 + pose.fallShift, 180 + pose.fallDrop); ctx.rotate(rad(pose.fallAngle)); ctx.translate(-160, -180);
  leg(ctx, parts['thigh-back'], parts['shin-back'], [hips[0] + layout.hipOffsets[0], hips[1]],
    [pose.footBackX, pose.footBackY], layout.legs, [layout.legWidth, layout.shoeWidth]);
  leg(ctx, parts['thigh-front'], parts['shin-front'], [hips[0] + layout.hipOffsets[1], hips[1]],
    [pose.footFrontX, pose.footFrontY], layout.legs, [layout.legWidth, layout.shoeWidth]);
  ctx.save(); ctx.translate(hips[0], hips[1]); ctx.rotate(rad(pose.torso)); ctx.translate(-layout.hips[0], -layout.hips[1]);
  chain(ctx, parts['upper-back'], parts['lower-back'], layout.shoulders[0], layout.arms, pose.armBack, pose.elbowBack, [27, 30]);
  chain(ctx, parts['upper-front'], parts['lower-front'], layout.shoulders[1], layout.arms, pose.armFront, pose.elbowFront, [30, 33], 'upper');
  image(ctx, parts.torso, layout.hips[0], layout.hips[1] + (layout.torsoOffset ?? 3), ...layout.torsoSize, 0, 0.5, 1);
  ctx.save(); ctx.translate(layout.head[0] + pose.headX, layout.head[1] + pose.headY);
  ctx.rotate(rad(pose.head)); ctx.translate(-layout.head[0], -layout.head[1]);
  image(ctx, parts[pose.blink ? 'head-blink' : pose.biting ? 'head-bite' : 'head'], ...layout.head, ...layout.headSize, 0, 0.5, 1);
  if (character.armor === 0 || armorRatio > 0 || clip === 'armor-break') {
    const [x, y, width, height] = layout.gear;
    if (clip === 'armor-break' && seconds >= 0.16) {
      const t = clamp((seconds - 0.16) / 0.64);
      ctx.save(); ctx.globalAlpha *= 1 - ease((t - 0.55) / 0.45);
      image(ctx, parts.gear, x + t * 63, y - Math.sin(t * Math.PI) * 22 + t * 68,
        width, height, t * (character.id === 'conero' ? 135 : 72), 0.5, 1); ctx.restore();
    } else image(ctx, parts.gear, x, y, width, height, pose.gearWobble, 0.5, 1);
  }
  ctx.restore();
  chain(ctx, parts['upper-front'], parts['lower-front'], layout.shoulders[1], layout.arms, pose.armFront, pose.elbowFront, [30, 33], 'lower');
  ctx.restore(); ctx.restore();
  if (pose.dust > 0) {
    ctx.save(); ctx.globalAlpha *= pose.dust * 0.75;
    const isFall = clip === 'fall';
    image(ctx, parts.effect, isFall ? 158 : clip === 'spawn' ? 173 : 107,
      isFall || clip === 'spawn' ? 281 : 163, isFall ? 108 : 67, isFall ? 40 : 45); ctx.restore();
  }
  return pose;
}

export async function loadZombie(id, baseURL = new URL('../', import.meta.url)) {
  const character = ZOMBIES.find(item => item.id === id); if (!character) throw new Error(`Unknown zombie ${id}`);
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name => {
    const part = new Image(); part.src = new URL(`characters/${id}/parts/${name}.png`, baseURL).href; await part.decode(); return [name, part];
  })));
  return { character, parts };
}

export class ZombieAnimator {
  constructor(character, parts, { onEvent } = {}) {
    this.character = character; this.parts = parts; this.onEvent = onEvent;
    this.clip = 'walk'; this.seconds = 0; this.released = false; this.dead = false; this.dying = false;
    this.health = character.health; this.armor = character.armor; this.speedMultiplier = 1;
    this.transitionPose = null; this.transitionTime = 0.16;
  }
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
  setSpeedMultiplier(multiplier) { this.speedMultiplier = Number.isFinite(multiplier) ? Math.max(0, Math.min(2, multiplier)) : 1; }
  applyDamage(damage) {
    if (this.dead || this.clip === 'fall') return { damage: 0, armorLost: 0, healthLost: 0, killed: false };
    const incoming = Number.isFinite(damage) ? Math.max(0, damage) : 0;
    if (incoming === 0) return { damage: 0, armorLost: 0, healthLost: 0, killed: false };
    const armorBefore = this.armor, healthBefore = this.health;
    const absorbed = Math.min(this.armor, incoming); this.armor -= absorbed;
    this.health = Math.max(0, this.health - incoming + absorbed);
    const killed = this.health === 0;
    this.play(killed ? 'fall' : armorBefore > 0 && this.armor === 0 ? 'armor-break' : 'hit');
    return { damage: incoming, armorLost: absorbed, healthLost: healthBefore - this.health, killed };
  }
  update(seconds) {
    if (this.dead) return 0;
    let remaining = Number.isFinite(seconds) ? Math.max(0, seconds) : 0, movement = 0;
    // Consume overshoot so footsteps and bite cues remain reliable with irregular frame times.
    while (remaining > 1e-10) {
      const info = CLIPS[this.clip], current = this.clip;
      const factor = current === 'walk' ? this.character.gaitTempo * this.speedMultiplier : 1;
      if (factor === 0) break;
      const event = animationEvents(this.character, current)[0];
      const toEvent = event && !this.released ? Math.max(0, event.time - this.seconds) / factor : Infinity;
      const wallStep = Math.min(remaining, (info.duration - this.seconds) / factor, toEvent);
      this.transitionTime += wallStep;
      if (current === 'walk') movement -= moveSpeed(this.character) * this.speedMultiplier * wallStep;
      this.seconds += wallStep * factor; remaining -= wallStep;
      if (event && !this.released && this.seconds >= event.time - 1e-10) {
        this.released = true; this.onEvent?.({ ...event, zombie: this.character.id });
        if (this.clip !== current) continue;
      }
      if (this.seconds >= info.duration - 1e-10) {
        if (info.loop) { this.seconds = 0; this.released = false; }
        else if (current === 'fall') { this.seconds = info.duration; this.dead = true; break; }
        else this.play('walk');
      }
    }
    return movement;
  }
  draw(ctx) { return renderZombie(ctx, this.character, this.parts, this.clip, this.seconds,
    { armorRatio: this.character.armor ? this.armor / this.character.armor : 1,
      transitionPose: this.transitionPose, transitionWeight: this.transitionTime / 0.16 }); }
}
