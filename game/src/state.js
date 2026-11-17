// Tidekeeper — game state and the update loop.
// Owns the world object, wires every module's callbacks onto it, runs the
// fixed-step update for each screen, and keeps the best score. Nothing in
// here draws; rendering lives in render.js and screens.js.

import { makeRng } from './rng.js';
import { TOTAL_WAVES, VILLAGE_MAX_HP, ABILITIES } from './config.js';
import { createTide, updateTide, forceLowTide } from './tide.js';
import { createBeam, updateBeam, castFlareBurst } from './beam.js';
import { updateEnemies } from './enemies.js';
import { updateLampPower, updateLampFire } from './lamps.js';
import { updateWaves } from './waves.js';
import { startBuildPhase, updateBuildPhase } from './shop.js';
import { damageEnemy } from './combat.js';
import { createParticleLayer, updateParticles, spawnBurst, addFloater, spawnSplash } from './particles.js';
import { createSound, playHurt, playRoar, playCoin, toggleMute } from './sound.js';
import { createMusic, startMusic, updateMusic } from './music.js';
import { distanceToSegment } from './lamps.js';

const BEST_KEY = 'tidekeeper-best-v1';

export function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    /* storage is best-effort */
  }
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const sound = createSound();
  const world = {
    seed,
    rng,
    time: 0,
    screen: 'title',
    prevScreen: 'title',
    wave: 0,
    waveState: 'idle',
    score: 0,
    combo: 0,
    comboTimer: 0,
    best: loadBest(),
    shells: 60,
    kills: 0,
    villageHp: VILLAGE_MAX_HP,
    tide: createTide(),
    beam: createBeam(),
    abilities: {
      flare: { cooldownLeft: 0 },
      tidecall: { cooldownLeft: 0 },
      mend: { cooldownLeft: 0, uses: 1 },
    },
    upgrades: {},
    structures: [],
    enemies: [],
    enemyShots: [],
    particles: createParticleLayer(),
    boss: null,
    spawnQueue: [],
    roster: {},
    waveTotal: 0,
    waveSpawned: 0,
    bossSpawned: false,
    buildTimer: 0,
    selectedBuild: null,
    shopMessage: '',
    stats: { shotsFired: 0, shotsHit: 0, wavesCleared: 0, bossesDown: 0, lampsBuilt: 0 },
    sound,
    music: createMusic(sound),
    prevKeys: new Set(),
    result: null,
  };
  // Callbacks the simulation modules invoke.
  world.damageEnemy = (w, enemy, amount, opts) => damageEnemy(w, enemy, amount, opts);
  world.onVillageHit = (enemy) => {
    playHurt(world.sound);
    spawnSplash(world.particles, 150, enemy.y, 10);
    addFloater(world.particles, 150, enemy.y - 30, '-' + enemy.damage + ' VILLAGE', '#ff5a6e');
  };
  world.onBossSummon = (boss) => {
    addFloater(world.particles, boss.x, boss.y - boss.radius - 24, 'The deep answers!', '#c9a0ff');
  };
  world.onBossPhase = (boss, phase) => {
    addFloater(world.particles, boss.x, boss.y - boss.radius - 24, 'PHASE ' + phase + ' — the King rages!', '#ffd166');
    playRoar(world.sound);
  };
  world.onWin = () => {
    world.result = finalStats(world);
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.score);
    }
  };
  world.onWaveClear = () => {
    const bonus = 15 + world.wave * 2;
    world.shells += bonus;
    addFloater(world.particles, 640, 200, 'WAVE CLEAR  +' + bonus + ' shells', '#ffd166');
    playCoin(world.sound);
    startBuildPhase(world);
  };
  return world;
}

export function finalStats(world) {
  const acc = world.stats.shotsFired > 0
    ? Math.round((100 * world.stats.shotsHit) / world.stats.shotsFired)
    : 0;
  return {
    score: world.score,
    best: Math.max(world.best, world.score),
    waves: world.stats.wavesCleared,
    kills: world.kills,
    accuracy: acc,
    bosses: world.stats.bossesDown,
    lamps: world.stats.lampsBuilt,
  };
}

export function startNewGame(world) {
  const fresh = createWorld((Date.now() % 100000) + 1);
  Object.keys(world).forEach((k) => delete world[k]);
  Object.assign(world, fresh);
  world.screen = 'build';
  world.buildTimer = 25;
  world.selectedBuild = 'lamp';
  startMusic(world.music);
}

function justPressed(world, input, code) {
  return input.keys.has(code) && !world.prevKeys.has(code);
}

