/**
 * Cuit tous les sprites en PNG dans `public/assets/`.
 *
 * Usage : npm run art
 *
 * Le jeu ne connaît que les PNG produits ici : un graphiste peut remplacer
 * n'importe quel fichier par un vrai asset dessiné à la main, sans toucher une
 * ligne de code, tant qu'il respecte les dimensions.
 *
 * Règle d'échelle du projet : 1 pixel d'art = 2 unités de monde (ART_SCALE).
 * Tout est donc dessiné en résolution native puis agrandi ×2, jamais
 * interpolé.
 */
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, makeCharacter } from './characters.mjs';
import { TILES } from './tiles.mjs';
import { PROPS } from './props.mjs';
import { UI } from './ui.mjs';
import { makeMenuBackground } from './menu.mjs';

const ART_SCALE = 2;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = join(ROOT, 'public', 'assets');

/** Les personnages sont déjà cuits en 64×64 par `makeCharacter`. */
const GROUPS = [
  {
    dir: 'characters',
    entries: Object.entries(CHARACTERS).map(([key, spec]) => [key, () => makeCharacter(spec)]),
    scale: 1
  },
  { dir: 'tiles', entries: Object.entries(TILES), scale: ART_SCALE },
  { dir: 'props', entries: Object.entries(PROPS), scale: ART_SCALE },
  { dir: 'ui', entries: Object.entries(UI), scale: ART_SCALE },
  { dir: 'tiles', entries: [['menu-bg', makeMenuBackground]], scale: ART_SCALE, keep: true }
];

let written = 0;
for (const group of GROUPS) {
  const target = join(ASSETS, group.dir);
  mkdirSync(target, { recursive: true });
  // On repart d'un dossier propre : un sprite renommé ne doit pas laisser
  // d'orphelin qui gonflerait le poids du déploiement.
  if (!group.keep) {
    for (const file of readdirSync(target)) {
      if (file.endsWith('.png')) rmSync(join(target, file));
    }
  }

  for (const [key, make] of group.entries) {
    const canvas = group.scale > 1 ? make().scale(group.scale) : make();
    const png = canvas.toPng();
    writeFileSync(join(target, `${key}.png`), png);
    written += 1;
    console.log(
      `  ${group.dir}/${key}.png`.padEnd(42),
      `${canvas.width}×${canvas.height}`.padStart(9),
      `${png.length} o`.padStart(9)
    );
  }
}

console.log(
  `\n${written} sprites générés dans public/assets/ (1 pixel d'art = ${ART_SCALE} unités de monde).`
);
