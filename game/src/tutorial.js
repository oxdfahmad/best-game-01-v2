// Tidekeeper — tutorial hints and the how-to-play panel.
// Short hint cards during the first wave, and the full control list on the
// title screen. The game teaches itself in three lines, then gets out of
// the way.

export function tutorialHints(world) {
  if (world.screen !== 'play') return [];
  if (world.wave !== 1) return [];
  const hints = [];
  if (world.time < 14) {
    hints.push('Aim with the mouse — hold CLICK to fire the lighthouse beam.');
  }
  if (world.time >= 6 && world.time < 20) {
    hints.push('Watch the tide: channels flood at HIGH TIDE and slow foes in mud at LOW TIDE.');
  }
  if (world.time >= 14 && world.time < 26) {
    hints.push('Press 1 for Flare Burst, 2 to call low tide, 3 to mend the village.');
  }
  return hints;
}

export function howToPlayLines() {
  return [
    'MOUSE — aim the lighthouse beam · HOLD CLICK — fire (watch the heat)',
    '1 — Flare Burst · 2 — Tide Call (forces low tide) · 3 — Mend Village',
    'Between waves: click a shop item, then click a glowing plot to build',
    'Lamps burn gloom and link together — chains scorch what crosses them',
    'Low lamps short out when their channel floods at high tide',
    'Walls block the path · Tide-Gates hold the channels · P pause · M mute',
  ];
}

export function drawHints(ctx, world) {
  const hints = tutorialHints(world);
  if (hints.length === 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  let y = 668;
  for (const hint of hints) {
    const w = ctx.measureText(hint).width + 28;
    ctx.fillStyle = 'rgba(6, 24, 32, 0.82)';
    ctx.beginPath();
    ctx.roundRect(640 - w / 2, y - 18, w, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(hint, 640, y);
    y -= 28;
  }
  ctx.restore();
}
