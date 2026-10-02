import { CHARACTERS, ACTIVE_CHARACTERS, ARCHIVED_CHARACTERS, CLIPS, clipsFor, loadPlant, PlantAnimator, clipLabel, sunPosition,
  createColdStatus, applyChill, updateColdStatus, actionEvent,
  createShadowRecall, canMarkShadow, markShadow, interruptShadowRecall, updateShadowRecall } from './runtime/plant-rig.mjs';
import { createShadowTarget, advanceShadowTarget, drawShadowPractice } from './runtime/shadow-scene.mjs';
import { loadPracticeTarget, FreshPractice } from './runtime/fresh-scene.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#plant-stage'), ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const base = new URL('./', import.meta.url);
const cache = new Map();
const archived = new URL(location.href).searchParams.get('archivo') === '1';
const catalogResponse = await fetch(new URL('manifest.json', base));
if (!catalogResponse.ok) throw new Error('No se pudo cargar el catálogo de plantas.');
const catalog = await catalogResponse.json();
const availableIds = new Set((archived ? catalog.archivedCharacters ?? [] : catalog.characters).map(character => character.id));
const roster = (archived ? ARCHIVED_CHARACTERS : ACTIVE_CHARACTERS).filter(character => availableIds.has(character.id));
roster.sort((a, b) => Number(['cilantro', 'limon', 'jengibron'].includes(b.id)) - Number(['cilantro', 'limon', 'jengibron'].includes(a.id)));
let practice = null;
const isFresh = character => ['aroma', 'acid', 'punch'].includes(character?.attackStyle);
export const freshPracticeSnapshot = () => practice?.snapshot() ?? null;
let animator = null, selected = null, requestedClip = 'idle';
let paused = reducedMotion.matches, frameId = null, previousTime = null, speed = 1;
let particles = [], selectionRevision = 0;
let background = 'garden', flipped = false, repeat = false;
let coldStatus = createColdStatus(), targetPhase = 0, targetSpeed = 1, impactRemaining = 0;
let shadowState = createShadowRecall(), shadowTarget = createShadowTarget(), shadowClock = 0, shadowFlash = null;
let shadowManaged = false, shadowMarkCreated = false, shadowReturns = 0;
const WIDTH = 720, HEIGHT = 440, SCALE = 1.26, OFFSET_X = 164, OFFSET_Y = 24;
const pixelRatio = Math.min(devicePixelRatio || 1, 2);
canvas.width = WIDTH * pixelRatio; canvas.height = HEIGHT * pixelRatio;

function pauseLabel() {
  $('#pause').textContent = paused ? 'Reproducir' : 'Pausar';
  $('#pause').setAttribute('aria-pressed', String(paused));
}

function receiveEvent(event) {
  if (['projectile', 'chill', 'aroma', 'acid'].includes(event.type)) {
    particles.push({ x: event.position[0], y: event.position[1], vx: event.velocity[0], life: 0, image: animator.parts.projectile,
      kind: animator.character.attackStyle, event });
  }
  if (event.type === 'sun') {
    particles.push({ x: event.position[0], y: event.position[1], origin: event.position, life: 0,
      vx: 0, image: animator.parts.projectile, kind: 'sun' });
    $('#status').textContent = `Sol creado · ${event.value} de energía.`;
  }
  if (event.type === 'explosion') $('#status').textContent = 'Explosión · Replanta a Granadín para usarlo otra vez.';
  if (event.type === 'bloom') $('#status').textContent = 'Aurélia despliega su floración de nácar.';
  if (event.type === 'block') $('#status').textContent = 'Cortezón absorbe el impacto. Daño ofensivo: 0.';
  if (event.type === 'punch' && practice) {
    const result = practice.receive(event);
    $('#status').textContent = result.hit ? `${event.hand === 'front' ? 'Jab' : 'Cruzado'} · ${event.damage} de daño.` : 'El golpe quedó fuera de alcance.';
    freshReadout();
  }
  if (event.type === 'shadow-mark') {
    shadowMarkCreated = markShadow(shadowState, event, shadowTarget);
    if (shadowMarkCreated) $('#status').textContent = 'Sombra anclada. El objetivo sigue avanzando durante 2 s.';
    else { shadowManaged = false; animator.play('recover'); $('#status').textContent = 'No hay un objetivo válido para la marca.'; }
    updateActionAvailability();
  }
}

