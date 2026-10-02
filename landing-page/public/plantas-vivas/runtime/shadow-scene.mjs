/** Optional practice scene. Enemy movement stays separate from the shadow status helper. */
export function createShadowTarget() {
  return { id: 'practice-target', alive: true, lane: 0, x: 403, y: 258, direction: -1, health: 100 };
}

export function advanceShadowTarget(target, seconds) {
  if (!target.alive) return;
  target.x += target.direction * 28 * Math.max(0, seconds);
  if (target.x < 265) { target.x = 530 - target.x; target.direction = 1; }
  if (target.x > 407) { target.x = 814 - target.x; target.direction = -1; }
}

function icon(ctx, image, x, y, width, height = width) {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale, h = image.height * scale;
  ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
}

export function drawShadowPractice(ctx, parts, state, target, { clock = 0, flash = null, dark = false } = {}) {
  const active = ['marked', 'recalling'].includes(state.phase);
  const ink = dark ? '#e4dbf4' : '#51465f';
  ctx.save();
  ctx.lineWidth = 1.4; ctx.strokeStyle = dark ? '#bca8d450' : '#73568742'; ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(262, target.y + 31); ctx.lineTo(409, target.y + 31); ctx.stroke(); ctx.setLineDash([]);
  if (active && state.anchor) {
    const a = state.anchor;
    ctx.save(); ctx.globalAlpha = 0.65;
    ctx.strokeStyle = '#b7efd6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(a.x, a.y + 30, 25, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(230, 190);
    ctx.bezierCurveTo(265, 184 + Math.sin(clock * 3) * 4, a.x - 32, a.y + 40, a.x, a.y + 30); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#7b5b9b';
    ctx.beginPath(); ctx.moveTo(a.x, a.y + 30); ctx.lineTo(target.x, target.y + 30); ctx.stroke();
    ctx.restore();
    icon(ctx, parts.sigil, a.x, a.y + 30, 42, 42);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.font = '11px Trebuchet MS';
    ctx.fillText('Ancla', a.x, a.y + 54);
  }
  if (flash && flash.remaining > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, flash.remaining / 0.35);
    const from = flash.event.from, to = flash.event.to;
    const width = Math.max(55, Math.abs(from.x - to.x) + 28);
    ctx.drawImage(parts.effect, (from.x + to.x) / 2 - width / 2, to.y - 39, width, 78);
    ctx.globalAlpha *= 0.4; ctx.fillStyle = '#9fdcc3';
    for (let i = 1; i <= 3; i++) {
      const x = from.x + (to.x - from.x) * i / 4;
      ctx.beginPath(); ctx.ellipse(x, to.y, 14, 20, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = ink; ctx.font = '11px Trebuchet MS'; ctx.textAlign = 'center';
  if (target.alive) {
    const bob = Math.sin(clock * 5) * 1.2, x = target.x, y = target.y + bob;
    ctx.fillStyle = '#42474e26'; ctx.beginPath(); ctx.ellipse(x, target.y + 30, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#42424e'; ctx.lineWidth = 2;
    ctx.fillStyle = active ? '#898193' : '#939b99';
    ctx.beginPath(); ctx.ellipse(x, y, 16, 22, target.direction * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x - 5, y - 6, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 6, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#42424e'; ctx.beginPath(); ctx.ellipse(x - 5 + target.direction, y - 6, 1.8, 2.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5 + target.direction, y - 6, 1.8, 2.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#646471';
    ctx.beginPath(); ctx.ellipse(x - 8, y + 23, 7, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 8, y + 23, 7, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    if (active) icon(ctx, parts.sigil, x, y + 10, 21);
    ctx.fillStyle = ink; ctx.fillText('Objetivo', x, target.y - 33);
  } else {
    ctx.fillText('Sin objetivo', 339, 219);
  }
  ctx.restore();
}
