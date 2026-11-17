// Tidekeeper — the reef at dusk.
// Layers of sky, moon, distant ships, the village, the reef rocks and the
// channels, with the water level in the channels rising and falling with
// the tide. Everything is drawn in code; no image files ship with the game.

import { PALETTE, WORLD, CHANNELS } from './config.js';
import { channelFlood } from './tide.js';

export function drawBackground(ctx, world, time) {
  drawSky(ctx, world, time);
  drawMoon(ctx, world, time);
  drawDistantShips(ctx, time);
  drawSea(ctx, world, time);
  drawReef(ctx, world, time);
  drawVillage(ctx, world, time);
  drawLighthouse(ctx, world, time);
}

function drawSky(ctx, world, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.45, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  // Stars, dimmed by the moon.
  ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - world.tide.moon.dark * 0.4})`;
  for (let i = 0; i < 60; i++) {
    const sx = (i * 211) % WORLD.width;
    const sy = (i * 97) % 180;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.7 + i));
    ctx.globalAlpha = tw * 0.7;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx, world, time) {
  const mx = 1120;
  const my = 92;
  const glow = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
  glow.addColorStop(0, 'rgba(255, 240, 200, 0.5)');
  glow.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - 120, my - 120, 240, 240);
  ctx.fillStyle = '#f5ead0';
  ctx.beginPath();
  ctx.arc(mx, my, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8c8a8';
  ctx.beginPath();
  ctx.arc(mx - 10, my - 6, 7, 0, Math.PI * 2);
  ctx.arc(mx + 12, my + 10, 5, 0, Math.PI * 2);
  ctx.arc(mx + 4, my - 14, 4, 0, Math.PI * 2);
  ctx.fill();
  // Moon phase shadow: the dark bite grows with the moon index.
  const bite = world.tide.moon.dark;
  if (bite > 0.02) {
    ctx.fillStyle = PALETTE.skyTop;
    ctx.beginPath();
    ctx.arc(mx + 34 * bite, my - 6 * bite, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  void time;
}

function drawDistantShips(ctx, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 40, 55, 0.9)';
  ctx.fillStyle = 'rgba(20, 40, 55, 0.9)';
  for (let i = 0; i < 3; i++) {
    const sx = 620 + i * 190 + Math.sin(time * 0.05 + i * 2) * 8;
    const sy = 118 + i * 12;
    ctx.beginPath();
    ctx.moveTo(sx - 26, sy);
    ctx.lineTo(sx + 26, sy);
    ctx.lineTo(sx + 18, sy + 8);
    ctx.lineTo(sx - 18, sy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSea(ctx, world, time) {
  const grad = ctx.createLinearGradient(0, WORLD.reefTop, 0, WORLD.height);
  grad.addColorStop(0, PALETTE.seaShallow);
  grad.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, WORLD.reefTop, WORLD.width, WORLD.height - WORLD.reefTop);
  ctx.strokeStyle = 'rgba(127, 216, 208, 0.25)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const y = WORLD.reefTop + 40 + i * 62;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 32) {
      const yy = y + Math.sin(x * 0.02 + time * 1.1 + i * 1.7) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  void world;
}

function drawReef(ctx, world, time) {
  // Reef rock shelves.
  ctx.fillStyle = PALETTE.reefRock;
  for (let i = 0; i < 14; i++) {
    const rx = 260 + i * 74 + Math.sin(i * 3.3) * 18;
    const ry = WORLD.reefTop + 60 + (i % 5) * 108;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 52, 20, Math.sin(i) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.reefSand;
  for (let i = 0; i < 10; i++) {
    const rx = 300 + i * 96 + Math.cos(i * 2.1) * 22;
    const ry = WORLD.reefTop + 130 + (i % 4) * 120;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Channels: mud at low tide, water at high tide.
  for (let i = 0; i < CHANNELS.length; i++) {
    const c = CHANNELS[i];
    const flood = channelFlood(world.tide, i);
    ctx.fillStyle = flood > 0.02 ? 'rgba(47, 168, 160, 0.5)' : PALETTE.mudBrown;
    ctx.globalAlpha = 0.35 + flood * 0.55;
    ctx.fillRect(300, c.y, WORLD.width - 300, c.height);
    ctx.globalAlpha = 1;
    if (flood > 0.05) {
      ctx.strokeStyle = 'rgba(180, 240, 230, 0.5)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) {
        const y = c.y + 12 + k * 18;
        ctx.beginPath();
        for (let x = 300; x <= WORLD.width; x += 28) {
          const yy = y + Math.sin(x * 0.03 + time * 2 + k) * 3;
          if (x === 300) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(242, 234, 216, 0.4)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(c.name.toUpperCase(), 308, c.y + 16);
  }
}

function drawVillage(ctx, world, time) {
  ctx.save();
  // Ground the village occupies.
  ctx.fillStyle = '#1d3a30';
  ctx.fillRect(0, WORLD.reefTop, WORLD.villageX, WORLD.height - WORLD.reefTop);
  const huts = [
    { x: 44, y: 210, w: 62, h: 52 },
    { x: 58, y: 330, w: 56, h: 48 },
    { x: 40, y: 450, w: 66, h: 54 },
    { x: 62, y: 570, w: 54, h: 46 },
  ];
  for (const hut of huts) {
    ctx.fillStyle = PALETTE.villageWood;
    ctx.fillRect(hut.x, hut.y, hut.w, hut.h);
    ctx.fillStyle = PALETTE.villageRoof;
    ctx.beginPath();
    ctx.moveTo(hut.x - 6, hut.y);
    ctx.lineTo(hut.x + hut.w / 2, hut.y - 22);
    ctx.lineTo(hut.x + hut.w + 6, hut.y);
    ctx.closePath();
    ctx.fill();
    const lit = world.villageHp > 20;
    ctx.fillStyle = lit ? PALETTE.windowLit : '#3a3a3a';
    const flick = lit ? 0.85 + 0.15 * Math.sin(time * 3 + hut.x) : 1;
    ctx.globalAlpha = flick;
    ctx.fillRect(hut.x + hut.w / 2 - 7, hut.y + 16, 14, 14);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(242, 234, 216, 0.55)';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VILLAGE', 66, WORLD.reefTop + 24);
  ctx.restore();
}

function drawLighthouse(ctx, world, time) {
  const lx = WORLD.lighthouseX;
  const ly = WORLD.lighthouseY;
  ctx.save();
  // Rock base.
  ctx.fillStyle = '#3a4a4a';
  ctx.beginPath();
  ctx.ellipse(lx, ly + 96, 74, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tower: pale bands.
  ctx.fillStyle = '#e8ddc4';
  ctx.beginPath();
  ctx.moveTo(lx - 26, ly + 92);
  ctx.lineTo(lx - 16, ly - 58);
  ctx.lineTo(lx + 16, ly - 58);
  ctx.lineTo(lx + 26, ly + 92);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c94a4a';
  ctx.fillRect(lx - 21, ly + 22, 42, 18);
  ctx.fillRect(lx - 18, ly - 30, 36, 16);
  // Lamp room.
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(lx - 20, ly - 78, 40, 22);
  const glowPulse = 0.75 + 0.25 * Math.sin(time * 2.4);
  ctx.fillStyle = `rgba(255, 233, 168, ${glowPulse})`;
  ctx.beginPath();
  ctx.arc(lx, ly - 67, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a20';
  ctx.beginPath();
  ctx.moveTo(lx - 24, ly - 78);
  ctx.lineTo(lx, ly - 96);
  ctx.lineTo(lx + 24, ly - 78);
  ctx.closePath();
  ctx.fill();
  void world;
  ctx.restore();
}