function freshReadout() {
  if (!practice) return;
  const state = practice.snapshot();
  const values = { 'fresh-health': state.health, 'fresh-armor': state.armor, 'fresh-hits': state.hits,
    'fresh-blocked': state.blocked > 0 ? `${state.blocked.toFixed(1)} s` : '—' };
  for (const [id, value] of Object.entries(values)) if ($(`#${id}`).textContent !== String(value)) $(`#${id}`).textContent = value;
}

function shadowReadout() {
  const phase = !shadowTarget.alive ? 'Sin objetivo' : animator?.clip === 'seal' && shadowState.phase === 'ready' ? 'Sellando'
    : { ready: 'Lista', marked: 'Sombra marcada', recalling: 'Retorno', cooldown: 'Recargando' }[shadowState.phase];
  const values = {
    'shadow-phase': phase, 'shadow-delay': ['marked', 'recalling'].includes(shadowState.phase) ? `${shadowState.remaining.toFixed(1)} s` : '—',
    'shadow-cooldown': `${shadowState.cooldownRemaining.toFixed(1)} s`, 'shadow-returns': String(shadowReturns),
  };
  for (const [id, value] of Object.entries(values)) if ($(`#${id}`).textContent !== value) $(`#${id}`).textContent = value;
  $('#toggle-shadow-target').textContent = shadowTarget.alive ? 'Retirar objetivo' : 'Restaurar objetivo';
}

/** Read-only practice snapshot for reviewing timing and enemy displacement. */
export function shadowPracticeSnapshot() {
  return { phase: shadowState.phase, remaining: shadowState.remaining, cooldownRemaining: shadowState.cooldownRemaining,
    anchor: shadowState.anchor ? { ...shadowState.anchor } : null, target: { ...shadowTarget }, returns: shadowReturns, clip: animator?.clip };
}

function resetShadow() {
  shadowState = createShadowRecall(); shadowTarget = createShadowTarget(); shadowClock = 0; shadowFlash = null;
  shadowManaged = false; shadowMarkCreated = false; shadowReturns = 0;
  if (selected?.attackStyle === 'shadow-mark') { animator.play('idle'); requestedClip = 'idle'; updateActionAvailability(); }
  shadowReadout(); refresh();
}

function shadowEvent(event) {
  if (event.type === 'shadow-recall-start' && shadowManaged) {
    animator.play('recall'); animator.seconds = event.elapsed;
    $('#status').textContent = 'Velaria cierra el vínculo y reclama la sombra.';
  }
  if (event.type === 'shadow-rewind') {
    shadowFlash = { event, remaining: 0.55 }; shadowReturns++;
    $('#status').textContent = 'Eco umbrío: el objetivo regresó a su ancla. Su vida y velocidad se conservan.';
  }
  if (event.type === 'shadow-cancel') {
    if (shadowManaged) animator.play('recover');
    shadowManaged = false;
    $('#status').textContent = event.reason === 'caster-hit' ? 'El golpe rompió el vínculo. La recarga continúa.' : 'El objetivo se perdió: la marca se disipa y la recarga continúa.';
  }
}

function coldReadout() {
  const state = coldStatus.freezeRemaining > 0 ? 'Congelado' : coldStatus.slowRemaining > 0 ? 'Ralentizado' : 'Normal';
  const speedText = `${Math.round(targetSpeed * 100)}%`;
  if ($('#cold-state').textContent !== state) $('#cold-state').textContent = state;
  if ($('#cold-speed').textContent !== speedText) $('#cold-speed').textContent = speedText;
  const stacks = `Escarcha ${coldStatus.stacks}/3`;
  if ($('#cold-stacks').textContent !== stacks) $('#cold-stacks').textContent = stacks;
}

function resetCold() {
  coldStatus = createColdStatus(); targetSpeed = 1; targetPhase = 0; impactRemaining = 0;
  particles = particles.filter(particle => particle.kind !== 'chill');
  coldReadout(); refresh();
}

