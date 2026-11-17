// Tidekeeper — enemy kinds, spawning, movement and the two named bosses.
// Every kind is a different silhouette with its own speed, health and
// behaviour, so the roster reads at a glance. The Hollow Captain leads
// wave 5; the Drowned King ends wave 10 in three phases.

import { ENEMIES, WORLD, CHANNELS } from './config.js';
import { tideSpeedFactor } from './tide.js';
import { channelIndexAt, rebuildLampLinks } from './lamps.js';

let enemyId = 1;

export function spawnEnemy(world, kind, laneY) {
  const def = ENEMIES[kind];
  const y = laneY ?? WORLD.reefTop + world.rng.range(30, WORLD.reefBottom - WORLD.reefTop - 30);
  const enemy = {
    id: enemyId++,
    kind,
    name: def.name,
    x: WORLD.width + 30 + world.rng.range(0, 90),
    y,
    hp: def.hp * (1 + (world.wave - 1) * 0.08),
    maxHp: def.hp * (1 + (world.wave - 1) * 0.08),
    speed: def.speed * world.tide.moon.enemySpeed,
    damage: def.damage,
    shells: def.shells,
    score: def.score,
    radius: def.radius,
    color: def.color,
    dark: def.dark,
    wobble: world.rng.range(0, Math.PI * 2),
    zigzag: world.rng.range(0.5, 1.2),
    shootTimer: world.rng.range(2, 4),
    splitDone: false,
    summonTimer: 8,
    phase: 1,
    flash: 0,
    slowUntil: 0,
  };
  world.enemies.push(enemy);
  return enemy;
}

export function spawnBoss(world, kind) {
  const boss = spawnEnemy(world, kind, WORLD.height / 2);
  boss.x = WORLD.width + 60;
  boss.summonTimer = 6;
  world.boss = boss;
  return boss;
}

export function updateEnemies(world, dt) {
  for (const enemy of world.enemies) {
    if (enemy.flash > 0) enemy.flash -= dt;
    const channel = channelIndexAt(enemy.y);
    let speed = enemy.speed * tideSpeedFactor(world.tide, channel >= 0);
    if (world.time < enemy.slowUntil) speed *= 0.5;
    // Movement by kind: wisps zig-zag, brutes plough straight, the rest
    // wobble toward the village.
    let vy = 0;
    if (enemy.kind === 'wisp') {
      vy = Math.sin(world.time * 2.2 * enemy.zigzag + enemy.wobble) * 46;
    } else if (enemy.kind === 'crab') {
      vy = Math.sin(world.time * 1.4 + enemy.wobble) * 18;
    } else if (enemy.kind === 'spitter') {
      vy = Math.sin(world.time * 0.9 + enemy.wobble) * 12;
    }
    enemy.x -= speed * dt;
    enemy.y += vy * dt;
    if (enemy.y < WORLD.reefTop + enemy.radius) enemy.y = WORLD.reefTop + enemy.radius;
    if (enemy.y > WORLD.reefBottom - enemy.radius) enemy.y = WORLD.reefBottom - enemy.radius;

    // Spitters stop at range and shoot shadow orbs at the village.
    if (enemy.kind === 'spitter') {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0 && enemy.x < WORLD.width - 260) {
        enemy.shootTimer = 3.2;
        const dx = WORLD.villageX - enemy.x;
        const dy = WORLD.lighthouseY - enemy.y;
        const len = Math.hypot(dx, dy) || 1;
        world.enemyShots.push({
          x: enemy.x, y: enemy.y,
          vx: (dx / len) * 150, vy: (dy / len) * 150,
          radius: 7, damage: 5,
        });
      }
    }

    // Bosses summon wisps and shift phases as their health falls.
    if (enemy.kind === 'captain' || enemy.kind === 'king') {
      updateBoss(world, enemy, dt);
    }

    // Blocked by a wall or gate: stop and chew through it.
    const blocker = blockingStructure(world, enemy);
    if (blocker) {
      enemy.x += speed * dt;
      blocker.hp -= (enemy.kind === 'brute' ? 26 : 14) * dt;
      if (blocker.hp <= 0) {
        world.structures = world.structures.filter((s) => s !== blocker);
        rebuildLampLinks(world);
      }
    }

    // Reached the village: deal damage and vanish into the dark.
    if (enemy.x <= WORLD.villageX + enemy.radius) {
      world.villageHp = Math.max(0, world.villageHp - enemy.damage);
      world.combo = 0;
      world.comboTimer = 0;
      world.onVillageHit(enemy);
      world.enemies = world.enemies.filter((e) => e !== enemy);
      if (world.boss === enemy) world.boss = null;
    }
  }
}

function blockingStructure(world, enemy) {
  for (const s of world.structures) {
    if (s.kind === 'lamp') continue;
    const dx = enemy.x - s.x;
    const dy = enemy.y - s.y;
    if (dx > 0 && dx < enemy.radius + 18 && Math.abs(dy) < enemy.radius + 18) {
      return s;
    }
  }
  return null;
}

