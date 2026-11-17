// Tidekeeper — the screens: title, build/shop, victory, defeat, pause.
// Each screen draws its panel over the reef and consumes the clicks that
// land on its buttons, so one click never fires two actions.

import { WORLD, PALETTE, SHOP, TOTAL_WAVES } from './config.js';
import { takeClick, pointInRect } from './input.js';
import { startNewGame } from './state.js';
import { buyShopItem, tryPlaceAt, endBuildPhase, shopItems } from './shop.js';
import { howToPlayLines } from './tutorial.js';
import { playClick } from './sound.js';
import { drawBuildPlots } from './lamps.js';

function drawButton(ctx, rect, label, opts = {}) {
  ctx.save();
  ctx.fillStyle = opts.accent ? '#ffd166' : '#2a5a66';
  ctx.strokeStyle = opts.accent ? '#8a6a2a' : '#5a8a96';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = opts.accent ? '#2a1a0a' : '#f2ead8';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 6);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 24, 32, 0.88)';
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawTitle(ctx, world, input) {
  panel(ctx, 340, 110, 600, 440);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.winGold;
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText('TIDEKEEPER', 640, 180);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Lanterns of the Drowned Reef', 640, 212);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Ten waves. One lighthouse. Hold the reef until dawn.', 640, 244);
  ctx.fillStyle = PALETTE.shellGold;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('BEST SCORE  ' + Math.max(world.best, world.score), 640, 278);
  const lines = howToPlayLines();
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '14px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 640, 312 + i * 24));
  ctx.restore();
  const startRect = { x: 520, y: 470, w: 240, h: 52 };
  drawButton(ctx, startRect, '▶  START THE NIGHT', { accent: true });
  let click;
  while ((click = takeClick(input)) !== null) {
    if (pointInRect(click.x, click.y, startRect)) {
      playClick(world.sound);
      startNewGame(world);
    }
  }
}

export function drawBuild(ctx, world, input) {
  drawBuildPlots(ctx, world);
  // Shop panel on the right.
  const px = 976;
  const py = 74;
  const pw = 288;
  const ph = 560;
  panel(ctx, px, py, pw, ph);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.winGold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('REEF SHOP', px + 16, py + 30);
  ctx.fillStyle = PALETTE.shellGold;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('◉ ' + world.shells + ' shells', px + 16, py + 52);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Next: WAVE ' + (world.wave + 1) + ' / ' + TOTAL_WAVES, px + 160, py + 30);
  ctx.fillText('Click an item, then a glowing plot.', px + 16, py + 70);
  const items = shopItems(world);
  const rowH = 52;
  const rowRects = [];
  items.forEach((item, i) => {
    const ry = py + 82 + i * rowH;
    const rect = { x: px + 10, y: ry, w: pw - 20, h: rowH - 6 };
    rowRects.push({ rect, item });
    ctx.fillStyle = item.selected ? 'rgba(255, 209, 102, 0.2)' : 'rgba(42, 90, 102, 0.35)';
    ctx.strokeStyle = item.selected ? '#ffd166' : PALETTE.panelEdge;
    ctx.lineWidth = item.selected ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = item.affordable ? PALETTE.textBright : '#5a6a72';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(item.name + (item.owned > 0 ? '  x' + item.owned : ''), rect.x + 10, rect.y + 18);
    ctx.fillStyle = PALETTE.shellGold;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('◉ ' + item.cost, rect.x + rect.w - 52, rect.y + 18);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(item.desc, rect.x + 10, rect.y + 36);
  });
  ctx.restore();
  const startRect = { x: px + 16, y: py + ph - 58, w: pw - 32, h: 44 };
  drawButton(ctx, startRect, 'START WAVE ' + (world.wave + 1) + '  ▶', { accent: true });
  if (world.shopMessage) {
    ctx.save();
    ctx.fillStyle = '#ff5a6e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.shopMessage, 640, 700);
    ctx.restore();
  }
  let click;
  while ((click = takeClick(input)) !== null) {
    if (pointInRect(click.x, click.y, startRect)) {
      playClick(world.sound);
      endBuildPhase(world);
      continue;
    }
    let hitRow = false;
    for (const { rect, item } of rowRects) {
      if (pointInRect(click.x, click.y, rect)) {
        hitRow = true;
        buyShopItem(world, item.id);
        break;
      }
    }
    if (!hitRow && world.selectedBuild) {
      tryPlaceAt(world, click.x, click.y);
    }
  }
}

function statRows(ctx, world, x, y) {
  const r = world.result;
  if (!r) return;
  const rows = [
    ['SCORE', String(r.score)],
    ['BEST', String(r.best)],
    ['WAVES CLEARED', r.waves + ' / ' + TOTAL_WAVES],
    ['GLOOM SLAIN', String(r.kills)],
    ['BEAM ACCURACY', r.accuracy + '%'],
    ['BOSSES DOWN', String(r.bosses)],
    ['LAMPS RAISED', String(r.lamps)],
  ];
  ctx.save();
  ctx.textAlign = 'left';
  rows.forEach(([label, value], i) => {
    const ry = y + i * 28;
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(label, x, ry);
    ctx.fillStyle = PALETTE.textBright;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, x + 260, ry);
    ctx.textAlign = 'left';
  });
  ctx.restore();
}

export function drawWin(ctx, world, input) {
  panel(ctx, 390, 130, 500, 430);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.winGold;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('DAWN BREAKS', 640, 195);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('The Drowned King is scattered. The reef holds.', 640, 228);
  ctx.restore();
  statRows(ctx, world, 510, 280);
  const againRect = { x: 520, y: 480, w: 240, h: 52 };
  drawButton(ctx, againRect, '↻  PLAY AGAIN', { accent: true });
  let click;
  while ((click = takeClick(input)) !== null) {
    if (pointInRect(click.x, click.y, againRect)) {
      playClick(world.sound);
      startNewGame(world);
    }
  }
}

export function drawLose(ctx, world, input) {
  panel(ctx, 390, 130, 500, 430);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5a6e';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('THE LIGHT GOES OUT', 640, 195);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('The village falls dark on wave ' + world.wave + '.', 640, 228);
  ctx.restore();
  statRows(ctx, world, 510, 280);
  const retryRect = { x: 520, y: 480, w: 240, h: 52 };
  drawButton(ctx, retryRect, '↻  TRY AGAIN', { accent: true });
  let click;
  while ((click = takeClick(input)) !== null) {
    if (pointInRect(click.x, click.y, retryRect)) {
      playClick(world.sound);
      startNewGame(world);
    }
  }
}

export function drawPause(ctx, world, input) {
  panel(ctx, 440, 240, 400, 220);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText('PAUSED', 640, 300);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('P or Esc to resume · R to restart', 640, 332);
  ctx.restore();
  const resumeRect = { x: 500, y: 360, w: 280, h: 46 };
  drawButton(ctx, resumeRect, 'RESUME', { accent: true });
  let click;
  while ((click = takeClick(input)) !== null) {
    if (pointInRect(click.x, click.y, resumeRect)) {
      world.screen = world.prevScreen;
    }
  }
}