function updateActionAvailability() {
  const available = animator ? clipsFor(animator.character) : {};
  for (const button of document.querySelectorAll('[data-clip]')) {
    button.hidden = !available[button.dataset.clip];
    button.disabled = Boolean(animator?.spent && button.dataset.clip !== 'spawn')
      || Boolean(selected?.attackStyle === 'shadow-mark' && button.dataset.clip === 'seal'
        && (animator.clip === 'seal' || !canMarkShadow(shadowState, actionEvent(selected), shadowTarget)));
    button.setAttribute('aria-pressed', String(button.dataset.clip === animator?.clip));
  }
  const spawn = $('[data-clip="spawn"] .action-label');
  if (spawn) spawn.textContent = animator?.character.consumedOnAction ? 'Replantar' : 'Brotar';
  if (animator) {
    $('#integrity').value = Math.round(animator.healthRatio * 100);
    $('#integrity-value').textContent = `${Math.round(animator.healthRatio * 100)}%`;
    const clip = animator.clip;
    const downloadClip = selected.defenseOnly && clip === 'idle' ? animator.healthRatio <= 0.25 ? 'critical' : animator.healthRatio <= 0.55 ? 'damaged' : 'idle' : clip;
    $('#download-animation').href = new URL(`characters/${selected.id}/animated/${downloadClip}.webp`, base).href;
    $('#download-sprites').href = new URL(`characters/${selected.id}/sprites/${downloadClip}.png`, base).href;
  }
}

function drawScene() {
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!animator) return;
  const isShadow = selected.attackStyle === 'shadow-mark';
  const originX = isShadow || isFresh(selected) ? 48 : OFFSET_X, mirrorX = isShadow || isFresh(selected) ? 460 : 300;
  if (background === 'garden') {
    ctx.fillStyle = '#476b3430';
    ctx.beginPath(); ctx.ellipse(originX + (flipped ? mirrorX - 150 : 150) * SCALE, OFFSET_Y + 288 * SCALE, 72, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(originX + (flipped ? mirrorX * SCALE : 0), OFFSET_Y);
  ctx.scale(flipped ? -SCALE : SCALE, SCALE);
  animator.draw(ctx);
  if (isFresh(selected) && practice) practice.draw(ctx, animator.parts, background === 'dark');
  if (isShadow) drawShadowPractice(ctx, animator.parts, shadowState, shadowTarget,
    { clock: shadowClock, flash: shadowFlash, dark: background === 'dark' });
  if (selected.attackStyle === 'chill') {
    const x = 337, y = 225 + Math.sin(targetPhase) * 13;
    ctx.fillStyle = coldStatus.freezeRemaining > 0 ? '#baeafa' : coldStatus.slowRemaining > 0 ? '#72beca' : '#758981';
    ctx.strokeStyle = '#f4fffa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 15, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (coldStatus.freezeRemaining > 0 || impactRemaining > 0) {
      const ice = animator.parts.projectile;
      const size = coldStatus.freezeRemaining > 0 ? 54 : 35 + impactRemaining * 45;
      ctx.save(); ctx.globalAlpha = coldStatus.freezeRemaining > 0 ? 0.9 : impactRemaining / 0.35;
      ctx.drawImage(ice, x - size / 2, y - size / 2, size, size); ctx.restore();
    }
    ctx.fillStyle = background === 'dark' ? '#e3f0ea' : '#315345'; ctx.font = '11px Trebuchet MS';
    ctx.textAlign = 'center'; ctx.fillText('Objetivo', x, 263); ctx.textAlign = 'start';
  }
  for (const particle of particles) {
    ctx.save();
    const lifetime = particle.kind === 'sun' ? 3.0 : 1.4;
    ctx.globalAlpha = Math.min(1, (lifetime - particle.life) / 0.25);
    const width = particle.kind === 'aroma' ? 64 : particle.kind === 'sun' ? Math.min(1, particle.life / 0.12) * 45 : particle.kind === 'thorn' ? 56 : 39;
    const height = width * particle.image.height / particle.image.width;
    ctx.drawImage(particle.image, particle.x - width * 0.5, particle.y - height * 0.5, width, height);
    ctx.restore();
  }
  ctx.restore();
  const label = clipLabel(animator.character, animator.clip, animator.spent);
  if ($('#now-playing').textContent !== label) $('#now-playing').textContent = label;
}

