// Tidekeeper — the tide and the moon.
// The tide is the game's named mechanic: it rises and falls on a fixed
// cycle, floods the reef channels at its peak and drains them to mud at its
// trough. The moon of the current wave sets how far the tide swings.

import { TIDE, moonForWave } from './config.js';

export function createTide() {
  return {
    clock: 0,
    level: 0.5,
    moon: moonForWave(1),
    forcedLowUntil: -1,
  };
}

export function updateTide(tide, dt, wave, time) {
  tide.clock += dt;
  tide.moon = moonForWave(wave);
  const forcedLow = time < tide.forcedLowUntil;
  const phase = (tide.clock / TIDE.periodSeconds) * Math.PI * 2;
  const swing = forcedLow ? -0.3 : tide.moon.tideAmp;
  tide.level = 0.5 + swing * Math.sin(phase);
  if (tide.level < 0.05) tide.level = 0.05;
  if (tide.level > 0.98) tide.level = 0.98;
  return forcedLow;
}

export function tideLevel(tide) {
  return tide.level;
}

// How flooded is one channel right now, 0 (dry mud) to 1 (full water).
export function channelFlood(tide, channelIndex) {
  const level = tide.level;
  if (level <= TIDE.mudBelow) return 0;
  if (level >= TIDE.floodAbove) return 1;
  return (level - TIDE.mudBelow) / (TIDE.floodAbove - TIDE.mudBelow);
}

export function isChannelFlooded(tide) {
  return tide.level >= TIDE.floodAbove;
}

export function isChannelMud(tide) {
  return tide.level <= TIDE.mudBelow;
}

// Speed multiplier for an enemy standing in the given channel now.
export function tideSpeedFactor(tide, inChannel) {
  if (!inChannel) return 1;
  if (tide.level >= TIDE.floodAbove) return TIDE.swimSpeed;
  if (tide.level <= TIDE.mudBelow) return TIDE.mudSpeed;
  return 1;
}

export function forceLowTide(tide, time, seconds) {
  tide.forcedLowUntil = time + seconds;
}

export function tideLabel(tide) {
  if (tide.level >= TIDE.floodAbove) return 'HIGH TIDE';
  if (tide.level <= TIDE.mudBelow) return 'LOW TIDE';
  return 'RISING TIDE';
}
