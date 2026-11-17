// Tidekeeper — the wave director.
// Builds each wave's roster from the plan, trickles enemies in on a timer,
// calls the boss at the right moment, and knows when a wave is won: every
// spawned enemy dead and the boss down. Wave 10's king ends the game.

import { wavePlan, TOTAL_WAVES } from './config.js';
import { spawnEnemy, spawnBoss } from './enemies.js';
import { playHorn, playRoar } from './sound.js';

export function startWave(world, wave) {
  const plan = wavePlan(wave);
  world.wave = wave;
  world.waveState = 'fighting';
  world.spawnQueue = buildSpawnQueue(world, plan);
  world.spawnTimer = 1.2;
  world.waveTotal = world.spawnQueue.length + (plan.boss ? 1 : 0);
  world.waveSpawned = 0;
  world.bossSpawned = false;
  world.roster = rosterCounts(world.spawnQueue, plan.boss);
  playHorn(world.sound);
}

function buildSpawnQueue(world, plan) {
  const queue = [];
  const kinds = Object.keys(plan.mix);
  const total = plan.count;
  for (let i = 0; i < total; i++) {
    let pick = kinds[0];
    let roll = world.rng.next();
    let acc = 0;
    const sum = kinds.reduce((s, k) => s + plan.mix[k], 0);
    for (const kind of kinds) {
      acc += plan.mix[k] / sum;
      if (roll <= acc) {
        pick = kind;
        break;
      }
    }
    queue.push(pick);
  }
  return queue;
}

function rosterCounts(queue, boss) {
  const counts = {};
  for (const kind of queue) counts[kind] = (counts[kind] ?? 0) + 1;
  if (boss) counts[boss] = (counts[boss] ?? 0) + 1;
  return counts;
}

export function updateWaves(world, dt) {
  if (world.waveState !== 'fighting') return;
  // Trickle the queue in, faster as the wave goes on.
  if (world.spawnQueue.length > 0) {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      const batch = world.waveSpawned < 4 ? 1 : 2;
      for (let i = 0; i < batch && world.spawnQueue.length > 0; i++) {
        const kind = world.spawnQueue.shift();
        const lane = pickLane(world);
        spawnEnemy(world, kind, lane);
        world.waveSpawned += 1;
        if (world.roster[kind] > 0) world.roster[kind] -= 1;
      }
      world.spawnTimer = Math.max(0.5, 1.6 - world.wave * 0.08);
    }
  }
  // The boss walks in once the queue is half out.
  const plan = wavePlan(world.wave);
  if (plan.boss && !world.bossSpawned && world.waveSpawned >= Math.floor(world.waveTotal / 2)) {
    world.bossSpawned = true;
    spawnBoss(world, plan.boss);
    if (world.roster[plan.boss] > 0) world.roster[plan.boss] -= 1;
    playRoar(world.sound);
  }
  // Wave won: queue empty, nothing alive, boss down.
  if (world.spawnQueue.length === 0 && world.enemies.length === 0 && !world.boss) {
    world.waveState = 'clear';
    world.stats.wavesCleared += 1;
    if (world.wave >= TOTAL_WAVES) {
      world.screen = 'win';
      world.onWin();
    } else {
      world.screen = 'build';
      world.buildTimer = 25;
      world.onWaveClear();
    }
  }
}

function pickLane(world) {
  const lanes = [150, 205, 260, 340, 410, 470, 540, 610, 660];
  return lanes[world.rng.int(0, lanes.length - 1)];
}

export function enemiesRemaining(world) {
  return world.spawnQueue.length + world.enemies.length;
}

export function waveProgress(world) {
  if (world.waveTotal === 0) return 0;
  const dead = world.waveTotal - enemiesRemaining(world);
  return Math.max(0, Math.min(1, dead / world.waveTotal));
}
