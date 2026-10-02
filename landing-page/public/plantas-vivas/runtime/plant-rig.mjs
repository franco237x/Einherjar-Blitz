/** Original anatomical rigs. Logical coordinates: 320 × 320, ground at y=288. */
export const CLIPS = Object.freeze({
  idle: { label: 'Reposo', duration: 2.4, frames: 72, fps: 30, loop: true },
  attack: { label: 'Ataque', duration: 1.2, frames: 36, fps: 30, loop: false },
  hit: { label: 'Daño', duration: 0.8, frames: 24, fps: 30, loop: false },
  spawn: { label: 'Aparecer', duration: 1.2, frames: 36, fps: 30, loop: false },
  celebrate: { label: 'Celebrar', duration: 1.6, frames: 48, fps: 30, loop: false },
  guard: { label: 'Bloquear', duration: 1.2, frames: 36, fps: 30, loop: false },
  damaged: { label: 'Agrietado', duration: 2.4, frames: 72, fps: 30, loop: true },
  critical: { label: 'Estado crítico', duration: 2.4, frames: 72, fps: 30, loop: true },
  seal: { label: 'Sellar sombra', duration: 1.4, frames: 42, fps: 30, loop: false },
  channel: { label: 'Sostener vínculo', duration: 2.4, frames: 72, fps: 30, loop: true },
  recall: { label: 'Retorno umbrío', duration: 1.2, frames: 36, fps: 30, loop: false },
  recover: { label: 'Recuperación', duration: 1.4, frames: 42, fps: 30, loop: false },
});
const BASE_CLIPS = ['idle', 'attack', 'hit', 'spawn', 'celebrate'];
export const clipsFor = character => Object.fromEntries((character.clips ?? BASE_CLIPS).map(clip => [clip, CLIPS[clip]]));

