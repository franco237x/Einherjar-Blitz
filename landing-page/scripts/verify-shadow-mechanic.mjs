import assert from 'node:assert/strict';
import { CHARACTERS, CLIPS, actionEvent, animationEvents, afterClip, PlantAnimator,
  createShadowRecall, canMarkShadow, markShadow, interruptShadowRecall, updateShadowRecall,
} from '../public/plantas-vivas/runtime/plant-rig.mjs';

export function verifyShadowMechanic() {
  const plant = CHARACTERS.find(character => character.id === 'velaria'), event = actionEvent(plant);
  const enemy = () => ({ id: 'a', alive: true, lane: 2, x: 400, y: 224, health: 85, speed: 28 });
  const target = enemy(), state = createShadowRecall();
  assert(canMarkShadow(state, event, target)); assert(markShadow(state, event, target));
  target.x = 370;
  assert.equal(state.anchor.x, 400, 'The anchor must not follow the enemy.');
  const firstAnchor = state.anchor;
  assert.equal(markShadow(state, event, { ...enemy(), id: 'b', x: 350 }), false, 'A second mark must be rejected.');
  assert.equal(state.anchor, firstAnchor);
  assert.deepEqual(updateShadowRecall(state, 1.63, target), []);
  const starting = updateShadowRecall(state, 0.02, target);
  assert.equal(starting[0].type, 'shadow-recall-start'); assert.equal(state.phase, 'recalling');
  assert.equal(target.x, 370, 'The anticipation cue must not teleport early.');
  target.x = 344;
  const returning = updateShadowRecall(state, 0.36, target);
  assert.equal(returning.length, 1); assert.equal(returning[0].type, 'shadow-rewind');
  assert.equal(target.x, 400); assert.equal(target.health, 85); assert.equal(target.speed, 28);
  assert.equal(returning[0].damage, 0); assert.equal(state.phase, 'cooldown');
  assert.equal(markShadow(state, event, target), false, 'Recovery must not permit another cast.');
  assert.deepEqual(updateShadowRecall(state, 0.5, target), [], 'A mark must rewind once.');
  assert.equal(updateShadowRecall(state, 4.6, target)[0].type, 'shadow-ready');
  assert.equal(state.cooldownRemaining, 0); assert(markShadow(state, event, target));

  for (const invalidation of [
    current => { current.alive = false; },
    current => { current.id = 'replacement'; },
    current => { current.lane = 3; },
    current => { current.x = 500; },
  ]) {
    const current = enemy(), status = createShadowRecall();
    markShadow(status, event, current); invalidation(current);
    const previousX = current.x, cancelled = updateShadowRecall(status, 0.1, current);
    assert.equal(cancelled.length, 1); assert.equal(cancelled[0].type, 'shadow-cancel');
    assert.equal(current.x, previousX); assert.equal(status.phase, 'cooldown');
    assert(Math.abs(status.cooldownRemaining - 6.9) < 1e-10);
    assert.deepEqual(updateShadowRecall(status, 3, current), [], 'Lost targets must never rewind later.');
  }
  const hitState = createShadowRecall(), hitEnemy = enemy();
  assert.equal(interruptShadowRecall(hitState), null);
  markShadow(hitState, event, hitEnemy); updateShadowRecall(hitState, 0.1, hitEnemy);
  assert.equal(interruptShadowRecall(hitState, 'caster-hit').reason, 'caster-hit');
  assert.equal(hitState.anchor, null); assert.equal(hitState.cooldownRemaining, 6.9);
  assert.deepEqual(updateShadowRecall(hitState, 2, hitEnemy), []);
  for (const invalid of [{ ...enemy(), alive: false }, { ...enemy(), id: null }, { ...enemy(), x: 500 }]) {
    assert.equal(markShadow(createShadowRecall(), event, invalid), false);
  }
  const coarseState = createShadowRecall(), coarseEnemy = enemy();
  markShadow(coarseState, event, coarseEnemy); coarseEnemy.x = 345;
  assert.deepEqual(updateShadowRecall(coarseState, -1, coarseEnemy), []);
  assert.equal(coarseState.remaining, 2);
  assert.deepEqual(updateShadowRecall(coarseState, 8, coarseEnemy).map(item => item.type), ['shadow-recall-start', 'shadow-rewind']);
  assert.equal(coarseState.phase, 'ready'); assert.equal(coarseEnemy.x, 400);
  assert.deepEqual(updateShadowRecall(coarseState, 8, coarseEnemy), []);

  const events = [], animator = new PlantAnimator(plant, {}, { onEvent: current => events.push(current) });
  animator.play('seal'); for (let i = 0; i < 43; i++) animator.update(1 / 60);
  assert.equal(events.length, 0, 'The mark must wait for its release frame.');
  animator.update(1 / 60); assert.equal(events.length, 1); assert.equal(events[0].time, 0.72);
  for (let i = 0; i < 100; i++) animator.update(1 / 60);
  assert.equal(events.length, 1); assert.equal(animator.clip, 'channel');
  animator.play('recall'); for (let i = 0; i < 21; i++) animator.update(1 / 60);
  assert.equal(events.length, 1); animator.update(1 / 60);
  assert.equal(events[1].type, 'animation-cue'); assert.equal(events[1].gameplay, false);
  for (let i = 0; i < 160; i++) animator.update(1 / 60);
  assert.equal(animator.clip, 'idle');
  animator.play('seal'); animator.update(0.1); animator.play('hit');
  for (let i = 0; i < 100; i++) animator.update(1 / 60);
  assert.equal(events.filter(current => current.type === 'shadow-mark').length, 1, 'A hit during windup must prevent release.');
  assert.equal(afterClip(plant, 'seal'), 'channel'); assert.equal(afterClip(plant, 'recall'), 'recover');
  assert.equal(animationEvents(plant, 'recall')[0].time, plant.shadow.recallLeadSeconds);
  assert.equal(CLIPS.seal.frames, 42);
  return 'Timed mark, independent anchor, single rewind, unchanged health/speed, cooldown, interruption, lost target, range, lane, coarse deltas, animation cues and transitions verified';
}

if (process.argv[1]?.endsWith('verify-shadow-mechanic.mjs')) console.log(verifyShadowMechanic());
