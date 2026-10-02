import { ZOMBIES, CLIPS, loadZombie, ZombieAnimator } from './runtime/zombie-rig.mjs';

const $ = id => document.getElementById(id), canvas = $('zombie-stage'), ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let animator, paused = reduced.matches, speed = 1, previous = 0, bites = 0, position = 360, request = 0, shownClip;
const cache = new Map();
const roster = $('roster'), actions = $('actions');
for (const character of ZOMBIES) {
  const button = document.createElement('button'); button.type = 'button'; button.dataset.character = character.id;
  button.setAttribute('aria-pressed', 'false');
  const image = document.createElement('img'); image.src = `./characters/${character.id}/portrait.png`; image.alt = ''; image.width = 104; image.height = 104;
  const label = document.createElement('span'); label.textContent = character.name;
  const detail = document.createElement('small'); detail.textContent = character.role; label.append(detail); button.append(image, label);
  button.addEventListener('click', () => select(character.id)); roster.append(button);
}
function pauseLabel() { $('pause').textContent = paused ? 'Reanudar' : 'Pausar'; $('pause').setAttribute('aria-pressed', String(paused)); }
function synchronize() {
  if (!animator) return;
  const { character, clip, health, armor, dead, dying } = animator;
  if (shownClip !== clip) {
    shownClip = clip;
    $('download-animation').href = `./characters/${character.id}/animated/${clip}.webp`;
    $('download-sprites').href = `./characters/${character.id}/sprites/${clip}.png`;
  }
  $('now-playing').textContent = dead ? 'En el suelo' : CLIPS[clip].label;
  for (const button of actions.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.clip === clip));
    button.disabled = (dead || dying) && button.dataset.clip !== 'spawn';
  }
  $('health').value = health; $('health-value').value = `${health} / ${character.health}`;
  $('armor').value = armor; $('armor-value').value = `${armor} / ${character.armor}`;
  $('bite-count').value = bites; $('damage').disabled = dead || dying;
  $('damage-note').textContent = dead || dying ? 'Volver a entrar restaura la vida y la protección.' : armor > 0 ? 'El daño alcanza primero la protección.' : 'Los siguientes golpes alcanzan la vida.';
}
async function select(id) {
  const selection = ++request;
  $('status').textContent = 'Preparando las animaciones…';
  try {
    if (!cache.has(id)) cache.set(id, loadZombie(id));
    const { character, parts } = await cache.get(id); if (selection !== request) return;
    bites = 0; position = 360; shownClip = null;
    animator = new ZombieAnimator(character, parts, { onEvent(event) { if (event.type === 'bite') bites++; } });
    $('character-name').textContent = character.name; $('character-role').textContent = character.role;
    $('character-description').textContent = character.description; $('motion-note').textContent = character.motion;
    canvas.setAttribute('aria-label', `${character.name}, ${character.role.toLowerCase()}, animación seleccionada.`);
    $('health').max = character.health; $('armor').max = character.armor || 100;
    $('armor-stat').hidden = !character.armor;
    for (const button of roster.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.character === id));
    actions.replaceChildren();
    for (const clip of character.clips) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.clip = clip;
      button.textContent = clip === 'spawn' ? 'Volver a entrar' : CLIPS[clip].label;
      button.setAttribute('aria-pressed', String(clip === 'walk'));
      button.addEventListener('click', () => {
        if (animator.play(clip)) {
          if (clip === 'spawn') { position = 360; bites = 0; }
          $('status').textContent = `${character.name} · ${CLIPS[clip].label}.`; synchronize(); draw();
        }
      }); actions.append(button);
    }
    $('status').textContent = paused ? 'Animación en pausa. Reanudar activa el movimiento.' : 'Elige una acción o aplica daño para probar la protección.';
    synchronize(); draw();
  } catch (error) {
    cache.delete(id); $('status').textContent = 'No se pudieron cargar las piezas. Recarga el visor desde el servidor local.';
    console.error(error);
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); if (!animator) return;
  const x = $('travel').checked ? position : 360;
  if ($('stage').classList.contains('garden')) {
    ctx.save(); ctx.fillStyle = '#66744b25'; ctx.beginPath();
    ctx.ellipse(x + 11, 362, animator.dead ? 119 : 58, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.translate(x - 184, 28);
  if ($('flip').checked) { ctx.translate(368, 0); ctx.scale(-1, 1); }
  ctx.scale(1.15, 1.15); animator.draw(ctx); ctx.restore();
}
function frame(timestamp) {
  // Apply playback rate before the cap so long frames cannot produce a large leap.
  const delta = previous ? Math.min(Math.max(0, (timestamp - previous) / 1000) * speed, 0.1) : 0; previous = timestamp;
  if (animator && !paused && !document.hidden) {
    const movement = animator.update(delta);
    if ($('travel').checked) {
      position += movement * 1.15 * ($('flip').checked ? -1 : 1);
      if (position < -210) position = 930; if (position > 930) position = -210;
    }
    synchronize(); draw();
  }
  requestAnimationFrame(frame);
}
$('pause').addEventListener('click', () => { paused = !paused; previous = 0; pauseLabel(); $('status').textContent = paused ? 'Animación en pausa.' : 'Animación en marcha.'; });
$('speed').addEventListener('input', event => { speed = Number(event.target.value); $('speed-value').value = `${speed}×`; });
$('flip').addEventListener('change', draw);
$('travel').addEventListener('change', () => { position = 360; draw(); });
$('damage').addEventListener('click', () => {
  if (!animator) return;
  const result = animator.applyDamage(25);
  $('status').textContent = result.killed ? `${animator.character.name} cayó.` : `Daño: ${result.armorLost} a la protección y ${result.healthLost} a la vida.`;
  synchronize(); draw();
});
for (const button of document.querySelectorAll('[data-background]')) button.addEventListener('click', () => {
  $('stage').className = `stage ${button.dataset.background}`;
  for (const other of document.querySelectorAll('[data-background]')) other.setAttribute('aria-pressed', String(other === button)); draw();
});
document.addEventListener('visibilitychange', () => { previous = 0; });
reduced.addEventListener('change', event => { if (event.matches) { paused = true; previous = 0; pauseLabel(); } });
pauseLabel(); select(ZOMBIES[0].id); requestAnimationFrame(frame);