export const CHARACTERS = [
  {
    id: 'nabu', name: 'Nabú', anatomy: 'root', role: 'Nabo lanzasemillas', color: '#ac81b5',
    description: 'Rechoncho, impulsivo y un poco torpe. Se planta sobre sus raíces y escupe una semilla.',
    attackStyle: 'seed', tempo: 1.15, projectileEvent: 0.43, muzzle: [211, 212], projectileSpeed: 310,
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'tuft', 'foot-left', 'foot-right', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'El cuerpo se comprime; la cresta llega tarde y las raíces dan pequeños pasos.',
  },
  {
    id: 'cardon', name: 'Cardón', anatomy: 'cactus', role: 'Cactus de precisión', color: '#319b87',
    description: 'Alto, desgarbado y muy serio. Tensa la columna antes de soltar una espina.',
    attackStyle: 'thorn', tempo: 0.68, projectileEvent: 0.45, muzzle: [170, 113], projectileSpeed: 390,
    partNames: ['reference', 'column', 'column-blink', 'column-action', 'base', 'arm-left', 'arm-right', 'projectile', 'effect'],
    expressions: ['column', 'column-blink', 'column-action'],
    motion: 'La columna se arquea, los brazos reaccionan a destiempo y vuelve como un resorte.',
  },
  {
    id: 'mordiseta', name: 'Mordiseta', anatomy: 'mushroom', role: 'Hongo de esporas', color: '#c86440',
    description: 'Tiene sueño hasta que toca defender el jardín. Infla el sombrero y libera esporas.',
    attackStyle: 'spore', tempo: 0.8, projectileEvent: 0.60, muzzle: [220, 207], projectileSpeed: 180,
    partNames: ['reference', 'cap', 'stalk', 'stalk-blink', 'stalk-action', 'base', 'projectile', 'effect', 'cap-action'],
    expressions: ['stalk', 'stalk-blink', 'stalk-action'],
    extraExpressions: [['cap', 'cap-action']],
    motion: 'El sombrero pesa y se hunde; el tallo cabecea con los ojos medio cerrados.',
  },
  {
    id: 'zarzina', name: 'Zarzina', anatomy: 'maw', role: 'Flor mordedora', color: '#a75aba',
    source: 'zarzina-parts-v2.png',
    description: 'Traviesa y hambrienta. Se echa hacia atrás y cierra sus enormes mandíbulas.',
    attackStyle: 'bite', tempo: 1, projectileEvent: 0.46, muzzle: [271, 147], projectileSpeed: 0,
    partNames: ['reference', 'upper-jaw', 'upper-jaw-blink', 'upper-jaw-action', 'lower-jaw', 'neck', 'leaf', 'projectile', 'effect'],
    expressions: ['upper-jaw', 'upper-jaw-blink', 'upper-jaw-action'],
    motion: 'El cuello serpentea y las dos mandíbulas se abren y cierran de forma independiente.',
  },
  {
    id: 'solmiel', name: 'Solmiel', anatomy: 'lantern', role: 'Productora de soles', color: '#d8a13e',
    description: 'Un farol de miel, cálido y soñoliento. Aprieta su fruto y deja escapar un sol dorado.',
    attackStyle: 'sun', actionLabel: 'Producir sol', tempo: 0.72, projectileEvent: 0.58,
    muzzle: [132, 187], projectileSpeed: 16, sunValue: 25,
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'calyx', 'stalk', 'leaf', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'El farol cuelga y se balancea; se comprime, brilla y suelta un sol que flota hacia arriba.',
  },
  {
    id: 'granadin', name: 'Granadín', anatomy: 'bomb', role: 'Granada explosiva', color: '#d9515b',
    description: 'Rechoncho y nervioso. Infla la panza, enciende su tallito y estalla en una lluvia de semillas.',
    attackStyle: 'explosion', actionLabel: 'Explotar', tempo: 1.22, projectileEvent: 0.70,
    muzzle: [153, 177], projectileSpeed: 0, consumedOnAction: true,
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'fuse', 'base', 'remnant', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'Se agacha, tiembla e infla el fruto. La explosión deja una pequeña cáscara: hay que replantarlo.',
  },
  {
    id: 'aurelia', name: 'Aurélia', anatomy: 'orchid', role: 'Orquídea aurora · Rara', color: '#b995d8',
    description: 'Una flor difícil de encontrar. Sus pétalos de nácar se abren como cintas y liberan rocío luminoso.',
    attackStyle: 'bloom', actionLabel: 'Floración', tempo: 0.59, projectileEvent: 0.56,
    muzzle: [169, 143], projectileSpeed: 0, rarity: 'rare',
    partNames: ['reference', 'heart', 'heart-blink', 'heart-action', 'fan-left', 'fan-right', 'stalk', 'projectile', 'effect'],
    expressions: ['heart', 'heart-blink', 'heart-action'],
    motion: 'Los dos abanicos de pétalos flotan a destiempo; se pliegan y despliegan una floración con destellos.',
  },
  {
    id: 'cortezon', name: 'Cortezón', anatomy: 'bark', role: 'Defensa pura', color: '#a08862',
    description: 'Un tronco de corcho con un corazón tranquilo. Se aferra con sus raíces y aguanta los golpes.',
    attackStyle: 'block', actionLabel: 'Bloquear', primaryClip: 'guard', defenseOnly: true,
    clips: ['idle', 'guard', 'hit', 'spawn', 'celebrate', 'damaged', 'critical'],
    combat: { blocks: true, attackDamage: 0, reflectDamage: 0, suggestedHealth: 1600 },
    healthThresholds: { damaged: 0.55, critical: 0.25 },
    tempo: 0.52, projectileEvent: 0.42, muzzle: [224, 207], projectileSpeed: 0,
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'crown', 'base', 'cracks', 'cracks-critical', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'Masa pesada y raíces firmes. Amortigua el impacto sin atacar; la corteza se agrieta al perder integridad.',
  },
  {
    id: 'frigora', name: 'Frígora', anatomy: 'fern', role: 'Helecho de escarcha', color: '#67bfd0',
    description: 'Sus frondas rizadas se cargan de frío. La escarcha frena al objetivo y tres impactos seguidos lo congelan.',
    attackStyle: 'chill', actionLabel: 'Lanzar escarcha', tempo: 0.86, projectileEvent: 0.53,
    muzzle: [220, 225], projectileSpeed: 230,
    cold: { speedMultiplier: 0.5, slowSeconds: 3, freezeAtStacks: 3, freezeSeconds: 1.2, damage: 0 },
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'frond-left', 'frond-right', 'base', 'projectile', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'Las frondas se doblan con retraso; el brote enrollado se comprime y sopla un copo de frío.',
  },
  {
    id: 'velaria', name: 'Velaria', anatomy: 'nocturne', role: 'Cala del eco umbrío', color: '#6e5b94',
    description: 'Serena y solemne. Ancla la sombra de un enemigo y, dos segundos después, lo devuelve a esa posición.',
    attackStyle: 'shadow-mark', actionLabel: 'Eco umbrío', primaryClip: 'seal',
    clips: ['idle', 'seal', 'channel', 'recall', 'recover', 'hit', 'spawn', 'celebrate'],
    shadow: { delaySeconds: 2, recallLeadSeconds: 0.36, cooldownSeconds: 7, maxRange: 260, damage: 0, targets: 1 },
    tempo: 0.64, projectileEvent: 0.72, muzzle: [207, 184], projectileSpeed: 0,
    partNames: ['reference', 'body', 'body-blink', 'body-action', 'mantle-left', 'mantle-right', 'base', 'sigil', 'effect'],
    expressions: ['body', 'body-blink', 'body-action'],
    motion: 'Abre los pétalos para sellar; sostiene un pulso contenido, cierra el vínculo con un tirón y recupera el aliento.',
  },
];

export function clipLabel(character, clip, spent = false) {
  if (spent) return 'Consumida · Replantar';
  return clip === (character.primaryClip ?? 'attack') ? character.actionLabel ?? CLIPS[clip].label : CLIPS[clip].label;
}

