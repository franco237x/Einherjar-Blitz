import { CLIPS, PlantAnimator as BaseAnimator, evaluatePose as basePose } from './base-rig.mjs';
export { CLIPS, clipsFor, actionEvent, animationEvents, afterClip, clipLabel, sunPosition,
  createColdStatus, applyChill, updateColdStatus, createShadowRecall, canMarkShadow, markShadow,
  interruptShadowRecall, updateShadowRecall } from './base-rig.mjs';

export const CHARACTERS = [
  { id: 'cilantro', name: 'Cilantro Coro', anatomy: 'choir', rigVersion: 7, role: 'Tres voces, una ráfaga', color: '#7da827',
    description: 'Un coro de hojas: una voz grave con sueño, una chillona y una solista con un ojo enorme. Soplan juntas para interrumpir mordiscos.',
    motion: 'Las tres caras se balancean a destiempo y se agrupan antes de soplar. La cara está dibujada en cada hoja.',
    attackStyle: 'aroma', actionLabel: 'Ráfaga del coro', tempo: 0.9, projectileEvent: 0.5,
    muzzle: [221, 234], projectileSpeed: 255, aroma: { interruptSeconds: 1.1, damage: 0, movementMultiplier: 1 },
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'voice-low', 'voice-high', 'base', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
  },
  { id: 'limon', name: 'Limón Acordeón', anatomy: 'accordion', rigVersion: 7, role: 'Cáscara elástica y jugo ácido', color: '#d5ab23',
    description: 'Su cáscara forma un fuelle. Lo comprime con un gesto agrio y dispara jugo contra la armadura.',
    motion: 'El fuelle se comprime desde atrás, la punta se proyecta hacia delante y la cola de cáscara rebota después.',
    attackStyle: 'acid', actionLabel: 'Exprimir el fuelle', tempo: 0.74, projectileEvent: 0.5,
    muzzle: [249, 232], projectileSpeed: 330, acid: { damage: 16, armorDamage: 44 },
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'bellows', 'peel-tail', 'base', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
  },
  { id: 'jengibron', name: 'Rizomazo', anatomy: 'gavel', rigVersion: 7, role: 'El cuerpo entero golpea', color: '#b77a40',
    description: 'Una masa de jengibre demasiado grande para su tallo. Parece dormido hasta que carga todo su peso y golpea con la raíz.',
    motion: 'Un toque para tantear, carga hacia atrás y un mazazo pesado. El tallo se arquea y la hoja compensa el movimiento.',
    attackStyle: 'punch', actionLabel: 'Tanteo y mazazo', tempo: 0.67, projectileEvent: 0.4,
    muzzle: [275, 141], projectileSpeed: 0,
    melee: { range: 152, origin: [150, 288], hits: [
      { time: 0.4, damage: 22, hand: 'front', label: 'Tanteo' }, { time: 0.8, damage: 34, hand: 'back', label: 'Mazazo' } ] },
    partNames: ['reference', 'head', 'head-blink', 'head-action', 'stem', 'leaf', 'base', 'arc', 'effect'],
    expressions: ['head', 'head-blink', 'head-action'],
  },
];
export const ACTIVE_CHARACTERS = CHARACTERS;
export const ARCHIVED_CHARACTERS = [];
const radians = degrees => degrees * Math.PI / 180;
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
function key(time, values) {
  if (time <= values[0][0]) return values[0][1];
  for (let i = 1; i < values.length; i++) if (time <= values[i][0]) {
    const [t0, a] = values[i - 1], [t1, b] = values[i];
    return a + (b - a) * smooth((time - t0) / (t1 - t0));
  }
  return values.at(-1)[1];
}
function part(ctx, image, x, y, maxWidth, maxHeight, rotation = 0, ax = 0.5, ay = 1, sx = 1, sy = 1) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const w = image.width * scale, h = image.height * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(radians(rotation)); ctx.scale(sx, sy);
  ctx.drawImage(image, -w * ax, -h * ay, w, h); ctx.restore();
}
const expression = (parts, name, pose) => parts[pose.blink ? `${name}-blink` : pose.actionFace ? `${name}-action` : name];

export function evaluatePose(character, clip, time) {
  const pose = basePose(character, clip, time);
  pose.growX = 1 + (pose.growX - 1) * 0.2;
  if (clip === 'spawn') pose.follow *= 0.3;
  pose.tap = 0; pose.slam = 0;
  if (character.anatomy === 'gavel' && clip === 'attack') {
    pose.tap = key(time, [[0, 0], [0.22, -0.6], [0.4, 1], [0.46, 0.8], [0.58, 0], [1.2, 0]]);
    pose.slam = key(time, [[0, 0], [0.55, 0], [0.67, -0.6], [0.8, 1], [0.85, 0.85], [1.1, -0.1], [1.2, 0]]);
    pose.actionFace = time > 0.22 && time < 1.08;
    pose.effect = Math.max(key(time, [[0, 0], [0.4, 0], [0.45, 1], [0.57, 0], [1.2, 0]]),
      key(time, [[0, 0], [0.8, 0], [0.85, 1], [1.0, 0], [1.2, 0]]));
  }
  return pose;
}

