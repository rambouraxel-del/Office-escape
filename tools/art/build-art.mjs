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
 * interpolé. Les planches d'animation ne font pas exception : ce sont des
 * images comme les autres, découpées en frames par le jeu.
 */
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, makeCharacterSheet } from './characters.mjs';
import { TILES } from './tiles.mjs';
import { PROPS, PROP_SHEETS } from './props.mjs';
import { FX_SHEETS, makeLight } from './fx.mjs';
import { THUMBS } from './thumbs.mjs';
import { UI } from './ui.mjs';
import { MENU_SHEETS, MENU_STILLS } from './menu.mjs';

const ART_SCALE = 2;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = join(ROOT, 'public', 'assets');

const characterSheets = Object.entries(CHARACTERS).map(([key, spec]) => [
  key,
  () => makeCharacterSheet(spec)
]);

const GROUPS = [
  { dir: 'characters', entries: characterSheets },
  { dir: 'tiles', entries: Object.entries(TILES) },
  { dir: 'props', entries: [...Object.entries(PROPS), ...Object.entries(PROP_SHEETS)] },
  { dir: 'fx', entries: [...Object.entries(FX_SHEETS), ['fx-light', makeLight]] },
  { dir: 'ui', entries: Object.entries(THUMBS) },
  { dir: 'ui', entries: Object.entries(UI), keep: true },
  // L'accueil vit dans `ui/` : c'est de l'habillage, pas une matière de niveau.
  { dir: 'ui', entries: [...Object.entries(MENU_STILLS), ...Object.entries(MENU_SHEETS)], keep: true }
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
    const canvas = make().scale(ART_SCALE);
    const png = canvas.toPng();
    writeFileSync(join(target, `${key}.png`), png);
    written += 1;
    console.log(
      `  ${group.dir}/${key}.png`.padEnd(42),
      `${canvas.width}×${canvas.height}`.padStart(11),
      `${png.length} o`.padStart(9)
    );
  }
}

console.log(
  `\n${written} sprites générés dans public/assets/ (1 pixel d'art = ${ART_SCALE} unités de monde).`
);