function tick(time) {
  frameId = null;
  const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000 * speed, 0.1);
  previousTime = time;
  if (!paused && animator) {
    if (isFresh(selected) && practice) practice.update(delta);
    const previousClip = animator.clip;
    const previousShadowPhase = shadowState.phase;
    shadowMarkCreated = false;
    if (selected.attackStyle === 'shadow-mark') {
      shadowClock += delta; advanceShadowTarget(shadowTarget, delta);
      if (shadowFlash) shadowFlash.remaining = Math.max(0, shadowFlash.remaining - delta);
    }
    animator.update(delta);
    if (animator.spent) {
      if (repeat) { animator.play('spawn'); requestedClip = 'attack'; updateActionAvailability(); }
      else updateActionAvailability();
    }
    if (selected.attackStyle !== 'shadow-mark' && repeat && requestedClip !== 'idle' && previousClip !== 'idle' && animator.clip === 'idle') animator.play(requestedClip);
    if (selected.attackStyle === 'shadow-mark') {
      for (const event of updateShadowRecall(shadowState, shadowMarkCreated ? 0 : delta, shadowTarget)) shadowEvent(event);
      if (repeat && requestedClip === 'seal' && shadowManaged && animator.clip === 'idle'
        && canMarkShadow(shadowState, actionEvent(selected), shadowTarget)) animator.play('seal');
      shadowReadout();
    }
    if (previousClip !== animator.clip || previousShadowPhase !== shadowState.phase) updateActionAvailability();
    targetSpeed = updateColdStatus(coldStatus, delta); targetPhase += delta * targetSpeed * 3;
    impactRemaining = Math.max(0, impactRemaining - delta);
    for (const particle of particles) {
      particle.life += delta; particle.x += particle.vx * delta;
      if (particle.kind === 'spore') particle.y -= 12 * delta;
      if (particle.kind === 'sun') [particle.x, particle.y] = sunPosition(particle.origin, particle.life);
      if (particle.kind === 'chill' && particle.x >= 322) {
        const froze = applyChill(coldStatus, particle.event);
        targetSpeed = updateColdStatus(coldStatus, 0); impactRemaining = 0.35;
        $('#status').textContent = froze ? 'Tres impactos: objetivo congelado durante 1,2 s.' : 'Impacto de escarcha: velocidad al 50% durante 3 s.';
        particle.life = 1.4;
      }
      if (['aroma', 'acid'].includes(particle.kind) && practice && particle.x >= practice.target.x) {
        const result = practice.receive(particle.event);
        $('#status').textContent = !result.hit ? 'El objetivo ya cayó.' : particle.kind === 'aroma'
          ? 'El aroma interrumpe el mordisco durante 1,1 s. La velocidad se conserva.'
          : `Jugo ácido · protección −${result.armorLost}, vida −${result.healthLost}.`;
        particle.life = 1.4;
      }
    }
    particles = particles.filter(particle => particle.life < (particle.kind === 'sun' ? 3 : 1.4));
    if (selected.attackStyle === 'chill') coldReadout();
    if (isFresh(selected)) freshReadout();
  }
  drawScene();
  if (!paused && !document.hidden) frameId = requestAnimationFrame(tick);
}

function refresh() {
  drawScene();
  if (!paused && !document.hidden && frameId === null) { previousTime = null; frameId = requestAnimationFrame(tick); }
}

function chooseClip(clip) {
  if (!animator) return;
  if (selected.attackStyle === 'shadow-mark') {
    if (clip === 'seal' && (animator.clip === 'seal' || !canMarkShadow(shadowState, actionEvent(selected), shadowTarget))) return;
    if (clip !== 'seal') {
      const cancelled = interruptShadowRecall(shadowState, clip === 'hit' ? 'caster-hit' : 'preview-changed');
      if (cancelled) shadowEvent(cancelled);
    }
    shadowManaged = clip === 'seal';
  }
  if (!animator.play(clip)) return;
  requestedClip = clip; particles = [];
  if (selected.attackStyle !== 'shadow-mark' || clip !== 'hit') $('#status').textContent = '';
  updateActionAvailability();
  if (clip !== 'idle') paused = false;
  if (selected.attackStyle === 'shadow-mark') shadowReadout();
  pauseLabel(); refresh();
}

