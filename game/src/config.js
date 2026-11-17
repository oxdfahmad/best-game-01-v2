// Tidekeeper — palette, tuning, wave plan, moon phases and shop catalogue.
// Every number the game balances on lives here, so tuning never hides in
// the simulation code. Ten waves, one moon per wave, two named bosses.

export const WORLD = {
  width: 1280,
  height: 720,
  hudHeight: 58,
  villageX: 132,
  lighthouseX: 196,
  lighthouseY: 392,
  reefTop: 96,
  reefBottom: 696,
};

export const PALETTE = {
  skyTop: '#0b1e33',
  skyMid: '#123a52',
  skyLow: '#1d5a66',
  seaDeep: '#062a33',
  seaShallow: '#0e4a55',
  reefRock: '#274b52',
  reefSand: '#3a5a52',
  villageWood: '#6b4a2f',
  villageRoof: '#8a4a3a',
  windowLit: '#ffd98a',
  lampCore: '#ffe9a8',
  lampGlow: '#ffb347',
  beamCore: '#fff6c9',
  beamEdge: '#ffd76a',
  gloomBody: '#2a2140',
  gloomEye: '#ff5a6e',
  shellGold: '#ffd166',
  heartRed: '#ff5a6e',
  tideWater: '#2fa8a0',
  mudBrown: '#5a4a35',
  textBright: '#f2ead8',
  textDim: '#9db8bd',
  panelDark: '#0a2530',
  panelEdge: '#2a5a66',
  bossRed: '#e5484d',
  winGold: '#ffd166',
};

export const MOONS = [
  { name: 'New Moon', tideAmp: 0.22, enemySpeed: 1.0, shellBonus: 0, dark: 0.3, note: 'Dark water. Wisps gather.' },
  { name: 'Crescent Moon', tideAmp: 0.3, enemySpeed: 1.02, shellBonus: 0, dark: 0.18, note: 'Thin light, quick tides.' },
  { name: 'Half Moon', tideAmp: 0.36, enemySpeed: 1.05, shellBonus: 5, dark: 0.1, note: 'Steady pull, fair seas.' },
  { name: 'Gibbous Moon', tideAmp: 0.44, enemySpeed: 1.08, shellBonus: 10, dark: 0.04, note: 'Strong tides, bold gloom.' },
  { name: 'Full Moon', tideAmp: 0.55, enemySpeed: 1.12, shellBonus: 25, dark: 0, note: 'Highest tides. Richest shells.' },
];

export function moonForWave(wave) {
  return MOONS[(wave - 1) % MOONS.length];
}

// Three reef channels. Enemies wade through them; the tide floods and
// drains them, which changes enemy speed and shorts out low lamps.
export const CHANNELS = [
  { y: 168, height: 74, low: true, name: 'North Channel' },
  { y: 372, height: 74, low: false, name: 'Middle Channel' },
  { y: 576, height: 74, low: true, name: 'South Channel' },
];

// Build plots: where lamps, walls and tide-gates may stand. High plots
// never flood; low plots sit in a channel and short out at high tide.
export const PLOTS = [
  { x: 330, y: 150, high: true }, { x: 470, y: 150, high: true },
  { x: 610, y: 150, high: true }, { x: 750, y: 150, high: true },
  { x: 890, y: 150, high: true }, { x: 1030, y: 150, high: true },
  { x: 330, y: 300, high: false, channel: 0 }, { x: 470, y: 300, high: false, channel: 0 },
  { x: 610, y: 300, high: false, channel: 0 }, { x: 750, y: 300, high: false, channel: 0 },
  { x: 890, y: 300, high: false, channel: 0 }, { x: 1030, y: 300, high: false, channel: 0 },
  { x: 330, y: 470, high: true }, { x: 470, y: 470, high: true },
  { x: 610, y: 470, high: true }, { x: 750, y: 470, high: true },
  { x: 890, y: 470, high: true }, { x: 1030, y: 470, high: true },
  { x: 330, y: 620, high: false, channel: 2 }, { x: 470, y: 620, high: false, channel: 2 },
  { x: 610, y: 620, high: false, channel: 2 }, { x: 750, y: 620, high: false, channel: 2 },
  { x: 890, y: 620, high: false, channel: 2 }, { x: 1030, y: 620, high: false, channel: 2 },
  { x: 1130, y: 230, high: true }, { x: 1130, y: 400, high: true }, { x: 1130, y: 560, high: true },
];