function choir(ctx, parts, p) {
  part(ctx, parts.base, 150, 288, 113, 82);
  const low = p.follow * 6 - p.windup * 8 + p.strike * 5;
  const high = -p.follow * 7 + p.windup * 7 - p.strike * 6;
  part(ctx, parts['voice-high'], 131, 244, 128, 186, high - p.recoil * 6, 0.27, 0.94);
  part(ctx, parts['voice-low'], 140, 264, 107, 145, low - p.recoil * 4, 0.9, 0.94);
  part(ctx, expression(parts, 'body', p), 167 + p.strike * 4, 277, 151, 168,
    p.sway * 3 - p.recoil * 5, 0.34, 0.96);
  // The root collar covers the attachment ends while the leaf blades move freely.
  ctx.save(); ctx.beginPath(); ctx.rect(90, 254, 125, 40); ctx.clip();
  part(ctx, parts.base, 150, 288, 113, 82); ctx.restore();
  if (p.attack && p.effect > 0) {
    ctx.save(); ctx.globalAlpha *= p.effect;
    part(ctx, parts.effect, 241, 234, 68, 44, -5, 0.5, 0.5); ctx.restore();
  }
}

function accordion(ctx, parts, p) {
  part(ctx, parts.base, 150, 288, 241, 64);
  ctx.save(); ctx.translate(150, 275); ctx.rotate(radians(p.sway * 1.8 - p.recoil * 4)); ctx.translate(-150, -275);
  part(ctx, parts['peel-tail'], 79, 272, 66, 127, -p.follow * 12 + p.windup * 9, 0.88, 0.98);
  part(ctx, parts.bellows, 176, 279, 152, 120, 0, 0.93, 1,
    1 - p.windup * 0.35 + p.strike * 0.09, 1 + p.windup * 0.07 - p.strike * 0.03);
  part(ctx, expression(parts, 'body', p), 196 + p.strike * 12, 277, 110, 119, -p.follow * 1.2, 0.5, 1);
  if (p.attack && p.effect > 0) {
    ctx.save(); ctx.globalAlpha *= p.effect;
    part(ctx, parts.effect, 265, 229, 45, 40, 0, 0.5, 0.5); ctx.restore();
  }
  ctx.restore();
}

function gavel(ctx, parts, p) {
  part(ctx, parts.base, 150, 288, 145, 52);
  const bend = p.sway * 0.7 + p.tap * 10 + p.slam * 17 - p.recoil * 9;
  const stretch = 1 - p.windup * 0.035 + p.tap * 0.015 + p.slam * 0.02;
  ctx.save(); ctx.translate(150, 284); ctx.rotate(radians(bend)); ctx.translate(-150, -284);
  part(ctx, parts.stem, 150, 288, 112, 170, 0, 0.53, 1, 1, stretch);
  part(ctx, parts.leaf, 137, 253, 66, 62, -p.follow * 12 - p.slam * 16, 0.95, 0.98);
  part(ctx, expression(parts, 'head', p), 177, 288 - 126 * stretch, 190, 140,
    -bend + p.tap * 2 + p.slam * 3 + p.follow * 1.5, 0.475, 0.95);
  ctx.restore();
  if (p.attack && p.effect > 0) {
    ctx.save(); ctx.globalAlpha *= p.effect;
    part(ctx, parts.arc, 262, 141, 70, 72, -12, 0.5, 0.5);
    part(ctx, parts.effect, 291, 141, 37, 38, p.slam > p.tap ? 12 : 0, 0.5, 0.5); ctx.restore();
  }
}

export function renderPlant(ctx, character, parts, clip = 'idle', time = 0) {
  const pose = evaluatePose(character, clip, time); pose.attack = clip === 'attack';
  ctx.save(); ctx.globalAlpha *= pose.opacity;
  ctx.translate(150, 288 - pose.jump); ctx.scale(pose.growX, pose.growY); ctx.translate(-150, -288);
  ({ choir, accordion, gavel })[character.anatomy](ctx, parts, pose);
  if (clip === 'hit' && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect;
    const impact = character.anatomy === 'choir' ? [235, 215] : character.anatomy === 'accordion' ? [242, 224] : [268, 123];
    part(ctx, parts.effect, ...impact, 31, 32, 0, 0.5, 0.5); ctx.restore();
  }
  ctx.restore(); return pose;
}

export class PlantAnimator extends BaseAnimator {
  draw(ctx) { return renderPlant(ctx, this.character, this.parts, this.clip, this.seconds); }
}
export async function loadPlant(id, baseURL = new URL('../', import.meta.url)) {
  const character = CHARACTERS.find(character => character.id === id);
  if (!character) throw new Error(`Unknown redesign ${id}`);
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name => {
    const image = new Image(); image.src = new URL(`characters/${id}/parts/${name}.png`, baseURL).href;
    await image.decode(); return [name, image];
  })));
  return { character, parts };
}