/** One gameplay event per action, shared by the live rig and the exported atlas. */
export function actionEvent(character) {
  const type = ['sun', 'explosion', 'bloom', 'bite', 'block', 'chill', 'shadow-mark'].includes(character.attackStyle) ? character.attackStyle : 'projectile';
  return {
    type, plant: character.id, time: character.projectileEvent, position: [...character.muzzle],
    velocity: [character.projectileSpeed, type === 'sun' ? -94 : 0],
    ...(type === 'sun' ? { value: character.sunValue, asset: `characters/${character.id}/parts/projectile.png` } : {}),
    ...(type === 'explosion' ? { consumePlant: true, radius: 124 } : {}),
    ...(type === 'bloom' ? { rarity: character.rarity } : {}),
    ...(type === 'block' ? { passive: true, damage: 0 } : {}),
    ...(type === 'chill' ? { ...character.cold, asset: `characters/${character.id}/parts/projectile.png` } : {}),
    ...(type === 'shadow-mark' ? { ...character.shadow, asset: `characters/${character.id}/parts/sigil.png` } : {}),
  };
}

/** Cue timing and clip transitions are also recorded in every exported atlas. */
export function animationEvents(character, clip) {
  if (clip === (character.primaryClip ?? 'attack')) return [actionEvent(character)];
  if (character.attackStyle === 'shadow-mark' && clip === 'recall') {
    return [{ type: 'animation-cue', cue: 'rewind', gameplay: false, plant: character.id, time: character.shadow.recallLeadSeconds }];
  }
  return [];
}
export function afterClip(character, clip) {
  if (CLIPS[clip].loop) return clip;
  if (character.consumedOnAction && clip === 'attack') return 'consumed';
  if (character.attackStyle === 'shadow-mark' && clip === 'seal') return 'channel';
  if (character.attackStyle === 'shadow-mark' && clip === 'recall') return 'recover';
  return 'idle';
}

/** One target, one anchor. Moving, health and all other enemy status belong to the game. */
export function createShadowRecall() {
  return { phase: 'ready', remaining: 0, cooldownRemaining: 0, targetId: null, anchor: null, originX: 0, rules: null };
}
export function canMarkShadow(state, event, target) {
  return event.type === 'shadow-mark' && state.phase === 'ready' && state.cooldownRemaining === 0
    && target?.alive === true && target.id != null && Number.isFinite(target.x) && Number.isFinite(target.y)
    && Math.abs(target.x - event.position[0]) <= event.maxRange;
}
export function markShadow(state, event, target) {
  if (!canMarkShadow(state, event, target)) return false;
  state.phase = 'marked'; state.remaining = event.delaySeconds; state.cooldownRemaining = event.cooldownSeconds;
  state.targetId = target.id; state.anchor = { x: target.x, y: target.y, lane: target.lane };
  state.originX = event.position[0]; state.rules = { ...event };
  return true;
}
export function interruptShadowRecall(state, reason = 'interrupted') {
  if (!['marked', 'recalling'].includes(state.phase)) return null;
  const event = { type: 'shadow-cancel', target: state.targetId, reason };
  state.remaining = 0; state.targetId = null; state.anchor = null;
  state.phase = state.cooldownRemaining > 0 ? 'cooldown' : 'ready';
  return event;
}
export function updateShadowRecall(state, seconds, target) {
  const delta = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const events = [], previousPhase = state.phase;
  state.cooldownRemaining = Math.max(0, state.cooldownRemaining - delta);
  if (['marked', 'recalling'].includes(state.phase)) {
    const valid = target?.alive === true && target.id === state.targetId && target.lane === state.anchor.lane
      && Number.isFinite(target.x) && Number.isFinite(target.y);
    const inRange = valid && Math.abs(target.x - state.originX) <= state.rules.maxRange;
    if (!valid || !inRange) {
      events.push(interruptShadowRecall(state, !valid ? 'target-lost' : 'out-of-range'));
    } else {
      const before = state.remaining;
      state.remaining = Math.max(0, state.remaining - delta);
      if (state.phase === 'marked' && state.remaining <= state.rules.recallLeadSeconds) {
        state.phase = 'recalling';
        events.push({ type: 'shadow-recall-start', elapsed: Math.min(state.rules.recallLeadSeconds, state.rules.recallLeadSeconds - state.remaining) });
      }
      if (before > 0 && state.remaining === 0) {
        const from = { x: target.x, y: target.y }, anchor = { ...state.anchor };
        target.x = anchor.x;
        events.push({ type: 'shadow-rewind', target: target.id, from, to: { x: target.x, y: target.y }, anchor, damage: 0 });
        state.targetId = null; state.phase = state.cooldownRemaining > 0 ? 'cooldown' : 'ready';
      }
    }
  }
  if (previousPhase === 'cooldown' && state.cooldownRemaining === 0) {
    state.phase = 'ready'; state.anchor = null; events.push({ type: 'shadow-ready' });
  }
  return events;
}

/** Mutable target status, independent of rendering or a specific game framework. */
export function createColdStatus() {
  return { stacks: 0, slowRemaining: 0, freezeRemaining: 0, speedMultiplier: 1 };
}
export function applyChill(status, event) {
  if (event.type !== 'chill') return false;
  status.slowRemaining = event.slowSeconds;
  status.speedMultiplier = event.speedMultiplier;
  if (status.freezeRemaining > 0) return false;
  status.stacks++;
  if (status.stacks < event.freezeAtStacks) return false;
  status.stacks = 0; status.freezeRemaining = event.freezeSeconds;
  return true;
}
export function updateColdStatus(status, seconds) {
  const delta = Math.max(0, seconds);
  status.slowRemaining = Math.max(0, status.slowRemaining - delta);
  status.freezeRemaining = Math.max(0, status.freezeRemaining - delta);
  if (status.slowRemaining === 0) { status.stacks = 0; status.speedMultiplier = 1; }
  return status.freezeRemaining > 0 ? 0 : status.slowRemaining > 0 ? status.speedMultiplier : 1;
}

