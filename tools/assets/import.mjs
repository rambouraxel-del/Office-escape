/**
 * Transport des assets FOURNIS vers `public/assets/`.
 *
 * Usage : npm run assets
 *
 * ────────────────────────────────────────────────────────────────────────
 * RÈGLE ABSOLUE : un asset fourni n'est jamais redessiné.
 *
 * Cet outil ne sait faire que quatre choses, toutes purement techniques :
 *  1. découper une planche en frames ;
 *  2. recomposer ces frames dans la disposition attendue par le moteur ;
 *  3. réduire d'un facteur ENTIER par décimation (un pixel sur deux) ;
 *  4. écrire le résultat au bon endroit.
 *
 * Il n'y a pas une seule primitive de dessin dans ce fichier. Aucune couleur
 * n'est calculée, aucun contour n'est retouché, aucun détail n'est ajouté ni
 * retiré. Ce qui sort est ce qui est entré, à la densité près.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Pourquoi une réduction de moitié (`ASSET_SHRINK`) : les planches livrées
 * sont dessinées pour un monde deux fois plus grand que celui des niveaux
 * actuels. Un bureau fourni mesure 240 pixels de large ; le rectangle de
 * collision d'un bureau du niveau 1 en mesure 110. Deux issues étaient
 * possibles — doubler toutes les coordonnées des trois niveaux, ce qui aurait
 * cassé le level design et tout l'équilibrage, ou transporter les assets à
 * l'échelle du jeu. La seconde ne touche à rien d'autre qu'à la densité de
 * pixels, et la décimation par 2 ne produit aucun flou.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bitmap } from './png.mjs';
import { SUPPLIED } from './supplied.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE = join(ROOT, 'assets-source', 'v011');
const TARGET = join(ROOT, 'public', 'assets');

/**
 * Facteur de transport. Les planches sont livrées au double de l'échelle du
 * monde : on prend un pixel sur deux, sans moyenne.
 */
export const ASSET_SHRINK = 2;

/** Grille des planches de personnages fournies : 6 colonnes × 3 lignes. */
const SUPPLIED_CHARACTER = { frame: 128, cols: 6, rows: 3 };

/**
 * Disposition attendue par le moteur (`src/game/animations.ts`) : 8 colonnes
 * × 3 lignes, colonnes 0-1 repos, 2-5 marche, 6-7 sursaut ; lignes face,
 * profil, dos.
 *
 * Chaque case dit QUELLE frame de la planche fournie recopier, en (ligne,
 * colonne) source. On ne fabrique rien : on range.
 */
const ENGINE_LAYOUT = {
  // Ligne 0 — face. Colonnes source 0 et 1.
  down: { columns: [0, 1], rows: [0, 1, 2] },
  // Ligne 1 — profil. La planche fournie regarde à DROITE, comme le moteur.
  side: { columns: [4, 5], rows: [0, 1, 2] },
  // Ligne 2 — dos.
  up: { columns: [2, 3], rows: [0, 1, 2] }
};

const ENGINE_VIEW_ORDER = ['down', 'side', 'up'];

/**
 * Pour chaque colonne de la planche moteur, la frame source à y placer,
 * exprimée en (ligne source, indice de colonne dans `columns`).
 *
 * Repos : les deux poses de la ligne 0. Marche : on alterne les lignes 0 et 1,
 * ce qui donne les quatre temps attendus. Sursaut : la ligne 2, dont la pose
 * de face a la bouche ouverte.
 */
const ENGINE_COLUMNS = [
  [0, 0],
  [0, 1],
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 0],
  [2, 1]
];

function ensure(path) {
  mkdirSync(dirname(path), { recursive: true });
}

/** Découpe une planche fournie et la range dans la disposition du moteur. */
function transportCharacter(source) {
  const sheet = Bitmap.read(join(SOURCE, source));
  const { frame, cols, rows } = SUPPLIED_CHARACTER;
  if (sheet.width !== frame * cols || sheet.height !== frame * rows) {
    throw new Error(
      `${source} : planche de ${sheet.width}×${sheet.height}, ` +
        `${frame * cols}×${frame * rows} attendu (${cols}×${rows} frames de ${frame})`
    );
  }

  const out = new Bitmap(frame * ENGINE_COLUMNS.length, frame * ENGINE_VIEW_ORDER.length);
  ENGINE_VIEW_ORDER.forEach((view, viewIndex) => {
    const plan = ENGINE_LAYOUT[view];
    ENGINE_COLUMNS.forEach(([sourceRow, columnIndex], engineColumn) => {
      const sourceColumn = plan.columns[columnIndex];
      const cell = sheet.crop(sourceColumn * frame, sourceRow * frame, frame, frame);
      out.blit(cell, engineColumn * frame, viewIndex * frame);
    });
  });
  return out.shrink(ASSET_SHRINK);
}

/** Transporte une image simple : décimation, rien d'autre. */
function transportImage(source) {
  return Bitmap.read(join(SOURCE, source)).shrink(ASSET_SHRINK);
}

const report = [];
for (const asset of SUPPLIED) {
  const image = asset.kind === 'character' ? transportCharacter(asset.source) : transportImage(asset.source);
  const path = join(TARGET, asset.group, `${asset.key}.png`);
  ensure(path);
  image.write(path);
  report.push({
    key: asset.key,
    group: asset.group,
    source: asset.source,
    size: [image.width, image.height]
  });
  console.log(
    `  ${asset.group}/${asset.key}.png`.padEnd(46),
    `${image.width}×${image.height}`.padStart(11),
    `← ${asset.source}`
  );
}

// Trace de ce qui a été transporté : permet de vérifier d'un coup d'œil que
// tout PNG livré vient bien d'une source fournie, et laquelle.
const trace = join(ROOT, 'assets-source', 'imported.json');
writeFileSync(
  trace,
  `${JSON.stringify({ shrink: ASSET_SHRINK, count: report.length, assets: report }, null, 2)}\n`
);

const supplied = JSON.parse(readFileSync(join(SOURCE, 'manifest.json'), 'utf8'));
console.log(
  `\n${report.length} assets transportés (réduction ×1/${ASSET_SHRINK}) ` +
    `depuis les ${supplied.total_assets} PNG fournis.`
);
