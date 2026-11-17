// Tidekeeper — draw orchestration.
// One frame, in order: reef, structures, enemies, beam, shots, particles,
// radar, HUD, hints, then whichever screen is up. The HUD and the radar
// draw on every play frame so the screenshots always show the whole game.

import { drawBackground } from './background.js';
import { drawStructures } from './lamps.js';
import { drawEnemy } from './enemies.js';
import { drawBeam } from './beam.js';
import { drawParticles } from './particles.js';
import { drawHud } from './hud.js';
import { drawMinimap } from './minimap.js';
import { drawHints } from './tutorial.js';
import { drawTitle, drawBuild, drawWin, drawLose, drawPause } from './screens.js';

export function drawGame(ctx, world, input) {
  drawBackground(ctx, world, world.time);
  drawStructures(ctx, world);
  for (const enemy of world.enemies) {
    drawEnemy(ctx, enemy, world.time);
  }
  drawEnemyShots(ctx, world);
  drawBeam(ctx, world);
  drawParticles(ctx, world.particles);
  if (world.screen === 'play' || world.screen === 'pause') {
    drawMinimap(ctx, world);
    drawHud(ctx, world);
  } else if (world.screen === 'build') {
    // No radar on the build screen: the shop panel covers that corner.
    drawHud(ctx, world);
  }
  if (world.screen === 'play') {
    drawHints(ctx, world);
  }
  if (world.screen === 'title') {
    drawTitle(ctx, world, input);
  } else if (world.screen === 'build') {
    drawBuild(ctx, world, input);
  } else if (world.screen === 'win') {
    drawWin(ctx, world, input);
  } else if (world.screen === 'lose') {
    drawLose(ctx, world, input);
  } else if (world.screen === 'pause') {
    drawPause(ctx, world, input);
  }
}

function drawEnemyShots(ctx, world) {
  ctx.save();
  for (const shot of world.enemyShots) {
    ctx.fillStyle = '#b07bd8';
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c8ff';
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
