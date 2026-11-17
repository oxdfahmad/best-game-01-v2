// Tidekeeper — the HUD.
// Everything the player needs to decide, on one strip: village health,
// wave progress, score and combo, best, shells, the tide gauge, the moon,
// the ability bar with its hotkeys, and the incoming enemy roster. The
// boss gets its own named bar at the top when it is on the reef.

import { PALETTE, WORLD, ABILITIES, ENEMIES, TOTAL_WAVES } from './config.js';
import { tideLabel } from './tide.js';

export function drawHud(ctx, world) {
  drawTopBar(ctx, world);
  drawVillageHealth(ctx, world);
  drawWaveProgress(ctx, world);
  drawScoreBlock(ctx, world);
  drawTideGauge(ctx, world);
  drawAbilityBar(ctx, world);
  drawRoster(ctx, world);
  if (world.boss) drawBossBar(ctx, world);
  if (world.screen === 'build') drawBuildClock(ctx, world);
}

function drawTopBar(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 24, 32, 0.88)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.hudHeight);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, WORLD.hudHeight - 2, WORLD.width, 2);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TIDEKEEPER', 16, 26);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Lanterns of the Drowned Reef', 16, 44);
  ctx.restore();
  void world;
}

function drawVillageHealth(ctx, world) {
  const x = 250;
  const y = 14;
  ctx.save();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VILLAGE', x, y);
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(x, y + 6, 130, 12);
  const frac = world.villageHp / 100;
  ctx.fillStyle = frac > 0.5 ? '#5ac98a' : frac > 0.25 ? '#ffd166' : '#ff5a6e';
  ctx.fillRect(x, y + 6, 130 * frac, 12);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(x, y + 6, 130, 12);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(Math.round(world.villageHp) + '', x + 138, y + 17);
  // Hearts: one per 20 health.
  for (let i = 0; i < 5; i++) {
    const hx = x + 176 + i * 20;
    ctx.fillStyle = world.villageHp > i * 20 ? PALETTE.heartRed : '#3a4a52';
    drawHeart(ctx, hx, y + 12, 7);
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.8);
  ctx.bezierCurveTo(x - s * 1.2, y, x - s * 0.6, y - s, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.6, y - s, x + s * 1.2, y, x, y + s * 0.8);
  ctx.fill();
}

function drawWaveProgress(ctx, world) {
  const x = 560;
  const y = 14;
  ctx.save();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WAVE ' + world.wave + ' / ' + TOTAL_WAVES, x, y);
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(x, y + 6, 150, 12);
  const frac = world.waveTotal > 0 ? 1 - (world.spawnQueue.length + world.enemies.length) / world.waveTotal : 0;
  ctx.fillStyle = '#5ab8d8';
  ctx.fillRect(x, y + 6, 150 * Math.max(0, Math.min(1, frac)), 12);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(x, y + 6, 150, 12);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(world.enemies.length + ' on reef', x + 158, y + 17);
  ctx.restore();
}

function drawScoreBlock(ctx, world) {
  const x = 800;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('SCORE', x, 14);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(String(world.score), x, 38);
  const combo = world.combo > 1 ? 'COMBO x' + (1 + Math.min(world.combo, 20) * 0.1).toFixed(1) : '';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(combo, x, 54);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('BEST ' + Math.max(world.best, world.score), x + 130, 26);
  ctx.fillStyle = PALETTE.shellGold;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('◉ ' + world.shells + ' shells', x + 130, 48);
  ctx.restore();
}

function drawTideGauge(ctx, world) {
  const x = 1040;
  const y = 14;
  ctx.save();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(tideLabel(world.tide) + ' · ' + world.tide.moon.name.toUpperCase(), x, y);
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(x, y + 6, 120, 12);
  ctx.fillStyle = '#2fa8a0';
  ctx.fillRect(x, y + 6, 120 * world.tide.level, 12);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(x, y + 6, 120, 12);
  // Flood and mud marks.
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + 120 * 0.62 - 1, y + 4, 2, 16);
  ctx.fillStyle = '#c98a5a';
  ctx.fillRect(x + 120 * 0.38 - 1, y + 4, 2, 16);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(world.tide.moon.note, x, y + 32);
  ctx.restore();
}

function drawAbilityBar(ctx, world) {
  // Bottom-right, clear of the tide gauge and the shop panel: the reef
  // water down there is empty on every screen.
  const x = WORLD.width - 16 - (3 * 42 - 6);
  const y = WORLD.height - 60;
  const defs = [
    { key: '1', name: 'Flare', cd: world.abilities.flare.cooldownLeft, max: ABILITIES.flare.cooldown },
    { key: '2', name: 'Tide', cd: world.abilities.tidecall.cooldownLeft, max: ABILITIES.tidecall.cooldown },
    { key: '3', name: 'Mend', cd: world.abilities.mend.cooldownLeft, max: ABILITIES.mend.cooldown, uses: world.abilities.mend.uses },
  ];
  ctx.save();
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const bx = x + i * 42;
    const ready = d.cd <= 0;
    ctx.fillStyle = ready ? '#2a5a66' : '#16242c';
    ctx.strokeStyle = ready ? '#ffd166' : PALETTE.panelEdge;
    ctx.lineWidth = ready ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(bx, y, 36, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ready ? PALETTE.textBright : '#5a6a72';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.key, bx + 18, y + 16);
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(d.name, bx + 18, y + 30);
    if (!ready) {
      ctx.fillStyle = '#ff5a6e';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(Math.ceil(d.cd) + 's', bx + 18, y + 46);
    } else if (d.uses !== undefined) {
      ctx.fillStyle = PALETTE.shellGold;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText('x' + d.uses, bx + 18, y + 46);
    }
  }
  ctx.restore();
}

function drawRoster(ctx, world) {
  // Incoming roster: what is left to come, by kind, bottom-left.
  const kinds = Object.keys(world.roster ?? {}).filter((k) => world.roster[k] > 0);
  if (kinds.length === 0) return;
  ctx.save();
  const x = 16;
  let y = WORLD.height - 24 - kinds.length * 22;
  ctx.fillStyle = 'rgba(6, 24, 32, 0.75)';
  ctx.fillRect(x - 6, y - 18, 190, kinds.length * 22 + 24);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('INCOMING', x, y - 4);
  for (const kind of kinds) {
    y += 22;
    const def = ENEMIES[kind];
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x + 8, y - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(def.name + ' x' + world.roster[kind], x + 20, y);
  }
  ctx.restore();
}

function drawBossBar(ctx, world) {
  const boss = world.boss;
  if (!boss) return;
  const w = 420;
  const x = (WORLD.width - w) / 2;
  const y = WORLD.hudHeight + 10;
  ctx.save();
  ctx.fillStyle = 'rgba(6, 24, 32, 0.8)';
  ctx.fillRect(x - 10, y - 18, w + 20, 44);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(boss.name.toUpperCase() + (boss.phase > 1 ? ' · PHASE ' + boss.phase : ''), WORLD.width / 2, y - 4);
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(x, y + 2, w, 12);
  ctx.fillStyle = PALETTE.bossRed;
  ctx.fillRect(x, y + 2, w * Math.max(0, boss.hp / boss.maxHp), 12);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 2, w, 12);
  ctx.restore();
}

function drawBuildClock(ctx, world) {
  ctx.save();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BUILD PHASE — next wave in ' + Math.ceil(world.buildTimer) + 's', WORLD.width / 2, WORLD.hudHeight + 34);
  ctx.restore();
}
