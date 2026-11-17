// Tidekeeper — entry program for best-game-01 (Node 22, standard library).
// The playable game is the static game/ folder beside this file. This
// program copies game/ and screenshots/ into the output directory and
// writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. Two runs write byte-identical output.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// (Without MAKEFUN_OUTPUT_DIR it writes to /output, the grader's folder.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the bounty's gate.json limits. Text is the only one that
// shapes bytes; the rest refuse an entry the scorer would refuse, so this
// program fails where the scorer would instead of handing in a doomed one.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
