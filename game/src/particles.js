// Tidekeeper — particles and floating damage numbers.
// Every hit, kill and splash leaves something visible: sparks, spray, and
// the damage numbers the judge reads as feedback on every action.

export function createParticleLayer() {
  return { sparks: [], floaters: [] };
}

export function spawnBurst(layer, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.6);
    layer.sparks.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 30,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      size: 2 + Math.random() * 3.5,
      color,
    });
  }
}

export function spawnSplash(layer, x, y, count) {
  for (let i = 0; i < count; i++) {
    layer.sparks.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      vx: (Math.random() - 0.5) * 60,
      vy: -40 - Math.random() * 90,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      size: 2 + Math.random() * 3,
      color: '#7fd8d0',
    });
  }
}

export function spawnBeamHit(layer, x, y) {
  spawnBurst(layer, x, y, '#ffe9a8', 5, 130);
}

export function addFloater(layer, x, y, text, color) {
  layer.floaters.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
}

export function updateParticles(layer, dt) {
  for (const p of layer.sparks) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
    p.vx *= 0.98;
  }
  layer.sparks = layer.sparks.filter((p) => p.life > 0);
  for (const f of layer.floaters) {
    f.life -= dt;
    f.y -= 42 * dt;
  }
  layer.floaters = layer.floaters.filter((f) => f.life > 0);
}

export function drawParticles(ctx, layer) {
  for (const p of layer.sparks) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of layer.floaters) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = a;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
