# Tidekeeper — Lanterns of the Drowned Reef

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/oxdfahmad/best-game-01-v2/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/oxdfahmad/best-game-01-v2/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

You are the keeper of a reef lighthouse. Ten waves of gloom rise from the
sea, and the tide itself is your battlefield: channels flood at high tide
and drain to mud at low tide, the moon of each wave sets how far the water
swings, and the storm lamps you raise link their light into chains that
scorch whatever crosses them. Hold the village until dawn — and scatter the
Drowned King on wave 10.

## How to play

- **Aim:** mouse · **Fire the beam:** hold click (watch the heat — it locks out when it overheats)
- **1 — Flare Burst** · **2 — Tide Call** (forces low tide for 8s) · **3 — Mend Village**
- **Between waves:** click a shop item, then click a glowing plot to build
- **P** pause · **M** mute · **R** restart on the end screens

Lamps burn gloom in their light and chain with near lamps. Low lamps short
out while their channel floods. Walls block the path; tide-gates hold the
channels. Kills earn shells and build your combo; the Hollow Captain leads
wave 5 and the Drowned King ends wave 10 in three phases.

## Run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

or any static server, e.g. `python3 -m http.server -d game`. No network
requests: all art is drawn in canvas code and all sound is synthesized
with WebAudio. Open `game/index.html` in a desktop browser.

Screenshots use a staging hook, `?shot=boss|title|shop|win&seed=1`, which
puts the game into a deterministic seeded state for each scene.

## Files

- `game/index.html` — page shell · `game/style.css` — page styling
- `game/src/config.js` — palette, tuning, wave plan, moons, shop catalogue
- `game/src/rng.js` — seeded random numbers
- `game/src/input.js` — keyboard + mouse
- `game/src/tide.js` — tide cycle, moon phases, channel flooding
- `game/src/lamps.js` — lamps, lamp-linking chains, walls, tide-gates
- `game/src/beam.js` — lighthouse beam, heat, Flare Burst
- `game/src/enemies.js` — enemy kinds and the two named bosses
- `game/src/combat.js` — damage, kills, score, combos, shells
- `game/src/waves.js` — wave director and roster
- `game/src/shop.js` — build phase and shop
- `game/src/hud.js` — village health, wave, score, tide gauge, abilities, roster, boss bar
- `game/src/minimap.js` — reef radar
- `game/src/background.js` — dusk sky, moon, ships, village, reef, channels
- `game/src/particles.js` — sparks, splashes, floating damage numbers
- `game/src/sound.js` — synthesized sound effects
- `game/src/music.js` — generative ambient music
- `game/src/tutorial.js` — hints and how-to-play
- `game/src/state.js` — world, update loop, best score
- `game/src/staging.js` — deterministic screenshot scenes
- `game/src/render.js` — draw orchestration
- `game/src/main.js` — bootstrap and fixed-step loop
- `main.ts` — builds the entry dossier (`MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `vendor/makefun-game.ts` — make.fun dossier library (vendored)

MIT licensed. Original game, written for the make.fun best-game-01 bounty.