function updateBoss(world, boss, dt) {
  boss.summonTimer -= dt;
  if (boss.summonTimer <= 0) {
    boss.summonTimer = boss.kind === 'king' ? 7 : 10;
    const n = boss.kind === 'king' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnEnemy(world, 'wisp', boss.y + (i - 1) * 44);
    }
    world.onBossSummon(boss);
  }
  const frac = boss.hp / boss.maxHp;
  if (boss.kind === 'king') {
    if (frac < 0.66 && boss.phase === 1) {
      boss.phase = 2;
      boss.speed *= 1.5;
      world.onBossPhase(boss, 2);
    } else if (frac < 0.33 && boss.phase === 2) {
      boss.phase = 3;
      boss.speed *= 1.4;
      world.onBossPhase(boss, 3);
    }
  }
}

// --- Drawing: one distinct silhouette per kind --------------------------

export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (enemy.flash > 0) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 40);
  }
  if (enemy.kind === 'crab') drawCrab(ctx, enemy, time);
  else if (enemy.kind === 'wisp') drawWisp(ctx, enemy, time);
  else if (enemy.kind === 'spitter') drawSpitter(ctx, enemy, time);
  else if (enemy.kind === 'brute') drawBrute(ctx, enemy, time);
  else if (enemy.kind === 'splitter') drawSplitter(ctx, enemy, time);
  else if (enemy.kind === 'captain') drawCaptain(ctx, enemy, time);
  else if (enemy.kind === 'king') drawKing(ctx, enemy, time);
  ctx.restore();
  if (enemy.maxHp > 120) {
    drawMiniHpBar(ctx, enemy);
  }
}

function drawMiniHpBar(ctx, enemy) {
  const w = enemy.radius * 2;
  ctx.fillStyle = 'rgba(6, 20, 26, 0.8)';
  ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w, 5);
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w * Math.max(0, enemy.hp / enemy.maxHp), 5);
}

function eyes(ctx, dx, dy, gap, r) {
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.arc(-gap, dy, r, 0, Math.PI * 2);
  ctx.arc(gap, dy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrab(ctx, e, time) {
  const scuttle = Math.sin(time * 10 + e.wobble) * 2;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.radius, e.radius * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.arc(-e.radius - 3, -6 + scuttle, 6, 0, Math.PI * 2);
  ctx.arc(-e.radius - 3, 6 - scuttle, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = e.dark;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 6);
    ctx.lineTo(e.radius + 8, i * 9 + scuttle);
    ctx.stroke();
  }
  eyes(ctx, 0, -3, 6, 2.4);
}

function drawWisp(ctx, e, time) {
  const flicker = 1 + Math.sin(time * 9 + e.wobble) * 0.12;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.moveTo(0, -e.radius * 1.3 * flicker);
  ctx.quadraticCurveTo(e.radius, 0, 0, e.radius);
  ctx.quadraticCurveTo(-e.radius, 0, 0, -e.radius * 1.3 * flicker);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, -4, 4.5, 2);
}

function drawSpitter(ctx, e, time) {
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.dark;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + time * 0.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * e.radius * 0.9, Math.sin(a) * e.radius * 0.9, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#1a2a1a';
  ctx.beginPath();
  ctx.arc(-e.radius * 0.4, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, -4, 5, 2.2);
}

function drawBrute(ctx, e) {
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = e.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-e.radius * 0.7, -e.radius * 0.4);
  ctx.lineTo(e.radius * 0.7, -e.radius * 0.4);
  ctx.moveTo(-e.radius * 0.7, e.radius * 0.4);
  ctx.lineTo(e.radius * 0.7, e.radius * 0.4);
  ctx.stroke();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(-e.radius - 4, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, -e.radius * 0.45, 7, 2.6);
}

function drawSplitter(ctx, e, time) {
  const wob = 1 + Math.sin(time * 6 + e.wobble) * 0.08;
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.radius * wob, e.radius / wob, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.arc(-4, -4, 4, 0, Math.PI * 2);
  ctx.arc(6, 5, 3, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, 0, -2, 6, 2.4);
}

function drawCaptain(ctx, e, time) {
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.moveTo(0, -e.radius * 1.5);
  ctx.lineTo(e.radius * 0.8, e.radius * 0.9);
  ctx.lineTo(-e.radius * 0.8, e.radius * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(0, -e.radius * 0.5, e.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(-e.radius * 0.9, -e.radius * 1.15, e.radius * 1.8, 8);
  ctx.fillRect(-e.radius * 0.5, -e.radius * 1.7, e.radius, 12);
  const sway = Math.sin(time * 2) * 4;
  ctx.strokeStyle = '#8a7bd8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.radius * 0.7, e.radius * 0.4);
  ctx.lineTo(e.radius * 1.2, e.radius * 0.9 + sway);
  ctx.stroke();
  eyes(ctx, 0, -e.radius * 0.55, 8, 3);
}

function drawKing(ctx, e, time) {
  const pulse = 1 + Math.sin(time * 3) * 0.04;
  ctx.save();
  ctx.scale(pulse, pulse);
  ctx.fillStyle = e.dark;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12 - 6, -e.radius * 0.85);
    ctx.lineTo(i * 12, -e.radius * 1.25);
    ctx.lineTo(i * 12 + 6, -e.radius * 0.85);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.arc(0, -e.radius * 0.95, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, e.radius * 0.25, e.radius * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  eyes(ctx, 0, -e.radius * 0.3, 12, 4);
  ctx.restore();
}