const TAU = Math.PI * 2;
const rad = degrees => degrees * Math.PI / 180;
const clamp = (v, low = 0, high = 1) => Math.max(low, Math.min(high, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const pulse = (t, a, peak, b) => t < peak ? ease((t - a) / (peak - a)) : 1 - ease((t - peak) / (b - peak));
function key(t, points) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) if (t <= points[i][0]) {
    const a = points[i - 1], b = points[i];
    return a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0]));
  }
  return points.at(-1)[1];
}

/** Pose values are deliberately interpreted differently by each anatomy below. */
export function evaluatePose(character, clip, seconds) {
  const info = CLIPS[clip];
  if (!info) throw new Error(`Unknown animation: ${clip}`);
  const progress = clamp(seconds / info.duration);
  const kind = ['damaged', 'critical'].includes(clip) ? 'idle' : clip === 'guard' ? 'attack' : clip;
  const phase = (kind === 'idle' || kind === 'channel' ? seconds / info.duration : 0) * TAU;
  const wave = Math.sin(phase);
  const follow = Math.sin(phase - 0.6) + Math.sin(0.6);
  const pose = {
    progress, sway: wave, follow, breathe: Math.sin(phase * 2),
    windup: 0, strike: 0, recoil: 0, joy: 0, jump: 0,
    growX: 1, growY: 1, opacity: 1, blink: false, actionFace: false, effect: 0, elapsed: seconds,
    open: 0, charge: 0, pull: 0, exhaust: 0,
  };
  if (kind === 'idle') pose.blink = progress > 0.70 && progress < 0.77;
  if (kind === 'attack') {
    const release = character.projectileEvent / info.duration;
    pose.windup = pulse(progress, 0, release - 0.07, release + 0.07);
    pose.strike = pulse(progress, release - 0.06, release + 0.04, release + 0.26);
    pose.follow = key(progress, [[0, 0], [release - 0.05, -1], [release + 0.12, 1], [0.85, -0.2], [1, 0]]);
    pose.sway = -pose.windup * 1.4 + pose.strike;
    pose.actionFace = progress > release - 0.12 && progress < release + 0.23;
    pose.effect = pulse(progress, release, release + 0.09, release + 0.35);
  }
  if (clip === 'seal') {
    pose.open = key(progress, [[0, 0], [0.2, -0.18], [0.5, 1], [0.78, 0.64], [1, 0.64]]);
    pose.charge = key(progress, [[0, 0], [0.25, 0.08], [0.72 / info.duration, 1], [1, 1]]);
    pose.windup = pulse(progress, 0, 0.27, 0.57);
    pose.follow = pulse(progress, 0.35, 0.63, 1) * 0.5;
    pose.actionFace = progress > 0.27;
    pose.effect = pulse(seconds, 0.72, 0.85, 1.25);
  }
  if (clip === 'channel') {
    pose.open = 0.64 + wave * 0.08;
    pose.charge = 0.96 + Math.cos(phase) * 0.04;
    pose.actionFace = true;
  }
  if (clip === 'recall') {
    const strike = character.shadow.recallLeadSeconds / info.duration;
    pose.pull = key(progress, [[0, 0], [strike - 0.12, -0.17], [strike, 1], [strike + 0.2, 0.22], [1, 0]]);
    pose.open = key(progress, [[0, 0.64], [strike - 0.04, 0.85], [strike + 0.12, -0.15], [1, 0]]);
    pose.charge = 1 - ease((progress - strike) / 0.3);
    pose.follow = pulse(progress, strike, strike + 0.17, 1) * -1;
    pose.exhaust = ease((progress - 0.62) / 0.38) * 0.7;
    pose.actionFace = progress < 0.78; pose.blink = progress >= 0.78;
    pose.effect = pulse(progress, strike - 0.04, strike + 0.08, strike + 0.45);
  }
  if (clip === 'recover') {
    pose.exhaust = key(progress, [[0, 0.7], [0.25, 1], [0.65, 0.3], [1, 0]]);
    pose.blink = progress < 0.45;
  }
  if (clip === 'hit') {
    pose.recoil = pulse(progress, 0, 0.12, 0.75);
    pose.sway = -pose.recoil * 1.5;
    pose.follow = Math.sin(progress * Math.PI * 5) * Math.exp(-progress * 5);
    pose.blink = progress < 0.5;
    pose.effect = pulse(progress, 0, 0.10, 0.40);
  }
  if (clip === 'spawn') {
    pose.growY = key(progress, [[0, 0.025], [0.22, 0.42], [0.47, 1.035], [0.68, 0.96], [0.86, 1.008], [1, 1]]);
    pose.growX = key(progress, [[0, 0.72], [0.22, 1.24], [0.47, 0.96], [0.70, 1.035], [1, 1]]);
    if (character.anatomy === 'mushroom') pose.growX = 1 + (pose.growX - 1) * 0.32;
    if (character.anatomy === 'maw') pose.growX = 1 + (pose.growX - 1) * 0.2;
    if (character.anatomy === 'orchid') pose.growX = 1 + (pose.growX - 1) * 0.15;
    if (character.anatomy === 'fern') pose.growX = 1 + (pose.growX - 1) * 0.25;
    if (character.anatomy === 'nocturne') pose.growX = 1 + (pose.growX - 1) * 0.3;
    pose.opacity = ease(progress / 0.18);
    pose.sway = (1 - pose.growY) * -0.7;
    pose.follow = (1 - pose.growY) * 2;
    pose.effect = pulse(progress, 0.15, 0.36, 0.7);
  }
  if (clip === 'celebrate') {
    pose.joy = Math.sin(progress * Math.PI);
    pose.jump = pulse(progress, 0.12, 0.28, 0.44) * 13 + pulse(progress, 0.54, 0.67, 0.82) * 9;
    pose.sway = Math.sin(progress * TAU * 2) * pose.joy;
    pose.follow = Math.sin(progress * TAU * 3) * pose.joy;
    pose.blink = progress > 0.14 && progress < 0.86;
    pose.effect = pose.joy;
  }
  if (character.defenseOnly) pose.jump *= 0.2;
  if (character.anatomy === 'nocturne' && clip === 'celebrate') {
    pose.jump = 0; pose.sway *= 0.22; pose.follow *= 0.3;
  }
  return pose;
}

