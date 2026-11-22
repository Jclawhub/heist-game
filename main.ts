// Midnight at the Leonida Museum — the entry program (Node 22, standard
// library only). The game is this directory's game/ folder, plain static
// files a desktop browser loads offline: game/index.html and its ES modules,
// no library and no network request. This program hands it in: it copies
// game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in an empty entry: the game folder and at
// least one screenshot must exist beside this file.
const gameDir = join(repoRoot, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`game/index.html is missing under ${repoRoot}`);
}
const shotsDir = join(repoRoot, 'screenshots');
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')) : [];
if (shotNames.length < 3) {
  throw new Error(`expected at least 3 screenshots, found ${shotNames.length}`);
}

// Start from a clean output directory so a stale file can never leak in.
mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files in all,
// or a path under game/ over 1000 bytes: game/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);

// A short build report, so a failed or empty hand-in is obvious at a glance.
const gameFiles = readdirSync(join(outputDir, 'game'), { recursive: true }).length;
const dossierBytes = statSync(join(outputDir, 'dossier.json')).size;
console.log(
  `handed in ${gameFiles} game entries and ${shotNames.length} screenshots ` +
    `(${shotNames.join(', ')}) to ${outputDir}; dossier.json is ${dossierBytes} bytes`,
);
