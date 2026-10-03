// Painted rigid pieces: every draw uses a fixed UNIFORM scale and a rotation.
// Source joint coordinates and parent attachment points are exported in rig.json.
export const CLIPS = Object.freeze({
  idle: { label: 'Reposo', duration: 2.4, frames: 72, fps: 30, loop: true },
  walk: { label: 'Caminar', duration: 2.4, frames: 72, fps: 30, loop: true },
  run: { label: 'Correr', duration: 1, frames: 30, fps: 30, loop: true },
  smash: { label: 'Puñetazo pesado', duration: 1.4, frames: 42, fps: 30, loop: false },
  bite: { label: 'Morder', duration: 1, frames: 30, fps: 30, loop: true },
  hit: { label: 'Recibir golpe', duration: 0.4, frames: 12, fps: 30, loop: false },
  spawn: { label: 'Entrar', duration: 0.6, frames: 18, fps: 30, loop: false },
  fall: { label: 'Caer', duration: 1.2, frames: 36, fps: 30, loop: false },
  'armor-break': { label: 'Perder casco', duration: 0.6, frames: 18, fps: 30, loop: false },
});
const CORE = ['head', 'head-blink', 'head-bite', 'torso', 'pelvis'];
export const SHEETS = {
  core: [...CORE, 'extra'],
  arms: ['upper-back', 'forearm-back', 'hand-back', 'upper-front', 'forearm-front', 'hand-front'],
  legs: ['thigh-back', 'calf-back', 'shoe-back', 'thigh-front', 'calf-front', 'shoe-front'],
};
export const ZOMBIES = [
  { id: 'bruton', name: 'Brutón', role: 'Gigante sin armadura', anatomy: 'brute', color: '#7b8255',
    description: 'Un gigante de brazos enormes, manos desnudas y pasos pesados. Prepara el puño y descarga un golpe contra las plantas.',
    motion: 'Cadera, torso, cabeza y extremidades articulados. El puñetazo tiene preparación, contacto y recuperación.',
    health: 800, armor: 0, locomotion: 'walk', recommendedScale: 1.4, speed: 11.1111111111,
    clips: ['idle', 'walk', 'smash', 'hit', 'spawn', 'fall'],
    layout: { hips: [180, 228], torso: [168, 119], torsoAnchor: [0.5, 0.94], pelvis: [97, 55],
      shoulders: [[127, 137], [231, 134]], head: [174, 152], headSize: [92, 91], headAnchor: [0.72, 0.92],
      hipOffsets: [24, -19], legLengths: [23, 24], armLengths: [48, 44], handSize: [52, 57], shoeSize: [61, 27], stance: 0.64, stride: 8.53333333333 },
  },
  { id: 'rafago', name: 'Ráfago', role: 'Corredor con casco', anatomy: 'runner', color: '#337c81',
    description: 'Un corredor de fútbol americano con casco y hombreras. Cuando agota su protección, pierde sólo el casco y sigue corriendo.',
    motion: 'Piernas alternadas, brazos en contrapeso y breves fases de vuelo. Las hombreras permanecen unidas al torso.',
    health: 140, armor: 300, locomotion: 'run', recommendedScale: 1, speed: 77.7777777778,
    clips: ['idle', 'run', 'bite', 'hit', 'spawn', 'fall', 'armor-break'],
    layout: { hips: [186, 216], torso: [106, 91], torsoAnchor: [0.5, 0.93], pelvis: [60, 40],
      shoulders: [[158, 156], [211, 154]], head: [153, 150], headSize: [68, 91], headAnchor: [0.74, 0.94],
      hipOffsets: [11, -11], legLengths: [37, 36], armLengths: [30, 31], handSize: [21, 26], shoeSize: [45, 23], stance: 0.4, stride: 15.55555555556 },
  },
];
export const clipsFor = c => Object.fromEntries(c.clips.map(id => [id, CLIPS[id]]));
export const moveSpeed = c => c.speed;
export const afterClip = (clip, c) => CLIPS[clip].loop ? clip : clip === 'fall' ? 'dead' : c.locomotion;
export function animationEvents(c, clip) {
  if (clip === 'smash') return [{ type: 'smash', time: 0.7, requiresContact: true, plantTarget: true, damage: 80, position: [111, 202] }];
  if (clip === 'bite') return [{ type: 'bite', time: 0.5, requiresContact: true, plantTarget: true, damage: 16, position: [90, 134] }];
  if (clip === 'armor-break') return [{ type: 'animation-cue', cue: 'helmet-drop', pieces: ['helmet'], gameplay: false, time: 0.16 }];
  if (clip === 'fall') return [{ type: 'animation-cue', cue: 'ground-impact', gameplay: false, time: 0.86 }];
  return [];
}
const TAU = Math.PI * 2, radians = n => n * Math.PI / 180;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const mix = (a, b, p) => a + (b - a) * p;
const normalize = n => (n % 1 + 1) % 1;
export function blendPose(source, target, weight) {
  const w = ease(weight), p = { ...target };
  for (const field of Object.keys(p)) if (typeof p[field] === 'number' && field !== 'progress') p[field] = mix(source[field], p[field], w);
  for (const field of ['footBack', 'footFront']) p[field] = { ...target[field],
    sole: target[field].sole.map((coordinate, i) => mix(source[field].sole[i], coordinate, w)), roll: mix(source[field].roll, target[field].roll, w) };
  return p;
}
function key(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [a, x] = keys[i - 1], [b, y] = keys[i]; return mix(x, y, ease((t - a) / (b - a)));
  }
  return keys.at(-1)[1];
}
const point = (origin, angle, length) => [origin[0] - Math.sin(radians(angle)) * length, origin[1] + Math.cos(radians(angle)) * length];
const angle = (a, b) => Math.atan2(a[0] - b[0], b[1] - a[1]) * 180 / Math.PI;
function bodyPoint(c, p, [x, y]) {
  const r = radians(p.torso), dx = x - c.layout.hips[0], dy = y - c.layout.hips[1];
  return [p.x + dx * Math.cos(r) - dy * Math.sin(r), p.y + dx * Math.sin(r) + dy * Math.cos(r)];
}
// In world space, support feet stay still while the body travels to the left.
// Swing endpoints have a separate toe lift and an ankle-to-sole offset.
export function footTarget(c, phase, side) {
  const l = c.layout, t = normalize(phase + (side === 'back' ? 0.5 : 0)), hip = l.hips[0] + l.hipOffsets[side === 'back' ? 0 : 1];
  if (t < l.stance) return { sole: [hip - l.stride + 2 * l.stride * t / l.stance, 288], roll: 0, support: true };
  const swing = (t - l.stance) / (1 - l.stance), lift = c.anatomy === 'brute' ? 9 : 31;
  return { sole: [mix(hip + l.stride, hip - l.stride, ease(swing)), 288 - Math.sin(Math.PI * swing) * lift],
    roll: Math.sin(Math.PI * swing) * (c.anatomy === 'brute' ? 10 : 28), support: false };
}
export function solveLeg(hip, ankle, lengths, bend = 1) {
  const [a, b] = lengths, dx = ankle[0] - hip[0], dy = ankle[1] - hip[1], raw = Math.max(0.0001, Math.hypot(dx, dy));
  const d = Math.max(Math.abs(a - b) + 0.001, Math.min(raw, a + b - 0.001)), ux = dx / raw, uy = dy / raw;
  const along = (a * a - b * b + d * d) / (2 * d), across = Math.sqrt(Math.max(0, a * a - along * along));
  const end = [hip[0] + ux * d, hip[1] + uy * d];
  return { knee: [hip[0] + ux * along - uy * across * bend, hip[1] + uy * along + ux * across * bend], ankle: end, reachError: raw - d };
}
export function evaluatePose(c, clip, seconds) {
  const info = CLIPS[clip], t = info.loop ? normalize(seconds / info.duration) : clamp(seconds / info.duration), wave = Math.sin(t * TAU);
  const brute = c.anatomy === 'brute', l = c.layout;
  const p = { progress: t, x: l.hips[0], y: l.hips[1], torso: brute ? 0 : -9, head: 0, headX: 0, headY: 0,
    upperBack: brute ? -6 : -18, elbowBack: brute ? 8 : 92, upperFront: brute ? 7 : 33, elbowFront: brute ? 8 : 78,
    handBack: 0, handFront: 0, opacity: 1, dust: 0, blink: clip === 'idle' && t > 0.76 && t < 0.82, biting: false, helmetDrop: 0,
    footBack: { sole: [l.hips[0] + l.hipOffsets[0], 288], roll: 0, support: true },
    footFront: { sole: [l.hips[0] + l.hipOffsets[1], 288], roll: 0, support: true }, fall: 0 };
  if (clip === 'idle') { p.y += Math.sin(t * TAU) * 0.9; p.head = Math.sin(t * TAU - 0.4) * 0.7; p.upperFront += wave * 0.8; }
  if (clip === c.locomotion) {
    p.footBack = footTarget(c, t, 'back'); p.footFront = footTarget(c, t, 'front');
    p.y += brute ? (1 - Math.cos(t * TAU * 2)) * 0.6 : -Math.cos(t * TAU * 2) * 3.6 - 1.2;
    p.torso += Math.sin(t * TAU - 0.4) * (brute ? 1.1 : 2.2);
    p.head = Math.sin(t * TAU - 0.75) * (brute ? 1.3 : 2); p.headY = Math.sin(t * TAU * 2 - 0.3) * 0.7;
    p.upperBack += wave * (brute ? 5 : 40); p.upperFront -= wave * (brute ? 5 : 40);
    if (!brute) {
      const counter = Math.cos(t * TAU);
      p.upperBack = 20 + counter * 40; p.upperFront = 20 - counter * 40;
      p.elbowBack = 75 - counter * 35; p.elbowFront = 75 + counter * 35;
    }
  }
  if (clip === 'smash') {
    p.upperFront = key(t, [[0, 7], [0.29, -75], [0.42, -78], [0.50, 73], [0.57, 68], [0.76, 35], [1, 7]]);
    p.elbowFront = key(t, [[0, 8], [0.29, 133], [0.42, 138], [0.5, -27], [0.57, -16], [0.76, 48], [1, 8]]);
    p.upperBack = key(t, [[0, -6], [0.38, -16], [0.53, 15], [1, -6]]);
    p.torso = key(t, [[0, 0], [0.38, 7], [0.5, -6], [0.59, -3], [1, 0]]);
    p.y += key(t, [[0, 0], [0.38, -3], [0.51, 5], [0.61, 3], [1, 0]]);
    p.head = key(t, [[0, 0], [0.43, -5], [0.56, 5], [1, 0]]); p.biting = t > 0.2 && t < 0.7;
    p.dust = t >= 0.5 && t < 0.75 ? Math.sin((t - 0.5) / 0.25 * Math.PI) : 0;
  }
  if (clip === 'bite') {
    const attack = key(t, [[0, 0], [0.32, -1], [0.5, 1], [0.66, 0.5], [1, 0]]);
    p.headX = -attack * 11; p.headY = attack * 1.5; p.head = attack * -6;
    p.torso -= attack * 4; p.upperFront += attack * 15; p.elbowFront -= attack * 14; p.biting = t >= 0.36 && t < 0.67;
  }
  if (clip === 'hit' || clip === 'armor-break') {
    const hit = key(t, [[0, 0], [0.25, 1], [1, 0]]); p.torso += hit * 5; p.head += hit * 7;
    p.x += hit * 3; p.upperFront -= hit * 6; p.elbowFront += hit * 9;
    if (clip === 'armor-break') p.helmetDrop = clamp((seconds - 0.16) / 0.44);
  }
  if (clip === 'spawn') { p.opacity = ease(t / 0.3); p.x += (1 - ease(t)) * 14; p.torso += Math.sin(t * Math.PI) * 3; }
  if (clip === 'fall') {
    p.fall = t; p.biting = t > 0.1 && t < 0.45;
    p.x += key(t, [[0, 0], [0.22, 3], [0.48, 25], [0.72, 42], [1, 45]]);
    p.y = key(t, [[0, l.hips[1]], [0.22, l.hips[1] + 10], [0.48, 223], [0.72, brute ? 207 : 221], [1, brute ? 208 : 222]]);
    p.torso += key(t, [[0, 0], [0.22, -16], [0.48, -61], [0.72, -82], [1, -78]]);
    p.head = key(t, [[0, 0], [0.38, -9], [0.72, brute ? -22 : 62], [1, brute ? -20 : 60]]);
    p.headX = -7 * ease(t);
    p.upperFront = key(t, [[0, p.upperFront], [0.30, 78], [0.63, -14], [1, -38]]);
    p.elbowFront = key(t, [[0, p.elbowFront], [0.3, 30], [0.63, 86], [1, 78]]);
    p.upperBack = key(t, [[0, p.upperBack], [0.3, 64], [0.7, -74], [1, -75]]);
    p.elbowBack = key(t, [[0, p.elbowBack], [0.35, 15], [1, 77]]);
    const shift = key(t, [[0, 0], [0.25, 2], [0.65, 36], [1, 36]]);
    p.footFront.sole[0] += shift; p.footBack.sole[0] += shift + 7 * ease(t);
    p.footFront.sole[1] -= (brute ? 18 : 12) * ease(t); p.footBack.sole[1] -= (brute ? 25 : 20) * ease(t);
    p.footFront.roll = -15 * ease(t); p.footBack.roll = -14 * ease(t);
  }
  return p;
}
function stamp(ctx, parts, rig, name, at, rotation = 0) {
  const part = rig.parts[name], bitmap = parts[name]; if (!part || !bitmap) return;
  ctx.save(); ctx.translate(...at); ctx.rotate(radians(rotation));
  ctx.scale(part.scale, part.scale); ctx.drawImage(bitmap, -part.pivot[0], -part.pivot[1]); ctx.restore();
}
function segment(ctx, parts, rig, name, start, end) {
  const part = rig.parts[name]; stamp(ctx, parts, rig, name, start, angle(start, end) - part.nativeAngle);
}
function drawArm(ctx, c, parts, rig, p, side, section = 'both') {
  const back = side === 'back', index = back ? 0 : 1, upper = back ? p.upperBack : p.upperFront, elbow = back ? p.elbowBack : p.elbowFront;
  const shoulder = bodyPoint(c, p, c.layout.shoulders[index]);
  const bend = upper - p.torso;
  let a = point(shoulder, bend, c.layout.armLengths[0]), b = point(a, bend + elbow, c.layout.armLengths[1]);
  let handRotation = -bend - elbow + (back ? p.handBack : p.handFront);
  if (p.fall > 0.1) {
    const w = ease((p.fall - 0.1) / 0.52), brute = c.anatomy === 'brute';
    const target = brute ? back ? [p.x - 129, 262] : [p.x - 103, 205] : back ? [p.x - 84, 267] : [p.x - 96, 242];
    const wrist = [mix(b[0], target[0], w), mix(b[1], target[1], w)], solved = solveLeg(shoulder, wrist, c.layout.armLengths, back ? -1 : 1);
    a = solved.knee; b = solved.ankle; handRotation = mix(handRotation, 90, w);
  }
  if (section !== 'upper') {
    stamp(ctx, parts, rig, `hand-${side}`, b, handRotation);
    segment(ctx, parts, rig, `forearm-${side}`, a, b);
  }
  if (section !== 'lower') segment(ctx, parts, rig, `upper-${side}`, shoulder, a);
  return { shoulder, elbow: a, wrist: b };
}
export function poseGeometry(c, p) {
  const legs = {};
  for (const [index, side] of ['back', 'front'].entries()) {
    const foot = side === 'back' ? p.footBack : p.footFront, hip = [p.x + c.layout.hipOffsets[index], p.y + 4];
    const ankle = [foot.sole[0] + 5, foot.sole[1] - c.layout.shoeSize[1] * 0.8];
    legs[side] = { hip, foot, ...solveLeg(hip, ankle, c.layout.legLengths) };
  }
  return { legs };
}
function drawLeg(ctx, c, parts, rig, p, side, leg) {
  stamp(ctx, parts, rig, `shoe-${side}`, leg.ankle, leg.foot.roll);
  segment(ctx, parts, rig, `calf-${side}`, leg.knee, leg.ankle);
  segment(ctx, parts, rig, `thigh-${side}`, leg.hip, leg.knee);
}
export function renderZombie(ctx, c, parts, clip = c.locomotion, seconds = 0, { armorRatio = 1, transitionPose = null, transitionWeight = 1, showRig = false } = {}) {
  let p = evaluatePose(c, clip, seconds); const rig = parts.rig;
  if (!rig) throw Error('Load both the painted parts and rig.json before rendering.');
  if (transitionPose) p = blendPose(transitionPose, p, transitionWeight);
  const geometry = poseGeometry(c, p);
  ctx.save(); ctx.globalAlpha *= p.opacity;
  drawLeg(ctx, c, parts, rig, p, 'back', geometry.legs.back);
  const backArm = drawArm(ctx, c, parts, rig, p, 'back');
  drawLeg(ctx, c, parts, rig, p, 'front', geometry.legs.front);
  drawArm(ctx, c, parts, rig, p, 'front', 'upper');
  stamp(ctx, parts, rig, 'pelvis', [p.x, p.y], p.fall ? -p.torso * 0.22 : 0);
  stamp(ctx, parts, rig, 'torso', [p.x, p.y], p.torso);
  const head = bodyPoint(c, p, [c.layout.head[0] + p.headX, c.layout.head[1] + p.headY]);
  stamp(ctx, parts, rig, p.blink ? 'head-blink' : p.biting ? 'head-bite' : 'head', head, p.torso + p.head);
  const helmetPresent = c.armor && (armorRatio > 0 || clip === 'armor-break');
  if (helmetPresent) {
    const d = p.helmetDrop, relative = rig.helmetOffset;
    const r = radians(p.torso + p.head), offset = [relative[0] * Math.cos(r) - relative[1] * Math.sin(r), relative[0] * Math.sin(r) + relative[1] * Math.cos(r)];
    ctx.save(); if (d > 0.6) ctx.globalAlpha *= 1 - ease((d - 0.6) / 0.4);
    stamp(ctx, parts, rig, 'helmet', [head[0] + offset[0] + 60 * d, head[1] + offset[1] - Math.sin(d * Math.PI) * 20 + 36 * d], p.torso + p.head + d * 130); ctx.restore();
  }
  const frontArm = drawArm(ctx, c, parts, rig, p, 'front', 'lower');
  if (showRig) {
    ctx.strokeStyle = '#e80b70'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1.6;
    for (const points of [[backArm.shoulder, backArm.elbow, backArm.wrist], [frontArm.shoulder, frontArm.elbow, frontArm.wrist],
      ...Object.values(geometry.legs).map(leg => [leg.hip, leg.knee, leg.ankle])]) {
      ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(...point) : ctx.moveTo(...point)); ctx.stroke();
      for (const point of points) { ctx.beginPath(); ctx.arc(...point, 2.5, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
  }
  ctx.restore();
  if (p.dust && parts.effect) { ctx.save(); ctx.globalAlpha *= p.dust * 0.8; stamp(ctx, parts, rig, 'effect', [78, 237]); ctx.restore(); }
  return p;
}
export async function loadZombie(id, baseURL = new URL('../', import.meta.url)) {
  const character = ZOMBIES.find(c => c.id === id); if (!character) throw Error(`Unknown character ${id}`);
  const rigResponse = await fetch(new URL(`characters/${id}/rig.json`, baseURL)); if (!rigResponse.ok) throw Error('Missing character rig');
  const rig = await rigResponse.json();
  const parts = Object.fromEntries(await Promise.all(Object.keys(rig.parts).map(async name => {
    const image = new Image(); image.src = new URL(`characters/${id}/parts/${name}.png`, baseURL).href; await image.decode(); return [name, image];
  })));
  parts.rig = rig; return { character, parts };
}
export class ZombieAnimator {
  constructor(character, parts, { onEvent } = {}) {
    Object.assign(this, { character, parts, onEvent, clip: character.locomotion, seconds: 0, health: character.health, armor: character.armor,
      dead: false, dying: false, released: false, speedMultiplier: 1, blendSeconds: 0.12, transitionPose: null });
  }
  play(clip) {
    if (!CLIPS[clip]) throw Error(`Unknown clip ${clip}`);
    if (!this.character.clips.includes(clip) || (this.dead || this.dying) && clip !== 'spawn') return false;
    if (clip === 'armor-break' && !this.character.armor) return false;
    const previous = evaluatePose(this.character, this.clip, this.seconds);
    const visible = this.transitionPose ? blendPose(this.transitionPose, previous, this.blendSeconds / 0.12) : previous;
    this.transitionPose = clip === 'spawn' ? null : visible;
    this.blendSeconds = 0; this.clip = clip; this.seconds = 0; this.released = false;
    if (clip === 'spawn') Object.assign(this, { health: this.character.health, armor: this.character.armor, dead: false, dying: false, speedMultiplier: 1 });
    if (clip === 'fall') { this.health = 0; this.dying = true; }
    if (clip === 'armor-break') this.armor = 0;
    return true;
  }
  setSpeedMultiplier(value) { this.speedMultiplier = Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 1; }
  applyDamage(damage) {
    if (this.dead || this.dying || !Number.isFinite(damage) || damage <= 0) return { damage: 0, armorLost: 0, healthLost: 0, killed: false };
    const before = this.armor, previous = this.health, absorbed = Math.min(this.armor, damage);
    this.armor -= absorbed; this.health = Math.max(0, this.health - damage + absorbed);
    const killed = this.health === 0; this.play(killed ? 'fall' : before > 0 && !this.armor ? 'armor-break' : 'hit');
    return { damage, armorLost: absorbed, healthLost: previous - this.health, killed };
  }
  update(seconds) {
    if (this.dead) return 0;
    let remaining = Number.isFinite(seconds) ? Math.max(0, seconds) : 0, movement = 0;
    while (remaining > 1e-10) {
      const current = this.clip, info = CLIPS[current], moving = current === this.character.locomotion;
      const factor = moving ? this.speedMultiplier : 1; if (!factor) break;
      const event = animationEvents(this.character, current)[0];
      const step = Math.min(remaining, (info.duration - this.seconds) / factor, event && !this.released ? Math.max(0, event.time - this.seconds) / factor : Infinity);
      this.seconds += step * factor; remaining -= step; this.blendSeconds += step * factor;
      if (moving) movement -= moveSpeed(this.character) * this.speedMultiplier * step;
      if (event && !this.released && this.seconds >= event.time - 1e-10) { this.released = true; this.onEvent?.({ ...event, zombie: this.character.id }); if (this.clip !== current) continue; }
      if (this.seconds >= info.duration - 1e-10) {
        if (info.loop) { this.seconds = 0; this.released = false; }
        else if (current === 'fall') { this.seconds = info.duration; this.dead = true; break; }
        else this.play(this.character.locomotion);
      }
    }
    return movement;
  }
  draw(ctx, options = {}) { return renderZombie(ctx, this.character, this.parts, this.clip, this.seconds,
    { armorRatio: this.character.armor ? this.armor / this.character.armor : 1, transitionPose: this.transitionPose, transitionWeight: this.blendSeconds / 0.12, ...options }); }
}