function fit(image, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  return [image.width * scale, image.height * scale];
}

function draw(ctx, image, x, y, maxWidth, maxHeight, rotation = 0, ax = 0.5, ay = 0.5, sx = 1, sy = 1) {
  const [w, h] = fit(image, maxWidth, maxHeight);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rad(rotation)); ctx.scale(sx, sy);
  ctx.drawImage(image, -w * ax, -h * ay, w, h);
  ctx.restore();
}

function face(parts, base, pose) {
  return parts[pose.blink ? `${base}-blink` : pose.actionFace ? `${base}-action` : base];
}

function drawRoot(ctx, parts, pose) {
  const squash = pose.windup * 0.10 + pose.recoil * 0.05;
  const shift = pose.sway * 5;
  draw(ctx, parts['foot-left'], 123, 261, 49, 30, -pose.strike * 17 + pose.follow * 8, 0.60, 0.05);
  draw(ctx, parts['foot-right'], 168, 261, 49, 30, pose.strike * 23 - pose.follow * 8, 0.4, 0.05);
  // The tuft inherits the body's full transform, then adds its own follow-through.
  // This keeps its stem planted in the turnip during recoil and compression.
  ctx.save();
  ctx.translate(149 + shift, 272 + squash * 10);
  ctx.rotate(rad(pose.sway * 5 - pose.recoil * 5));
  ctx.scale(1 + squash - pose.strike * 0.035, 1 - squash + pose.strike * 0.045);
  ctx.translate(-149, -272);
  draw(ctx, face(parts, 'body', pose), 149, 272, 170, 142, 0, 0.5, 1);
  draw(ctx, parts.tuft, 145, 147, 197, 101,
    pose.follow * 11 - pose.strike * 8 + pose.joy * 9, 0.5, 1);
  ctx.restore();
}

function drawCactus(ctx, parts, pose) {
  const columnRotation = pose.sway * 3.3 - pose.recoil * 4.5;
  const height = 1 - pose.windup * 0.055 + pose.strike * 0.035;
  draw(ctx, parts.base, 150, 288, 87, 28, 0, 0.5, 1);
  ctx.save(); ctx.translate(150, 279); ctx.rotate(rad(columnRotation)); ctx.scale(1, height); ctx.translate(-150, -279);
  draw(ctx, parts['arm-left'], 138, 160, 59, 85, pose.follow * 10 - pose.joy * 13, 0.93, 0.85);
  draw(ctx, parts['arm-right'], 157, 192, 48, 103, -pose.follow * 9 + pose.joy * 10, 0.08, 0.12);
  draw(ctx, face(parts, 'column', pose), 150, 279, 92, 239, 0, 0.5, 1);
  ctx.restore();
}

function drawMushroom(ctx, parts, pose) {
  const press = pose.windup * 11 - pose.strike * 7 + pose.recoil * 5;
  draw(ctx, parts.base, 153, 288, 96, 28, 0, 0.5, 1);
  draw(ctx, face(parts, 'stalk', pose), 155 + pose.sway * 4, 280, 80, 101,
    pose.sway * 4, 0.5, 1, 1 + pose.windup * 0.045, 1 - pose.windup * 0.07);
  const cap = pose.actionFace ? parts['cap-action'] : parts.cap;
  draw(ctx, cap, 150 + pose.sway * 8, 214 + press + pose.breathe * 2.5, 253, 123,
    pose.follow * 2.7 - pose.recoil * 5, 0.5, 1, 1 + pose.windup * 0.075 - pose.strike * 0.025, 1 - pose.windup * 0.12 + pose.strike * 0.05);
}

