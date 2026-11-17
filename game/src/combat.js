// Tidekeeper — damage, kills, score, combos and shells.
// One place owns every number that changes when something gets hurt, so
// the beam, the lamps, the chains and the flare all pay out the same way.

import { spawnBurst, addFloater } from './particles.js';
import { playPop, playCoin, playHurt } from './sound.js';
import { spawnEnemy } from './enemies.js';

export function damageEnemy(world, enemy, amount, opts = {}) {
  if (enemy.hp <= 0) return;
  enemy.hp -= amount;
  enemy.flash = 0.09;
  if (!opts.silent && amount >= 1) {
    addFloater(world.particles, enemy.x, enemy.y - enemy.radius - 6, String(Math.round(amount)), '#ffe9a8');
  }
  if (enemy.hp <= 0) {
    killEnemy(world, enemy, opts.source);
  }
}

export function killEnemy(world, enemy, source) {
  world.enemies = world.enemies.filter((e) => e !== enemy);
  if (world.boss === enemy) {
    world.boss = null;
    world.stats.bossesDown += 1;
  }
  // Splitters burst into two wisps where they fall.
  if (enemy.kind === 'splitter' && !enemy.splitDone) {
    enemy.splitDone = true;
    for (let i = 0; i < 2; i++) {
      const child = spawnEnemy(world, 'wisp', enemy.y + (i === 0 ? -24 : 24));
      child.x = enemy.x + (i === 0 ? -14 : 14);
      child.hp = 8;
      child.maxHp = 8;
    }
  }
  const comboMult = 1 + Math.min(world.combo, 20) * 0.1;
  const gained = Math.round(enemy.score * comboMult);
  world.score += gained;
  world.kills += 1;
  world.combo += 1;
  world.comboTimer = 4;
  const bonusShell = world.tide.moon.shellBonus > 0 && world.rng.chance(0.25) ? 1 : 0;
  world.shells += enemy.shells + bonusShell;
  spawnBurst(world.particles, enemy.x, enemy.y, enemy.color, enemy.kind === 'king' ? 40 : 12, 200);
  addFloater(world.particles, enemy.x, enemy.y - enemy.radius - 18, '+' + gained, '#ffd166');
  if (world.rng.chance(0.5)) playPop(world.sound);
  if (enemy.shells > 0 && world.rng.chance(0.4)) playCoin(world.sound);
  void source;
}

export function damageVillage(world, amount) {
  world.villageHp = Math.max(0, world.villageHp - amount);
  world.combo = 0;
  world.comboTimer = 0;
  playHurt(world.sound);
}

export function healVillage(world, amount) {
  world.villageHp = Math.min(100, world.villageHp + amount);
}

export function addScore(world, amount) {
  world.score += amount;
}
