/**
 * Vignettes de la sélection de niveau.
 *
 * Trois petits dioramas de 60 × 40, composés des MÊMES motifs et accessoires
 * que le jeu : le menu ne peut pas promettre autre chose que ce qu'on va
 * jouer. Elles disent en un coup d'œil « bureaux », « direction », « parking »
 * sans qu'on ait à lire le titre.
 */
import { PixelCanvas } from './canvas.mjs';
import { TILES } from './tiles.mjs';
import { MENU_PARTS, PROPS } from './props.mjs';
import { CHARACTERS, makeCharacterFrame } from './characters.mjs';

const W = 60;
const H = 40;

function tileFill(canvas, tile, x0, y0, width, height) {
  for (let y = y0; y < y0 + height; y += tile.height) {
    for (let x = x0; x < x0 + width; x += tile.width) canvas.blit(tile, x, y);
  }
}

/** Meuble habillé comme dans le jeu : matière, arête claire, base sombre, contour. */
function block(canvas, tile, x, y, width, height, crest, base) {
  tileFill(canvas, tile, x, y, width, height);
  canvas.hLine(x + 1, y + 1, width - 2, crest);
  canvas.hLine(x + 1, y + height - 2, width - 2, base);
  canvas.stroke(x, y, width, height, 'ink');
}

/** Un personnage, réduit à sa silhouette utile : la vignette est minuscule. */
function figure(canvas, key, x, y, view = 'down') {
  canvas.blit(makeCharacterFrame(CHARACTERS[key], view, 0), x, y);
}

/** Niveau 1 : moquette chaude, bureaux en bois, un peu de bazar. */
function office() {
  const canvas = new PixelCanvas(W, H);
  tileFill(canvas, TILES['tile-floor'](), 0, 0, W, H);
  const wood = TILES['tile-wood']();
  block(canvas, wood, 2, 6, 16, 12, 'woodLight', 'woodDark');
  block(canvas, wood, 42, 6, 16, 12, 'woodLight', 'woodDark');
  block(canvas, wood, 2, 24, 16, 12, 'woodLight', 'woodDark');
  canvas.blit(PROPS['prop-plant'](), 42, 22);
  canvas.blit(MENU_PARTS.mug(), 21, 30);
  figure(canvas, 'char-player', 14, 4, 'up');
  canvas.stroke(0, 0, W, H, 'ink');
  return canvas;
}

/** Niveau 2 : marbre froid, moquette de cadres, laiton. */
function exec() {
  const canvas = new PixelCanvas(W, H);
  tileFill(canvas, TILES['tile-marble'](), 0, 0, W, H);
  tileFill(canvas, TILES['tile-carpet-exec'](), 22, 0, 16, H);
  canvas.vLine(22, 0, H, 'carpetExecDark');
  canvas.vLine(37, 0, H, 'carpetExecDark');
  const metal = TILES['tile-metal']();
  block(canvas, metal, 2, 8, 14, 10, 'metalLight', 'metalDark');
  block(canvas, metal, 44, 8, 14, 10, 'metalLight', 'metalDark');
  canvas.blit(PROPS['prop-armchair'](), 0, 22);
  canvas.blit(PROPS['prop-frame'](), 44, 24);
  figure(canvas, 'char-boss', 14, 6);
  canvas.stroke(0, 0, W, H, 'ink');
  return canvas;
}

/** Niveau 3 : bitume, béton, une place vide et un plot. */
function parking() {
  const canvas = new PixelCanvas(W, H);
  tileFill(canvas, TILES['tile-asphalt'](), 0, 0, W, H);
  // Places matérialisées au marquage : la signature visuelle d'un parking.
  [4, 22, 40].forEach((x) => {
    canvas.stroke(x, 4, 16, 14, 'paintLine', 0.75);
  });
  const concrete = TILES['tile-concrete']();
  block(canvas, concrete, 6, 24, 10, 12, 'concreteLight', 'concreteDark');
  block(canvas, concrete, 44, 24, 10, 12, 'concreteLight', 'concreteDark');
  canvas.blit(PROPS['prop-cone'](), 24, 24);
  figure(canvas, 'char-guard', 14, 2);
  // Voile de nuit : la vignette doit être lisiblement plus sombre.
  canvas.tintAll('hudInset', 0.45);
  canvas.stroke(0, 0, W, H, 'ink');
  return canvas;
}

export const THUMBS = {
  'thumb-office': office,
  'thumb-exec': exec,
  'thumb-parking': parking
};