function drawMaw(ctx, parts, pose) {
  const headX = 163 + pose.sway * 6, headY = 145 + pose.breathe * 2 - pose.windup * 4;
  draw(ctx, parts.neck, 140, 288, 128, 169, pose.sway * 1.7, 0.5, 1);
  draw(ctx, parts.leaf, 145, 225, 55, 60, pose.follow * 12 - pose.joy * 22, 0.12, 0.88);
  const gape = pose.windup * 13 - pose.strike * 16 + pose.joy * 7;
  draw(ctx, parts['lower-jaw'], headX, headY + 4, 147, 80, 10 + gape + pose.follow * 2, 0.13, 0.12);
  draw(ctx, face(parts, 'upper-jaw', pose), headX, headY, 152, 95, -10 - gape - pose.follow * 2.8, 0.16, 0.82);
  if (pose.strike > 0.65) {
    ctx.save(); ctx.globalAlpha *= (pose.strike - 0.65) / 0.35;
    draw(ctx, parts.effect, 269, 152, 40, 44, 0);
    ctx.restore();
  }
}

function drawLantern(ctx, parts, pose) {
  ctx.save(); ctx.translate(166, 288); ctx.rotate(rad(pose.sway * 2.1 - pose.recoil * 3.5)); ctx.translate(-166, -288);
  draw(ctx, parts.stalk, 166, 288, 110, 220, 0, 0.5, 1);
  draw(ctx, parts.leaf, 174, 211, 78, 72, pose.follow * 8 + pose.joy * 12, 0.92, 0.04);
  // Fruit and calyx share a hanging pivot, so they remain attached during compression.
  ctx.save(); ctx.translate(132, 107); ctx.rotate(rad(pose.follow * 7 - pose.windup * 7)); ctx.translate(-132, -107);
  draw(ctx, face(parts, 'body', pose), 132, 115, 119, 129, 0, 0.5, 0,
    1 + pose.windup * 0.13 - pose.strike * 0.06, 1 - pose.windup * 0.09 + pose.strike * 0.04);
  draw(ctx, parts.calyx, 132, 126, 122, 51, pose.follow * 2, 0.5, 0.9);
  if (pose.effect > 0 && pose.windup + pose.strike > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect * 0.75;
    draw(ctx, parts.effect, 133, 191, 84, 66, pose.strike * 13); ctx.restore();
  }
  ctx.restore(); ctx.restore();
}

function drawBomb(ctx, parts, pose) {
  const detonation = Math.max(0, pose.elapsed - 0.70);
  const exploding = pose.attack && pose.elapsed >= 0.70;
  ctx.save();
  if (exploding) ctx.globalAlpha *= 1 - ease(detonation / 0.07);
  draw(ctx, parts.base, 153, 288, 100, 36, pose.follow * 4, 0.5, 1);
  const tremble = pose.attack && !exploding ? Math.sin(pose.elapsed * 93) * pose.windup * 1.8 : 0;
  ctx.translate(153 + pose.sway * 4 + tremble, 279); ctx.rotate(rad(pose.sway * 4 - pose.recoil * 6));
  ctx.scale(1 + pose.windup * 0.10, 1 - pose.windup * 0.055); ctx.translate(-153, -279);
  draw(ctx, face(parts, 'body', pose), 153, 279, 177, 158, 0, 0.5, 1);
  draw(ctx, parts.fuse, 153, 145, 56, 75, pose.follow * 12 + pose.windup * 7, 0.5, 1);
  if (pose.attack && !exploding && pose.windup > 0.15) {
    ctx.save(); ctx.globalAlpha *= pose.windup;
    draw(ctx, parts.effect, 164 + tremble, 71, 21, 23, pose.elapsed * 170); ctx.restore();
  }
  ctx.restore();
  if (!exploding) return;
  ctx.save(); ctx.globalAlpha *= ease((detonation - 0.16) / 0.18);
  draw(ctx, parts.remnant, 153, 288, 85, 41, 0, 0.5, 1); ctx.restore();
  const size = key(detonation, [[0, 12], [0.075, 257], [0.20, 249], [0.39, 227], [0.50, 205]]);
  ctx.save(); ctx.globalAlpha *= 1 - ease((detonation - 0.24) / 0.24);
  draw(ctx, parts.effect, 153, 167, size, size, detonation * 11); ctx.restore();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 34 + 204) * Math.PI / 180;
    const distance = detonation * 185;
    ctx.save(); ctx.globalAlpha *= 1 - ease((detonation - 0.31) / 0.17);
    draw(ctx, parts.projectile, 153 + Math.cos(angle) * distance, 177 + Math.sin(angle) * distance,
      18, 24, i * 70 + detonation * 410); ctx.restore();
  }
}

