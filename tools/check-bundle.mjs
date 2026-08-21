/**
 * Budget de performance : échoue si le bundle grossit au-delà du seuil.
 *
 * Sans garde-fou automatique, un bundle ne fait que grandir. Les seuils sont
 * volontairement peu au-dessus du réel : un dépassement doit être un choix
 * conscient (on relève la limite dans ce fichier), pas une dérive silencieuse.
 *
 * Usage : npm run build && npm run budget
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');

/** Budgets en kilo-octets gzippés. */
const BUDGETS = {
  // Code du jeu : c'est celui-ci qui doit rester sous surveillance.
  app: 60,
  // Phaser 4 est livré pré-bundlé sans `sideEffects: false` : le tree-shaking
  // ne donne rien (mesuré : 6 octets d'écart). Ce chunk est donc une constante,
  // isolée pour rester en cache navigateur entre deux déploiements.
  phaser: 400,
  total: 470
};

function gzipKb(path) {
  return gzipSync(readFileSync(path)).length / 1024;
}

let files;
try {
  files = readdirSync(DIST).filter((name) => name.endsWith('.js') || name.endsWith('.css'));
} catch {
  console.error(`Aucun build trouvé dans ${DIST}. Lance d'abord « npm run build ».`);
  process.exit(1);
}

const sizes = { app: 0, phaser: 0, total: 0 };
const rows = [];

for (const name of files) {
  const path = join(DIST, name);
  if (!statSync(path).isFile()) continue;
  const kb = gzipKb(path);
  const bucket = name.startsWith('phaser') ? 'phaser' : 'app';
  sizes[bucket] += kb;
  sizes.total += kb;
  rows.push([name, bucket, kb]);
}

rows.sort((a, b) => b[2] - a[2]);
for (const [name, bucket, kb] of rows) {
  console.log(`  ${name.padEnd(34)} ${bucket.padEnd(7)} ${kb.toFixed(1).padStart(7)} Ko gz`);
}

let failed = false;
for (const [key, budget] of Object.entries(BUDGETS)) {
  const used = sizes[key];
  const status = used <= budget ? 'OK  ' : 'DÉPASSÉ';
  const percent = ((used / budget) * 100).toFixed(0);
  console.log(`${status} ${key.padEnd(7)} ${used.toFixed(1).padStart(7)} / ${budget} Ko gz (${percent} %)`);
  if (used > budget) failed = true;
}

if (failed) {
  console.error(
    '\nBudget de bundle dépassé. Allège le code, ou relève le seuil sciemment dans tools/check-bundle.mjs.'
  );
  process.exit(1);
}
console.log('\nBudget respecté.');