export const ENEMIES = {
  crab: { name: 'Skitter Crab', hp: 22, speed: 58, damage: 6, shells: 2, score: 50, radius: 14, color: '#c96a4a', dark: '#7a3a28' },
  wisp: { name: 'Gloom Wisp', hp: 13, speed: 84, damage: 4, shells: 2, score: 60, radius: 11, color: '#8a7bd8', dark: '#4a3a8a' },
  spitter: { name: 'Spitter', hp: 28, speed: 42, damage: 8, shells: 3, score: 80, radius: 13, color: '#5ac98a', dark: '#2a6a4a' },
  brute: { name: 'Brute Turtle', hp: 95, speed: 29, damage: 14, shells: 5, score: 150, radius: 22, color: '#7a8a9a', dark: '#3a4a5a' },
  splitter: { name: 'Splitter', hp: 36, speed: 47, damage: 8, shells: 3, score: 100, radius: 15, color: '#d8a03a', dark: '#8a5a1a' },
  captain: { name: 'The Hollow Captain', hp: 950, speed: 25, damage: 25, shells: 40, score: 1500, radius: 34, color: '#b8c8d8', dark: '#5a6a7a', boss: true },
  king: { name: 'The Drowned King', hp: 2600, speed: 19, damage: 40, shells: 120, score: 5000, radius: 48, color: '#e8c86a', dark: '#8a6a2a', boss: true },
};

// Wave plan: count, mix (weights), and which boss, if any, leads the wave.
export function wavePlan(wave) {
  const mixes = [
    { crab: 5, wisp: 2 },
    { crab: 5, wisp: 4, spitter: 1 },
    { crab: 5, wisp: 5, spitter: 2, splitter: 1 },
    { crab: 4, wisp: 5, spitter: 3, splitter: 2, brute: 1 },
    { crab: 4, wisp: 4, spitter: 3, splitter: 2, brute: 2 },
    { crab: 4, wisp: 6, spitter: 4, splitter: 3, brute: 2 },
    { crab: 3, wisp: 6, spitter: 4, splitter: 3, brute: 3 },
    { crab: 3, wisp: 6, spitter: 5, splitter: 4, brute: 3 },
    { crab: 3, wisp: 7, spitter: 5, splitter: 4, brute: 4 },
    { crab: 3, wisp: 7, spitter: 5, splitter: 5, brute: 4 },
  ];
  const mix = mixes[Math.min(wave - 1, mixes.length - 1)];
  const count = 6 + wave * 3;
  const boss = wave === 5 ? 'captain' : wave === 10 ? 'king' : null;
  return { count, mix, boss, moon: moonForWave(wave) };
}

export const BEAM = {
  dps: 130,
  heatPerSecond: 42,
  coolPerSecond: 64,
  overheatLock: 30,
  width: 11,
  range: 1160,
};

export const LAMP = {
  cost: 40,
  radius: 92,
  dps: 20,
  chainRange: 230,
  chainBonus: 1.5,
};

export const WALL = { cost: 25, hp: 130 };
export const GATE = { cost: 60, hp: 320 };

export const ABILITIES = {
  flare: { name: 'Flare Burst', key: '1', cooldown: 24, damage: 90, radius: 260 },
  tidecall: { name: 'Tide Call', key: '2', cooldown: 38, lowTideSeconds: 8 },
  mend: { name: 'Mend Village', key: '3', cooldown: 30, heal: 30, maxUses: 4 },
};

export const SHOP = [
  { id: 'lamp', name: 'Storm Lamp', cost: 40, kind: 'place', desc: 'Burns gloom in its light. Links with near lamps.' },
  { id: 'wall', name: 'Reef Wall', cost: 25, kind: 'place', desc: 'Blocks the path. Enemies stop to break it.' },
  { id: 'gate', name: 'Tide-Gate', cost: 60, kind: 'place', desc: 'Channel barrier. Holds back high-tide swimmers.' },
  { id: 'beamdmg', name: 'Bright Lens', cost: 50, kind: 'upgrade', max: 5, desc: '+25% beam damage.' },
  { id: 'beamcool', name: 'Cooling Coil', cost: 40, kind: 'upgrade', max: 3, desc: 'Beam heats 20% slower.' },
  { id: 'flarepow', name: 'Flare Powder', cost: 35, kind: 'upgrade', max: 3, desc: '+40 flare damage.' },
  { id: 'mendkit', name: 'Mend Kit', cost: 25, kind: 'upgrade', max: 4, desc: '+1 Mend use.' },
  { id: 'repair', name: 'Repair Village', cost: 20, kind: 'repair', desc: 'Restore 25 village health.' },
];

export const TIDE = {
  periodSeconds: 46,
  floodAbove: 0.62,
  mudBelow: 0.38,
  swimSpeed: 1.35,
  mudSpeed: 0.7,
};

export const VILLAGE_MAX_HP = 100;
export const TOTAL_WAVES = 10;
export const BUILD_SECONDS = 25;
