// Tidekeeper — bootstrap and game loop.
// Starts the world, wires the input, and runs a fixed 60 Hz step so the
// game plays the same on every machine. With ?shot=<scene>&seed=<n> it
// stages a deterministic scene instead, draws it, and sets
// window.__shotReady for the screenshot tool.

import { createWorld, updateWorld } from './state.js';
import { createInput } from './input.js';
import { drawGame } from './render.js';
import { applyShot } from './staging.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

const world = createWorld(seed);
const input = createInput(canvas);

if (shot) {
  applyShot(world, shot, seed);
}

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let frames = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (!shot) {
    acc += elapsed;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      updateWorld(world, STEP, input);
      acc -= STEP;
      steps += 1;
    }
    if (steps === 5) acc = 0;
  }
  drawGame(ctx, world, input);
  frames += 1;
  if (frames === 2) {
    window.__shotReady = true;
  }
}

requestAnimationFrame(frame);
