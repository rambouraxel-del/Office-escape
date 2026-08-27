/**
 * Rapport « ASSETS MANQUANTS » : recense les ASSET_TODO du dépôt.
 *
 * Le compte ne peut pas dériver — il est relu dans les sources à chaque appel,
 * jamais recopié à la main.
 *
 * Usage : npm run assets:report
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WANTED } from './wanted.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCANNED = ['src', 'tools', 'tests'];
const TAG = 'ASSET_TODO';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|mjs|js|json|md)$/.test(entry)) out.push(path);
  }
  return out;
}

const hits = [];
for (const dir of SCANNED) {
  for (const file of walk(join(ROOT, dir))) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const match = line.match(new RegExp(`${TAG}:\\s*([\\w-]+)`));
        if (match) hits.push({ name: match[1], file: relative(ROOT, file), line: index + 1 });
      });
  }
}

const known = new Map(WANTED.map((entry) => [entry.name, entry]));
const orphans = hits.filter((hit) => !known.has(hit.name));

console.log(`ASSETS MANQUANTS — ${hits.length} ${TAG} dans le dépôt\n`);
for (const entry of WANTED) {
  const where = hits.filter((hit) => hit.name === entry.name);
  console.log(`## ${entry.title}`);
  console.log(`- Tag        : ${TAG}: ${entry.name}`);
  console.log(`- Catégorie  : ${entry.category}`);
  console.log(`- Utilisation: ${entry.usage}`);
  console.log(`- Taille     : ${entry.size}`);
  console.log(`- Vue        : ${entry.view}`);
  console.log(`- Description: ${entry.description}`);
  console.log(`- Animation  : ${entry.animation}`);
  console.log(`- Priorité   : ${entry.priority}`);
  console.log(`- Marqué dans: ${where.length ? where.map((h) => `${h.file}:${h.line}`).join(', ') : '—'}`);
  console.log();
}

if (orphans.length > 0) {
  console.log(`⚠ ${orphans.length} ${TAG} sans fiche dans wanted.mjs :`);
  orphans.forEach((hit) => console.log(`  ${hit.name} (${hit.file}:${hit.line})`));
  process.exitCode = 1;
}
