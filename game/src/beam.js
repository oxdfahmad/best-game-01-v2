// Tidekeeper — the lighthouse beam and the Flare Burst ability.
// The beam is the player's hand: aim with the mouse, hold to fire. It
// burns whatever it crosses, builds heat while it fires, and locks out when
// it overheats. Flare Burst is the panic button: a ring of light that
// scorches everything near the aim point.

import { BEAM, ABILITIES, WORLD } from './config.js';
import { distanceToSegment } from './lamps.js';
import { spawnBeamHit, spawnBurst } from './particles.js';
import { playZap } from './sound.js';

export function createBeam() {
  return {
    angle: -Math.PI / 2,
    heat: 0,
    firing: false,
    locked: false,
    damageLevel: 0,
    coolLevel: 0,
    flareLevel: 0,
  };
}

export function beamDamage(beam) {
  return BEAM.dps * (1 + 0.25 * beam.damageLevel);
}

export function beamHeatRate(beam) {
  return BEAM.heatPerSecond * (1 - 0.2 * beam.coolLevel);
}

export function updateBeam(world, dt, input) {
  const beam = world.beam;
  const ox = WORLD.lighthouseX;
  const oy = WORLD.lighthouseY - 62;
  beam.angle = Math.atan2(input.mouseY - oy, input.mouseX - ox);
  const wantFire = input.mouseDown && world.screen === 'play';
  if (beam.locked) {
    beam.firing = false;
    beam.heat -= BEAM.coolPerSecond * dt;
    if (beam.heat <= BEAM.overheatLock) beam.locked = false;
  } else if (wantFire) {
    beam.firing = true;
    beam.heat += beamHeatRate(beam) * dt;
    if (beam.heat >= 100) {
      beam.heat = 100;
      beam.locked = true;
      beam.firing = false;
    }
  } else {
    beam.firing = false;
    beam.heat = Math.max(0, beam.heat - BEAM.coolPerSecond * dt);
  }
  if (beam.firing) {
    fireBeam(world, dt, ox, oy);
  }
}

function fireBeam(world, dt, ox, oy) {
  const beam = world.beam;
  const ex = ox + Math.cos(beam.angle) * BEAM.range;
  const ey = oy + Math.sin(beam.angle) * BEAM.range;
  const dps = beamDamage(beam);
  let hitAny = false;
  for (const enemy of world.enemies) {
    const d = distanceToSegment(enemy.x, enemy.y, ox, oy, ex, ey);
    if (d < enemy.radius + BEAM.width / 2) {
      hitAny = true;
      world.damageEnemy(world, enemy, dps * dt, { silent: true, source: 'beam' });
      if (world.rng.chance(dt * 6)) {
        spawnBeamHit(world.particles, enemy.x, enemy.y);
      }
    }
  }
  if (hitAny) {
    world.stats.shotsHit += 1;
    if (world.rng.chance(dt * 20)) playZap(world.sound);
  }
  world.stats.shotsFired += 1;
}

export function flareDamage(world) {
  return ABILITIES.flare.damage * (1 + 0.4 * world.beam.flareLevel);
}

export function castFlareBurst(world, input) {
  const ability = world.abilities.flare;
  if (ability.cooldownLeft > 0) return false;
  ability.cooldownLeft = ABILITIES.flare.cooldown;
  const cx = input.mouseX;
  const cy = input.mouseY;
  const radius = ABILITIES.flare.radius;
  const dmg = flareDamage(world);
  for (const enemy of [...world.enemies]) {
    if (Math.hypot(enemy.x - cx, enemy.y - cy) < radius + enemy.radius) {
      world.damageEnemy(world, enemy, dmg, { source: 'flare' });
    }
  }
  spawnBurst(world.particles, cx, cy, '#ffe9a8', 26, 260);
  spawnBurst(world.particles, cx, cy, '#ffb347', 18, 180);
  return true;
}

export function drawBeam(ctx, world) {
  const beam = world.beam;
  if (!beam.firing && beam.heat <= 0) return;
  const ox = WORLD.lighthouseX;
  const oy = WORLD.lighthouseY - 62;
  const len = BEAM.range;
  const ex = ox + Math.cos(beam.angle) * len;
  const ey = oy + Math.sin(beam.angle) * len;
  ctx.save();
  if (beam.firing) {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = BEAM.width + 14;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#fff6c9';
    ctx.lineWidth = BEAM.width;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
