// Tidekeeper — the build phase and the shop.
// Between waves the player spends shells: lamps, walls and tide-gates go
// onto reef plots with a click, upgrades sharpen the beam and the flare,
// and repairs patch the village. The build clock runs; when it ends, the
// next wave starts whether the player is ready or not.

import { SHOP, BUILD_SECONDS } from './config.js';
import { placeStructure, rebuildLampLinks, nearestFreePlot } from './lamps.js';
import { startWave } from './waves.js';
import { playBuild, playClick } from './sound.js';

export function startBuildPhase(world) {
  world.buildTimer = BUILD_SECONDS;
  world.selectedBuild = 'lamp';
  world.shopMessage = '';
}

export function updateBuildPhase(world, dt, input) {
  world.buildTimer -= dt;
  if (world.buildTimer <= 0) {
    endBuildPhase(world);
  }
}

export function endBuildPhase(world) {
  world.screen = 'play';
  world.selectedBuild = null;
  startWave(world, world.wave + 1);
}

export function buyShopItem(world, id) {
  const item = SHOP.find((s) => s.id === id);
  if (!item) return false;
  if (item.kind === 'place') {
    world.selectedBuild = id;
    playClick(world.sound);
    return true;
  }
  if (item.kind === 'repair') {
    if (world.shells < item.cost) {
      world.shopMessage = 'Not enough shells.';
      return false;
    }
    if (world.villageHp >= 100) {
      world.shopMessage = 'Village already whole.';
      return false;
    }
    world.shells -= item.cost;
    world.villageHp = Math.min(100, world.villageHp + 25);
    playBuild(world.sound);
    return true;
  }
  // Upgrades: track how many the player owns, cap at the listed max.
  const owned = world.upgrades[item.id] ?? 0;
  if (owned >= (item.max ?? 1)) {
    world.shopMessage = 'Already at max.';
    return false;
  }
  if (world.shells < item.cost) {
    world.shopMessage = 'Not enough shells.';
    return false;
  }
  world.shells -= item.cost;
  world.upgrades[item.id] = owned + 1;
  applyUpgrade(world, item.id);
  playBuild(world.sound);
  return true;
}

function applyUpgrade(world, id) {
  if (id === 'beamdmg') world.beam.damageLevel += 1;
  else if (id === 'beamcool') world.beam.coolLevel += 1;
  else if (id === 'flarepow') world.beam.flareLevel += 1;
  else if (id === 'mendkit') world.abilities.mend.uses += 1;
}

export function tryPlaceAt(world, x, y) {
  if (!world.selectedBuild) return false;
  const plot = nearestFreePlot(world, x, y, 46);
  if (!plot) {
    world.shopMessage = 'No free plot there.';
    return false;
  }
  const placed = placeStructure(world, world.selectedBuild, plot);
  if (!placed) {
    world.shopMessage = world.shells < 40 ? 'Not enough shells.' : 'Cannot build there.';
    return false;
  }
  rebuildLampLinks(world);
  playBuild(world.sound);
  return true;
}

export function shopItems(world) {
  return SHOP.map((item) => ({
    ...item,
    owned: world.upgrades[item.id] ?? 0,
    affordable: world.shells >= item.cost,
    selected: world.selectedBuild === item.id,
  }));
}