function drawOrchid(ctx, parts, pose) {
  ctx.save(); ctx.translate(164, 288); ctx.rotate(rad(pose.sway * 1.6 - pose.recoil * 2.4)); ctx.translate(-164, -288);
  draw(ctx, parts.stalk, 164, 288, 91, 155, 0, 0.5, 1);
  const fold = pose.windup * 20 - pose.strike * 12;
  draw(ctx, parts['fan-left'], 170, 146, 126, 186, fold - pose.follow * 3 - pose.joy * 6, 0.98, 0.5);
  draw(ctx, parts['fan-right'], 170, 146, 126, 186, -fold + pose.follow * 4 + pose.joy * 7, 0.02, 0.5);
  draw(ctx, face(parts, 'heart', pose), 170, 148, 41, 65, pose.follow * 1.5);
  if (pose.attack && pose.effect > 0) {
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6 + pose.elapsed * 0.6;
      const distance = 38 + pose.strike * 62;
      ctx.save(); ctx.globalAlpha *= pose.effect;
      draw(ctx, i % 2 ? parts.effect : parts.projectile,
        170 + Math.cos(angle) * distance, 146 + Math.sin(angle) * distance * 0.72,
        15 + pose.strike * 8, 23, i * 24 + pose.elapsed * 45); ctx.restore();
    }
  }
  ctx.restore();
}

function drawBark(ctx, parts, pose) {
  const brace = pose.windup * 0.8 + pose.strike * 0.4;
  ctx.save(); ctx.translate(150 + brace * 2 - pose.recoil * 4, 278);
  ctx.rotate(rad(pose.sway * 0.9 - pose.recoil * 2.8));
  ctx.scale(1 + brace * 0.024, 1 - brace * 0.025); ctx.translate(-150, -278);
  const expression = pose.healthRatio <= 0.25 && !pose.blink ? parts['body-action'] : face(parts, 'body', pose);
  draw(ctx, expression, 150, 279, 210, 157, 0, 0.5, 1);
  draw(ctx, parts.crown, 150, 147, 223, 110, pose.follow * 0.9 + pose.recoil * 2, 0.5, 0.92);
  if (pose.healthRatio <= 0.55) draw(ctx, parts.cracks, 153, 220, 159, 107);
  if (pose.healthRatio <= 0.25) draw(ctx, parts['cracks-critical'], 160, 226, 169, 114);
  if (pose.guarding && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect;
    draw(ctx, parts.effect, 241, 211, 58, 45, 8); ctx.restore();
  }
  ctx.restore();
  draw(ctx, parts.base, 150, 288, 254, 68, pose.follow * 0.7, 0.5, 1);
}

function drawFern(ctx, parts, pose) {
  ctx.save(); ctx.translate(151, 279); ctx.rotate(rad(pose.sway * 2 - pose.recoil * 3)); ctx.translate(-151, -279);
  draw(ctx, parts['frond-left'], 148, 281, 170, 218, -pose.follow * 6 + pose.windup * 5, 0.65, 1);
  draw(ctx, parts['frond-right'], 163, 281, 156, 194, pose.follow * 9 - pose.windup * 6, 0.36, 1);
  draw(ctx, face(parts, 'body', pose), 155 + pose.strike * 5, 282, 174, 123,
    pose.sway * 1.4, 0.5, 1, 1 + pose.windup * 0.065 - pose.strike * 0.045, 1 - pose.windup * 0.06);
  if (pose.attack && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect;
    draw(ctx, parts.effect, 238, 225, 82, 58, 0); ctx.restore();
  }
  ctx.restore();
  draw(ctx, parts.base, 151, 288, 133, 49, 0, 0.5, 1);
}

function drawNocturne(ctx, parts, pose) {
  draw(ctx, parts.base, 153, 288, 182, 139, pose.sway * 0.35, 0.5, 1);
  ctx.save(); ctx.translate(156 - pose.pull * 5 - pose.recoil * 4, 221 + pose.exhaust * 3);
  ctx.rotate(rad(pose.sway * 1.15 - pose.windup * 2 - pose.pull * 3.5 + pose.exhaust * 3 - pose.recoil * 3));
  ctx.translate(-156, -221);
  draw(ctx, parts['mantle-left'], 132, 159, 91, 140,
    pose.open * 17 - pose.pull * 18 - pose.follow * 2 + pose.exhaust * 6, 0.82, 0.14);
  draw(ctx, parts['mantle-right'], 181, 174, 73, 98,
    -pose.open * 19 + pose.pull * 18 + pose.follow * 3 - pose.exhaust * 5, 0.15, 0.13);
  draw(ctx, face(parts, 'body', pose), 157, 219, 177, 195,
    pose.follow * 0.65 - pose.joy * 2.5, 0.5, 1, 1 - pose.windup * 0.015, 1 - pose.windup * 0.022);
  if (pose.charge > 0) {
    ctx.save(); ctx.globalAlpha *= pose.charge * 0.92;
    const size = 39 + pose.charge * 6 + pose.breathe * 1.5;
    draw(ctx, parts.sigil, 229 - pose.pull * 12, 187 + pose.follow * 2, size, size, pose.follow * 5);
    ctx.restore();
  }
  if (pose.ritual && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect * 0.8;
    draw(ctx, parts.effect, 233 - pose.pull * 10, 195, 94, 86, -pose.pull * 28, 0.5, 0.5,
      0.75 + pose.effect * 0.25, 0.8 + pose.effect * 0.2);
    ctx.restore();
  }
  ctx.restore();
}

/** The sun's birth trajectory is shared by animated exports and the live viewer. */
export function sunPosition(position, seconds) {
  const rise = Math.min(seconds, 0.9);
  return [position[0] + rise * 16, position[1] - 94 * rise + 38 * rise * rise];
}