async function choosePlant(character) {
  const revision = ++selectionRevision;
  try {
    if (!cache.has(character.id)) cache.set(character.id, loadPlant(character.id));
    const data = await cache.get(character.id);
    const target = isFresh(character) ? await loadPracticeTarget($('#fresh-target').value) : null;
    if (revision !== selectionRevision) return;
    selected = character;
    practice = target ? new FreshPractice(target, character) : null;
    $('#fresh-far').checked = false;
    animator = new PlantAnimator(data.character, data.parts, { onEvent: receiveEvent });
    $('#character-name').textContent = character.name;
    $('#character-role').textContent = character.role;
    $('#character-description').textContent = character.description;
    $('#motion-note').textContent = character.motion;
    const primary = $('[data-action="primary"]');
    primary.dataset.clip = character.primaryClip ?? 'attack';
    primary.querySelector('.action-label').textContent = character.actionLabel ?? 'Atacar';
    primary.querySelector('[aria-hidden]').textContent = character.defenseOnly ? '▣' : '➜';
    $('#integrity-controls').hidden = !character.defenseOnly;
    $('#cold-demo').hidden = character.attackStyle !== 'chill';
    $('#shadow-demo').hidden = character.attackStyle !== 'shadow-mark';
    $('#fresh-demo').hidden = !isFresh(character);
    freshReadout();
    resetCold();
    resetShadow();
    canvas.setAttribute('aria-label', `${character.name}: ${character.description}`);
    for (const card of document.querySelectorAll('[data-plant]')) card.setAttribute('aria-pressed', String(card.dataset.plant === character.id));
    $('#status').textContent = '';
    chooseClip('idle');
  } catch (error) {
    cache.delete(character.id);
    $('#status').textContent = `No se pudo abrir ${character.name}. Recarga la página para volver a intentarlo.`;
    console.error(error);
  }
}

for (const character of roster) {
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'plant-card'; card.dataset.plant = character.id;
  card.setAttribute('aria-pressed', 'false');
  const image = document.createElement('img');
  image.src = new URL(`characters/${character.id}/portrait.png`, base).href;
  image.width = 70; image.height = 76; image.alt = '';
  const caption = document.createElement('span'), name = document.createElement('strong'), role = document.createElement('small');
  name.textContent = character.name; role.textContent = character.role;
  caption.append(name, role); card.append(image, caption);
  card.addEventListener('click', () => choosePlant(character)); $('#roster').append(card);
}
for (const button of document.querySelectorAll('[data-clip]')) button.addEventListener('click', () => chooseClip(button.dataset.clip));
for (const button of document.querySelectorAll('[data-background]')) button.addEventListener('click', () => {
  background = button.dataset.background; $('#stage').className = `stage ${background}`;
  for (const item of document.querySelectorAll('[data-background]')) item.setAttribute('aria-pressed', String(item === button));
  refresh();
});
$('#pause').addEventListener('click', () => {
  paused = !paused;
  if (paused && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
  pauseLabel(); refresh();
});
$('#speed').addEventListener('input', event => { speed = Number(event.target.value); $('#speed-value').textContent = `${speed}×`; });
$('#flip').addEventListener('change', event => { flipped = event.target.checked; refresh(); });
$('#repeat').addEventListener('change', event => { repeat = event.target.checked; });
$('#integrity').addEventListener('input', event => {
  if (!animator?.character.defenseOnly) return;
  animator.setHealthRatio(Number(event.target.value) / 100);
  chooseClip('idle');
});
$('#reset-cold').addEventListener('click', resetCold);
$('#reset-fresh').addEventListener('click', () => {
  if (!practice) return;
  practice.reset(); practice.setFar($('#fresh-far').checked); particles = [];
  chooseClip('idle'); freshReadout();
});
$('#fresh-target').addEventListener('change', () => { if (isFresh(selected)) choosePlant(selected); });
$('#fresh-far').addEventListener('change', event => { practice?.setFar(event.target.checked); refresh(); });
$('#reset-shadow').addEventListener('click', () => { resetShadow(); $('#status').textContent = 'Prueba del eco reiniciada.'; });
$('#toggle-shadow-target').addEventListener('click', () => {
  shadowTarget.alive = !shadowTarget.alive;
  if (!shadowTarget.alive) {
    const cancelled = interruptShadowRecall(shadowState, 'target-lost');
    if (cancelled) shadowEvent(cancelled);
    else if (animator.clip === 'seal') { shadowManaged = false; animator.play('recover'); }
  }
  updateActionAvailability(); shadowReadout(); refresh();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; previousTime = null; }
  else refresh();
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    paused = true;
    if (frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
    pauseLabel(); refresh();
  }
});
pauseLabel();
if (archived) {
  $('.intro p').textContent = 'Archivo de Aurélia y Velaria. Sus piezas y animaciones siguen disponibles para revisar conceptos anteriores.';
  $('.roster-heading span').textContent = 'Dos conceptos archivados';
}
else $('.roster-heading span').textContent = `${roster.length} plantas con siluetas y movimientos propios`;
await choosePlant(roster.find(character => character.id === (archived ? 'velaria' : 'cilantro')) ?? roster[0]);
