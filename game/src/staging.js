// Tidekeeper — the ?shot= staging hook for screenshots.
// ?shot=boss|title|shop|win with ?seed= puts the game into a deterministic
// seeded scene: the same seed always renders the same frame. main.js runs
// the scene, draws once, and sets window.__shotReady for the screenshot
// tool. Nothing here is reachable from normal play.

import { PLOTS, TOTAL_WAVES } from './config.js';
import { createWorld, updateWorld, finalStats } from './state.js';
import { placeStructure, rebuildLampLinks } from './lamps.js';
import { spawnEnemy, spawnBoss } from './enemies.js';
import { addFloater, spawnBeamHit } from './particles.js';

function fakeInput() {
  return {
    mouseX: 900,
    mouseY: 380,
    mouseDown: true,
    keys: new Set(),
    clickQueue: [],
  };
}

function runTicks(world, input, ticks) {
  for (let i = 0; i < ticks; i++) {
    updateWorld(world, 1 / 60, input);
  }
}

function seedLamps(world, plots) {
  for (const plot of plots) {
    placeStructure(world, 'lamp', plot);
  }
  rebuildLampLinks(world);
}

export function applyShot(world, shot, seed) {
  const input = fakeInput();
  if (shot === 'boss') {
    // Wave 10 mid-fight: the Drowned King at half health, a crowded reef,
    // chained lamps burning, the beam sweeping. The densest frame we make.
    world.screen = 'play';
    world.wave = 10;
    world.waveState = 'staging';
    world.score = 41200;
    world.combo = 12;
    world.kills = 268;
    // Generous build budget so every staged structure actually places
    // (placeStructure charges); the display value is set after.
    world.shells = 1000;
    world.villageHp = 74;
    world.stats.shotsFired = 940;
    world.stats.shotsHit = 712;
    world.stats.wavesCleared = 9;
    world.stats.bossesDown = 1;
    world.stats.lampsBuilt = 9;
    seedLamps(world, [PLOTS[1], PLOTS[2], PLOTS[7], PLOTS[8], PLOTS[13], PLOTS[14], PLOTS[19], PLOTS[20], PLOTS[26]]);
    placeStructure(world, 'wall', PLOTS[10]);
    placeStructure(world, 'gate', PLOTS[9]);
    rebuildLampLinks(world);
    // Shells AFTER the structures: placeStructure charges for each one,
    // so the display value is set once the reef is built.
    world.shells = 180;
    const king = spawnBoss(world, 'king');
    input.mouseX = 880;
    input.mouseY = 400;
    input.mouseDown = true;
    // One second of beam fire so the angle aims at the King and the tide
    // settles — but the small enemies spawn AFTER, so the beam has not
    // thinned the reef (or overheated and locked out) before the frame
    // is taken. The beam is mid-sweep on the King in the shot.
    runTicks(world, input, 60);
    king.hp = king.maxHp * 0.52;
    king.x = 880;
    king.y = 400;
    const kinds = ['crab', 'wisp', 'spitter', 'brute', 'splitter', 'crab', 'wisp', 'crab', 'spitter', 'wisp', 'brute', 'splitter', 'crab', 'wisp'];
    kinds.forEach((kind, i) => {
      const e = spawnEnemy(world, kind, 150 + (i % 8) * 62);
      e.x = 520 + (i % 7) * 95 + (i % 3) * 20;
      e.hp = e.maxHp * (0.5 + (i % 5) * 0.1);
    });
    world.roster = { crab: 6, wisp: 8, spitter: 3, brute: 2, splitter: 2, king: 1 };
    world.waveTotal = 42;
    world.spawnQueue = ['crab', 'wisp', 'wisp', 'spitter', 'brute'];
    world.beam.firing = true;
    world.beam.heat = 30;
    addFloater(world.particles, king.x - 90, king.y - 84, '-174', '#ffd166');
    addFloater(world.particles, king.x + 40, king.y - 100, '-88', '#fff6c9');
    spawnBeamHit(world.particles, king.x - 30, king.y - 20);
    world.screen = 'play';
    world.waveState = 'staging';
    return world;
  }
  if (shot === 'title') {
    world.screen = 'title';
    world.best = 48200;
    world.score = 0;
    world.shells = 500;
    seedLamps(world, [PLOTS[1], PLOTS[7], PLOTS[13], PLOTS[19]]);
    const demo = ['wisp', 'crab', 'wisp', 'spitter', 'crab'];
    demo.forEach((kind, i) => {
      const e = spawnEnemy(world, kind, 200 + i * 90);
      e.x = 700 + i * 110;
    });
    runTicks(world, input, 90);
    world.screen = 'title';
    return world;
  }
  if (shot === 'shop') {
    // Build phase before wave 6: a reef already lit, shells to spend.
    world.screen = 'build';
    world.wave = 5;
    world.waveState = 'clear';
    world.score = 18400;
    world.kills = 132;
    // Generous build budget so every staged structure actually places.
    world.shells = 1000;
    world.villageHp = 86;
    world.stats.wavesCleared = 5;
    world.stats.bossesDown = 1;
    world.stats.lampsBuilt = 7;
    world.buildTimer = 18;
    world.selectedBuild = 'lamp';
    seedLamps(world, [PLOTS[1], PLOTS[2], PLOTS[7], PLOTS[13], PLOTS[14], PLOTS[19], PLOTS[20]]);
    placeStructure(world, 'wall', PLOTS[10]);
    rebuildLampLinks(world);
    // Shells AFTER the structures: placeStructure charges for each one.
    world.shells = 240;
    runTicks(world, input, 30);
    world.screen = 'build';
    return world;
  }
  if (shot === 'win') {
    world.screen = 'win';
    world.wave = TOTAL_WAVES;
    world.score = 48200;
    world.kills = 312;
    world.villageHp = 68;
    world.stats = { shotsFired: 1240, shotsHit: 942, wavesCleared: 10, bossesDown: 2, lampsBuilt: 14 };
    world.result = finalStats(world);
    world.best = 48200;
    world.shells = 500;
    seedLamps(world, [PLOTS[1], PLOTS[2], PLOTS[7], PLOTS[13], PLOTS[14], PLOTS[19], PLOTS[20]]);
    rebuildLampLinks(world);
    runTicks(world, input, 30);
    world.screen = 'win';
    return world;
  }
  return world;
}

export function createShotWorld(seed) {
  return createWorld(seed);
}