export function updateWorld(world, dt, input) {
  world.time += dt;
  updateMusic(world.music, dt, world.tide.level, world.screen);

  // Edge-detect the keys once, before prevKeys is refreshed.
  const pressedM = justPressed(world, input, 'KeyM');
  const pressedPause = justPressed(world, input, 'KeyP') || justPressed(world, input, 'Escape');
  const pressedR = justPressed(world, input, 'KeyR');
  const pressed1 = justPressed(world, input, 'Digit1') || justPressed(world, input, 'Numpad1');
  const pressed2 = justPressed(world, input, 'Digit2') || justPressed(world, input, 'Numpad2');
  const pressed3 = justPressed(world, input, 'Digit3') || justPressed(world, input, 'Numpad3');
  world.prevKeys = new Set(input.keys);

  if (pressedM) {
    toggleMute(world.sound);
  }
  if (pressedPause) {
    if (world.screen === 'play' || world.screen === 'build') {
      world.prevScreen = world.screen;
      world.screen = 'pause';
    } else if (world.screen === 'pause') {
      world.screen = world.prevScreen;
    }
  }
  if (pressedR) {
    if (world.screen === 'win' || world.screen === 'lose' || world.screen === 'title') {
      startNewGame(world);
    }
  }

  if (world.screen === 'title') {
    updateParticles(world.particles, dt);
    return;
  }
  if (world.screen === 'pause' || world.screen === 'win' || world.screen === 'lose') {
    updateParticles(world.particles, dt);
    return;
  }

  if (world.screen === 'build') {
    updateTide(world.tide, dt, Math.max(1, world.wave), world.time);
    updateBuildPhase(world, dt, input);
    updateParticles(world.particles, dt);
    updateLampPower(world);
    return;
  }

  // Screen 'play'.
  updateTide(world.tide, dt, world.wave, world.time);
  updateBeam(world, dt, input);
  updateLampPower(world);
  updateLampFire(world, dt, world.damageEnemy);
  updateEnemies(world, dt);
  updateEnemyShots(world, dt);
  updateWaves(world, dt);
  updateParticles(world.particles, dt);

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  for (const key of ['flare', 'tidecall', 'mend']) {
    const a = world.abilities[key];
    if (a.cooldownLeft > 0) a.cooldownLeft -= dt;
  }

  if (pressed1) {
    castFlareBurst(world, input);
  }
  if (pressed2) {
    const ability = world.abilities.tidecall;
    if (ability.cooldownLeft <= 0) {
      ability.cooldownLeft = ABILITIES.tidecall.cooldown;
      forceLowTide(world.tide, world.time, ABILITIES.tidecall.lowTideSeconds);
      addFloater(world.particles, 640, 160, 'TIDE CALL — low tide for 8s', '#7fd8d0');
    }
  }
  if (pressed3) {
    const ability = world.abilities.mend;
    if (ability.cooldownLeft <= 0 && ability.uses > 0 && world.villageHp < VILLAGE_MAX_HP) {
      ability.cooldownLeft = ABILITIES.mend.cooldown;
      ability.uses -= 1;
      world.villageHp = Math.min(VILLAGE_MAX_HP, world.villageHp + ABILITIES.mend.heal);
      addFloater(world.particles, 150, 300, '+' + ABILITIES.mend.heal + ' VILLAGE', '#5ac98a');
    }
  }

  if (world.villageHp <= 0 && world.screen === 'play') {
    world.screen = 'lose';
    world.result = finalStats(world);
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.score);
    }
  }
}

function updateEnemyShots(world, dt) {
  const beam = world.beam;
  for (const shot of world.enemyShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    // The beam burns shadow orbs out of the sky.
    if (beam.firing) {
      const ox = 196;
      const oy = 392 - 62;
      const ex = ox + Math.cos(beam.angle) * 1160;
      const ey = oy + Math.sin(beam.angle) * 1160;
      if (distanceToSegment(shot.x, shot.y, ox, oy, ex, ey) < 12) {
        spawnBurst(world.particles, shot.x, shot.y, '#8a7bd8', 4, 90);
        world.enemyShots = world.enemyShots.filter((s) => s !== shot);
        continue;
      }
    }
    if (shot.x <= 132) {
      world.villageHp = Math.max(0, world.villageHp - shot.damage);
      world.combo = 0;
      playHurt(world.sound);
      world.enemyShots = world.enemyShots.filter((s) => s !== shot);
    }
  }
  world.enemyShots = world.enemyShots.filter((s) => s.x > -20 && s.x < 1320 && s.y > 0 && s.y < 740);
}
