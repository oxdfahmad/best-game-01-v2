// Tidekeeper — lamps, walls and tide-gates.
// Lamps are the build: they burn gloom inside their light, and lamps close
// together chain their light — a chain deals more damage, and the chain line
// itself burns anything crossing it. Low lamps short out while their
// channel floods at high tide, so where you build matters as much as what.

import { LAMP, WALL, GATE, PLOTS, CHANNELS } from './config.js';
import { channelFlood } from './tide.js';

export function nearestFreePlot(world, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const plot of PLOTS) {
    if (world.structures.some((s) => s.plot === plot)) continue;
    const d = Math.hypot(plot.x - x, plot.y - y);
    if (d < bestD) {
      bestD = d;
      best = plot;
    }
  }
  return best;
}

export function placeStructure(world, kind, plot) {
  if (!plot) return null;
  if (world.structures.some((s) => s.plot === plot)) return null;
  const cost = kind === 'lamp' ? LAMP.cost : kind === 'wall' ? WALL.cost : GATE.cost;
  if (world.shells < cost) return null;
  if (kind === 'gate' && plot.channel === undefined) return null;
  world.shells -= cost;
  const structure = {
    kind,
    plot,
    x: plot.x,
    y: plot.y,
    hp: kind === 'wall' ? WALL.hp : kind === 'gate' ? GATE.hp : 0,
    maxHp: kind === 'wall' ? WALL.hp : kind === 'gate' ? GATE.hp : 0,
    radius: kind === 'lamp' ? LAMP.radius : 16,
    links: [],
    disabled: false,
    flicker: 0,
  };
  world.structures.push(structure);
  world.stats.lampsBuilt += kind === 'lamp' ? 1 : 0;
  return structure;
}

// Rebuild the lamp chains: two lamps within chain range link, and the link
// is mutual. Called whenever lamps are placed or removed.
export function rebuildLampLinks(world) {
  const lamps = world.structures.filter((s) => s.kind === 'lamp');
  for (const lamp of lamps) lamp.links = [];
  for (let i = 0; i < lamps.length; i++) {
    for (let j = i + 1; j < lamps.length; j++) {
      const a = lamps[i];
      const b = lamps[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= LAMP.chainRange) {
        a.links.push(b);
        b.links.push(a);
      }
    }
  }
}

export function lampChainBonus(lamp) {
  return lamp.links.length > 0 ? LAMP.chainBonus : 1;
}

// A lamp shorts out while its low plot's channel is flooded.
export function updateLampPower(world) {
  for (const s of world.structures) {
    if (s.kind !== 'lamp') continue;
    if (s.plot.channel === undefined) {
      s.disabled = false;
      continue;
    }
    const flood = channelFlood(world.tide, s.plot.channel);
    s.disabled = flood > 0.55;
    s.flicker = s.disabled ? 0 : 1;
  }
}

// Lamps burn gloom inside their light. Returns the kills this tick made
// (the caller awards them through combat).
export function updateLampFire(world, dt, damageEnemy) {
  const lamps = world.structures.filter((s) => s.kind === 'lamp' && !s.disabled);
  for (const lamp of lamps) {
    const dps = LAMP.dps * lampChainBonus(lamp);
    for (const enemy of world.enemies) {
      const d = Math.hypot(enemy.x - lamp.x, enemy.y - lamp.y);
      if (d < lamp.radius + enemy.radius) {
        damageEnemy(world, enemy, dps * dt, { silent: true, source: 'lamp' });
      }
    }
    // The chain line itself burns anything crossing between two lamps.
    for (const other of lamp.links) {
      if (other.x < lamp.x) continue;
      for (const enemy of world.enemies) {
        if (distanceToSegment(enemy.x, enemy.y, lamp.x, lamp.y, other.x, other.y) < enemy.radius + 6) {
          damageEnemy(world, enemy, dps * 0.6 * dt, { silent: true, source: 'chain' });
        }
      }
    }
  }
}

export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function drawStructures(ctx, world) {
  for (const s of world.structures) {
    if (s.kind === 'lamp') drawLamp(ctx, world, s);
    else if (s.kind === 'wall') drawWall(ctx, s);
    else drawGate(ctx, s);
  }
  drawLampChains(ctx, world);
}

function drawLampChains(ctx, world) {
  const lamps = world.structures.filter((s) => s.kind === 'lamp' && !s.disabled);
  ctx.save();
  ctx.lineWidth = 3;
  for (const lamp of lamps) {
    for (const other of lamp.links) {
      if (other.x < lamp.x) continue;
      const grad = ctx.createLinearGradient(lamp.x, lamp.y, other.x, other.y);
      grad.addColorStop(0, 'rgba(255, 214, 106, 0.55)');
      grad.addColorStop(1, 'rgba(255, 214, 106, 0.55)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(lamp.x, lamp.y);
      ctx.lineTo(other.x, other.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLamp(ctx, world, lamp) {
  ctx.save();
  if (!lamp.disabled) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.radius);
    glow.addColorStop(0, 'rgba(255, 214, 106, 0.28)');
    glow.addColorStop(1, 'rgba(255, 214, 106, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(lamp.x - 4, lamp.y - 2, 8, 26);
  ctx.fillStyle = lamp.disabled ? '#4a5a66' : '#ffe9a8';
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y - 8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (lamp.links.length > 0 && !lamp.disabled) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x' + lamp.links.length, lamp.x, lamp.y - 22);
  }
  ctx.restore();
}

function drawWall(ctx, wall) {
  ctx.save();
  ctx.fillStyle = '#5a6a72';
  ctx.strokeStyle = '#2a3a42';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(wall.x - 16, wall.y - 16, 32, 32, 5);
  ctx.fill();
  ctx.stroke();
  const hpFrac = wall.hp / wall.maxHp;
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(wall.x - 14, wall.y - 22, 28, 4);
  ctx.fillStyle = hpFrac > 0.5 ? '#5ac98a' : hpFrac > 0.25 ? '#ffd166' : '#ff5a6e';
  ctx.fillRect(wall.x - 14, wall.y - 22, 28 * hpFrac, 4);
  ctx.restore();
}

function drawGate(ctx, gate) {
  ctx.save();
  ctx.fillStyle = '#3a6a7a';
  ctx.strokeStyle = '#16303a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(gate.x - 12, gate.y - 30, 24, 60, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9fd8d0';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(gate.x - 8, gate.y + i * 16 - 2, 16, 4);
  }
  const hpFrac = gate.hp / gate.maxHp;
  ctx.fillStyle = '#1a2a30';
  ctx.fillRect(gate.x - 14, gate.y - 38, 28, 4);
  ctx.fillStyle = hpFrac > 0.5 ? '#5ac98a' : '#ffd166';
  ctx.fillRect(gate.x - 14, gate.y - 38, 28 * hpFrac, 4);
  ctx.restore();
}

export function drawBuildPlots(ctx, world) {
  ctx.save();
  for (const plot of PLOTS) {
    if (world.structures.some((s) => s.plot === plot)) continue;
    ctx.strokeStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(plot.x, plot.y, 13, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function channelIndexAt(y) {
  for (let i = 0; i < CHANNELS.length; i++) {
    const c = CHANNELS[i];
    if (y >= c.y && y <= c.y + c.height) return i;
  }
  return -1;
}
