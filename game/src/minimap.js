// Tidekeeper — the radar minimap.
// A small top-right radar of the whole reef: the village, the lighthouse,
// the channels, your lamps as gold dots and the gloom as red dots, so the
// player always knows where the next push is coming from.

import { WORLD, CHANNELS } from './config.js';

export function drawMinimap(ctx, world) {
  const mw = 168;
  const mh = 96;
  const mx = WORLD.width - mw - 14;
  const my = WORLD.hudHeight + 12;
  const sx = mw / WORLD.width;
  const sy = mh / WORLD.height;
  ctx.save();
  ctx.fillStyle = 'rgba(6, 24, 32, 0.82)';
  ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 24);
  ctx.strokeStyle = '#2a5a66';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx - 6, my - 6, mw + 12, mh + 24);
  ctx.fillStyle = '#0e4a55';
  ctx.fillRect(mx, my, mw, mh);
  // Channels on the radar.
  ctx.fillStyle = 'rgba(47, 168, 160, 0.4)';
  for (const c of CHANNELS) {
    ctx.fillRect(mx, my + c.y * sy, mw, c.height * sy);
  }
  // Village block.
  ctx.fillStyle = '#8a4a3a';
  ctx.fillRect(mx, my + WORLD.reefTop * sy, WORLD.villageX * sx, (WORLD.height - WORLD.reefTop) * sy);
  // Lamps as gold dots, walls as grey ticks.
  for (const s of world.structures) {
    ctx.fillStyle = s.kind === 'lamp' ? '#ffd166' : '#9aa8b0';
    ctx.beginPath();
    ctx.arc(mx + s.x * sx, my + s.y * sy, s.kind === 'lamp' ? 2.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lighthouse.
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.arc(mx + WORLD.lighthouseX * sx, my + WORLD.lighthouseY * sy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Enemies as red dots; the boss as a big red ring.
  for (const e of world.enemies) {
    ctx.fillStyle = '#ff5a6e';
    ctx.beginPath();
    ctx.arc(mx + e.x * sx, my + e.y * sy, e.radius > 30 ? 4 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.boss) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx + world.boss.x * sx, my + world.boss.y * sy, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#9db8bd';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('REEF RADAR', mx, my + mh + 14);
  ctx.restore();
}
