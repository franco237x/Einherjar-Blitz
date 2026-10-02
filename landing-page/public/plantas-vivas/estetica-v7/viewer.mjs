import { CHARACTERS, loadPlant, PlantAnimator, clipLabel } from './runtime/plant-rig.mjs';
import { loadPracticeTarget, FreshPractice } from './runtime/fresh-scene.mjs';

const $ = selector => document.querySelector(selector);
const canvas = $('#plant-stage'), ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)'), base = new URL('./', import.meta.url);
const cache = new Map(), WIDTH = 720, HEIGHT = 440, SCALE = 1.26;
const pixelRatio = Math.min(devicePixelRatio || 1, 2);
canvas.width = WIDTH * pixelRatio; canvas.height = HEIGHT * pixelRatio;
let animator = null, practice = null, selected = null, particles = [];
let paused = reduced.matches, flipped = false, repeat = false, speed = 1, background = 'garden';
let frameId = null, previousTime = null, revision = 0, requestedClip = 'idle';

export const freshPracticeSnapshot = () => practice?.snapshot() ?? null;
export const animationSnapshot = () => animator ? { plant: selected.id, clip: animator.clip, seconds: animator.seconds, paused } : null;

function pauseLabel() {
  $('#pause').textContent = paused ? 'Reproducir' : 'Pausar';
  $('#pause').setAttribute('aria-pressed', String(paused));
}
function setLoading(loading) {
  $('#workbench').setAttribute('aria-busy', String(loading));
  for (const button of document.querySelectorAll('[data-clip], #reset-fresh')) button.disabled = loading;
}
function readout() {
  if (!practice) return;
  const state = practice.snapshot();
  for (const [id, value] of Object.entries({ 'fresh-health': state.health, 'fresh-armor': state.armor,
    'fresh-hits': state.hits, 'fresh-blocked': state.blocked > 0 ? `${state.blocked.toFixed(1)} s` : '—' })) {
    if ($(`#${id}`).textContent !== String(value)) $(`#${id}`).textContent = value;
  }
}
function updateAction() {
  if (!animator) return;
  for (const button of document.querySelectorAll('[data-clip]')) button.setAttribute('aria-pressed', String(button.dataset.clip === animator.clip));
  const clip = animator.clip;
  $('#download-animation').href = new URL(`characters/${selected.id}/animated/${clip}.webp`, base).href;
  $('#download-sprites').href = new URL(`characters/${selected.id}/sprites/${clip}.png`, base).href;
}
function receiveEvent(event) {
  if (event.type === 'aroma' || event.type === 'acid') {
    particles.push({ x: event.position[0], y: event.position[1], vx: event.velocity[0], life: 0, event });
  } else if (event.type === 'punch' && practice) {
    const result = practice.receive(event);
    $('#status').textContent = result.hit ? `${event.label} · ${event.damage} de daño.` : 'El golpe quedó fuera de alcance.';
    readout();
  }
}
function drawScene() {
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!animator) return;
  if (background === 'garden') {
    ctx.fillStyle = '#476b3430'; ctx.beginPath();
    ctx.ellipse(48 + (flipped ? 310 : 150) * SCALE, 24 + 288 * SCALE, 72, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save(); ctx.translate(48 + (flipped ? 460 * SCALE : 0), 24); ctx.scale(flipped ? -SCALE : SCALE, SCALE);
  animator.draw(ctx); practice?.draw(ctx, animator.parts, background === 'dark');
  for (const particle of particles) {
    const image = animator.parts.projectile, width = particle.event.type === 'aroma' ? 64 : 39;
    const height = width * image.height / image.width;
    ctx.save(); ctx.globalAlpha = Math.min(1, (1.4 - particle.life) / 0.25);
    ctx.drawImage(image, particle.x - width / 2, particle.y - height / 2, width, height); ctx.restore();
  }
  ctx.restore();
  const label = clipLabel(selected, animator.clip);
  if ($('#now-playing').textContent !== label) $('#now-playing').textContent = label;
}
function tick(time) {
  frameId = null;
  const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000 * speed, 0.1);
  previousTime = time;
  if (!paused && animator) {
    practice.update(delta);
    const previousClip = animator.clip; animator.update(delta);
    if (repeat && requestedClip !== 'idle' && previousClip !== 'idle' && animator.clip === 'idle') animator.play(requestedClip);
    if (animator.clip !== previousClip) updateAction();
    for (const particle of particles) {
      particle.life += delta; particle.x += particle.vx * delta;
      if (particle.life < 1.4 && particle.x >= practice.target.x) {
        const result = practice.receive(particle.event);
        $('#status').textContent = !result.hit ? 'El objetivo ya cayó.' : particle.event.type === 'aroma'
          ? 'El coro interrumpe el mordisco durante 1,1 s.'
          : `Jugo ácido · protección −${result.armorLost}, vida −${result.healthLost}.`;
        particle.life = 1.4;
      }
    }
    particles = particles.filter(particle => particle.life < 1.4); readout();
  }
  drawScene();
  if (!paused && !document.hidden) frameId = requestAnimationFrame(tick);
}
function refresh() {
  drawScene();
  if (!paused && !document.hidden && frameId === null) { previousTime = null; frameId = requestAnimationFrame(tick); }
}
function chooseClip(clip) {
  if (!animator?.play(clip)) return;
  requestedClip = clip; particles = []; $('#status').textContent = '';
  if (clip !== 'idle') paused = false;
  updateAction(); pauseLabel(); refresh();
}
async function choosePlant(character) {
  const selection = ++revision;
  setLoading(true);
  try {
    if (!cache.has(character.id)) cache.set(character.id, loadPlant(character.id));
    const [data, target] = await Promise.all([cache.get(character.id), loadPracticeTarget($('#fresh-target').value)]);
    if (selection !== revision) return;
    selected = character; practice = new FreshPractice(target, character);
    animator = new PlantAnimator(data.character, data.parts, { onEvent: receiveEvent });
    $('#fresh-far').checked = false;
    $('#character-name').textContent = character.name; $('#character-role').textContent = character.role;
    $('#character-description').textContent = character.description; $('#motion-note').textContent = character.motion;
    $('[data-clip="attack"] .action-label').textContent = character.actionLabel;
    canvas.setAttribute('aria-label', `${character.name}: ${character.description}`);
    for (const card of document.querySelectorAll('[data-plant]')) card.setAttribute('aria-pressed', String(card.dataset.plant === character.id));
    chooseClip('idle'); readout(); setLoading(false);
  } catch (error) {
    if (selection !== revision) return;
    setLoading(false);
    cache.delete(character.id); $('#status').textContent = `No se pudo abrir ${character.name}. Recarga la página para volver a intentarlo.`;
    console.error(error);
  }
}
for (const character of CHARACTERS) {
  const card = document.createElement('button'); card.type = 'button'; card.className = 'plant-card'; card.dataset.plant = character.id;
  card.setAttribute('aria-pressed', 'false');
  const image = document.createElement('img'); image.src = new URL(`characters/${character.id}/portrait.png`, base).href;
  image.width = 70; image.height = 76; image.alt = '';
  const caption = document.createElement('span'), name = document.createElement('strong'), role = document.createElement('small');
  name.textContent = character.name; role.textContent = character.role; caption.append(name, role); card.append(image, caption);
  card.addEventListener('click', () => choosePlant(character)); $('#roster').append(card);
}
for (const button of document.querySelectorAll('[data-clip]')) button.addEventListener('click', () => chooseClip(button.dataset.clip));
for (const button of document.querySelectorAll('[data-background]')) button.addEventListener('click', () => {
  background = button.dataset.background; $('#stage').className = `stage ${background}`;
  for (const item of document.querySelectorAll('[data-background]')) item.setAttribute('aria-pressed', String(item === button)); refresh();
});
$('#pause').addEventListener('click', () => {
  paused = !paused; if (paused && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
  pauseLabel(); refresh();
});
$('#speed').addEventListener('input', event => { speed = Number(event.target.value); $('#speed-value').textContent = `${speed}×`; });
$('#flip').addEventListener('change', event => { flipped = event.target.checked; refresh(); });
$('#repeat').addEventListener('change', event => { repeat = event.target.checked; });
$('#fresh-target').addEventListener('change', () => { if (selected) choosePlant(selected); });
$('#fresh-far').addEventListener('change', event => { practice?.setFar(event.target.checked); refresh(); });
$('#reset-fresh').addEventListener('click', () => {
  practice?.reset(); practice?.setFar($('#fresh-far').checked); chooseClip('idle'); readout();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
  else refresh();
});
reduced.addEventListener('change', event => {
  if (!event.matches) return;
  paused = true; if (frameId !== null) { cancelAnimationFrame(frameId); frameId = null; } pauseLabel(); refresh();
});
pauseLabel(); await choosePlant(CHARACTERS[0]);