/** Isolated transparent character; moving projectiles belong to the caller's game scene. */
export function renderPlant(ctx, character, parts, clip = 'idle', seconds = 0, { includeEmittedObjects = false, healthRatio = 1 } = {}) {
  const pose = evaluatePose(character, clip, seconds);
  pose.attack = clip === 'attack';
  pose.guarding = clip === 'guard';
  pose.ritual = ['seal', 'channel', 'recall'].includes(clip);
  pose.healthRatio = clip === 'damaged' ? 0.4 : clip === 'critical' ? 0.15 : healthRatio;
  ctx.save(); ctx.globalAlpha *= pose.opacity;
  ctx.translate(150, 288 - pose.jump); ctx.scale(pose.growX, pose.growY); ctx.translate(-150, -288);
  ({ root: drawRoot, cactus: drawCactus, mushroom: drawMushroom, maw: drawMaw,
    lantern: drawLantern, bomb: drawBomb, orchid: drawOrchid, bark: drawBark, fern: drawFern,
    nocturne: drawNocturne })[character.anatomy](ctx, parts, pose);
  if (includeEmittedObjects && clip === 'attack' && character.attackStyle === 'sun' && seconds >= character.projectileEvent) {
    const elapsed = seconds - character.projectileEvent;
    const [x, y] = sunPosition(character.muzzle, elapsed);
    const size = key(elapsed, [[0, 3], [0.13, 48], [0.24, 43], [0.8, 43]]);
    draw(ctx, parts.projectile, x, y, size, size, elapsed * 9);
  }
  if (includeEmittedObjects && pose.attack && character.attackStyle === 'chill') {
    const elapsed = seconds - character.projectileEvent;
    if (elapsed >= 0 && elapsed <= 0.35) {
      ctx.save(); ctx.globalAlpha *= 1 - ease(elapsed / 0.35);
      draw(ctx, parts.projectile, character.muzzle[0] + elapsed * 150, character.muzzle[1], 26, 26, elapsed * 190);
      ctx.restore();
    }
  }
  if (clip === 'spawn' && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect;
    draw(ctx, parts.effect, 150, 278, 116, 39); ctx.restore();
  }
  if (clip === 'hit' && pose.effect > 0) {
    ctx.save(); ctx.globalAlpha *= pose.effect;
    draw(ctx, parts.effect, 235, character.anatomy === 'mushroom' ? 173 : 108, 38, 38, 15); ctx.restore();
  }
  if (clip === 'celebrate' && pose.effect > 0 && character.anatomy !== 'nocturne') {
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.globalAlpha *= pose.effect * 0.7;
      draw(ctx, parts.effect, 67 + i * 81, 120 + Math.sin(i * 2 + pose.progress * 3) * 25, 25, 25, i * 23);
      ctx.restore();
    }
  }
  ctx.restore();
  return pose;
}

export async function loadPlant(id, baseURL = new URL('../', import.meta.url)) {
  const character = CHARACTERS.find(item => item.id === id);
  if (!character) throw new Error(`Unknown plant: ${id}`);
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name => {
    const image = new Image();
    image.src = new URL(`characters/${id}/parts/${name}.png`, baseURL).href;
    await image.decode();
    return [name, image];
  })));
  return { character, parts };
}

/** Framework-free clock. A caller can update/draw all plants in one requestAnimationFrame loop. */
export class PlantAnimator {
  constructor(character, parts, { onEvent } = {}) {
    this.character = character; this.parts = parts; this.onEvent = onEvent;
    this.clip = 'idle'; this.seconds = 0; this.released = false; this.spent = false; this.healthRatio = 1;
  }
  play(clip) {
    if (!CLIPS[clip]) throw new Error(`Unknown animation: ${clip}`);
    if (!clipsFor(this.character)[clip]) return false;
    if (this.spent && clip !== 'spawn') return false;
    if (clip === 'spawn') this.healthRatio = 1;
    if (clip === 'damaged') this.healthRatio = 0.4;
    if (clip === 'critical') this.healthRatio = 0.15;
    this.spent = false;
    this.clip = clip; this.seconds = 0; this.released = false;
    return true;
  }
  update(deltaSeconds) {
    if (this.spent) return;
    const delta = clamp(deltaSeconds, 0, 0.1);
    this.seconds += delta * (CLIPS[this.clip].loop && this.clip !== 'channel' ? this.character.tempo : 1);
    const event = animationEvents(this.character, this.clip)[0];
    if (event && !this.released && this.seconds >= event.time) {
      this.released = true;
      this.onEvent?.(event);
    }
    const info = CLIPS[this.clip];
    if (this.seconds >= info.duration) {
      if (info.loop) this.seconds %= info.duration;
      else if (this.clip === 'attack' && this.character.consumedOnAction) {
        this.seconds = info.duration; this.spent = true;
      } else { this.clip = afterClip(this.character, this.clip); this.seconds = 0; this.released = false; }
    }
  }
  setHealthRatio(ratio) { this.healthRatio = clamp(ratio); }
  draw(ctx) { return renderPlant(ctx, this.character, this.parts, this.clip, this.seconds, { healthRatio: this.healthRatio }); }
}
