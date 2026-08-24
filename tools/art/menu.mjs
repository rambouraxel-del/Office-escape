/**
 * Fond d'écran du menu : un diorama de bureau vu de dessus.
 *
 * Composé à partir des MÊMES motifs et accessoires que le jeu — le menu ne
 * peut pas promettre une autre direction artistique que celle qu'on va jouer.
 * L'illustration peinte de la V0.7 jurait complètement avec le pixel art.
 */
import { PixelCanvas } from './canvas.mjs';
import { TILES } from './tiles.mjs';
import { PROPS } from './props.mjs';
import { CHARACTERS, makeCharacterSource } from './characters.mjs';

const W = 195;
const H = 422;

/** Pave toute la surface avec un motif raccordable. */
function tileFill(canvas, tile, x0, y0, width, height) {
  for (let y = y0; y < y0 + height; y += tile.height) {
    for (let x = x0; x < x0 + width; x += tile.width) canvas.blit(tile, x, y);
  }
}

/** Meuble rectangulaire habillé comme dans le jeu : matière, arête, contour. */
function furniture(canvas, tile, x, y, width, height, crest, base) {
  canvas.rect(x + 2, y + 3, width, height, 'ink', 0.22);
  tileFill(canvas, tile, x, y, width, height);
  canvas.hLine(x + 1, y + 1, width - 2, crest);
  canvas.hLine(x + 1, y + height - 2, width - 2, base);
  canvas.stroke(x, y, width, height, 'ink');
}

export function makeMenuBackground() {
  const canvas = new PixelCanvas(W, H);
  const floor = TILES['tile-floor']();
  const wood = TILES['tile-wood']();
  const wall = TILES['tile-wall']();
  const carpet = TILES['tile-carpet-exit']();

  tileFill(canvas, floor, 0, 0, W, H);

  // Couloir central en moquette : guide l'œil vers le haut, comme le niveau.
  tileFill(canvas, TILES['tile-carpet-alcove'](), 66, 0, 64, H);
  canvas.vLine(66, 0, H, 'floorSeam', 0.6);
  canvas.vLine(129, 0, H, 'floorSeam', 0.6);

  // Cloisons haute et basse.
  furniture(canvas, wall, -4, 0, 60, 18, 'wallTop', 'wallDark');
  furniture(canvas, wall, 139, 0, 60, 18, 'wallTop', 'wallDark');
  furniture(canvas, wall, -4, H - 16, W + 8, 18, 'wallTop', 'wallDark');

  // Zone de sortie, tout en haut.
  tileFill(canvas, carpet, 68, 20, 60, 30);
  canvas.stroke(68, 20, 60, 30, 'carpetExitDark');
  canvas.blit(PROPS['prop-exit-sign'](), 78, 4);

  // Rangées de bureaux de part et d'autre.
  const desks = [60, 130, 200, 270, 340];
  desks.forEach((y, index) => {
    furniture(canvas, wood, 6, y, 52, 40, 'woodLight', 'woodDark');
    furniture(canvas, wood, 137, y, 52, 40, 'woodLight', 'woodDark');
    canvas.blit(PROPS['prop-screen'](), 14, y + 4);
    canvas.blit(PROPS['prop-screen'](), 145, y + 4);
    canvas.blit(PROPS['prop-mug'](), 44, y + 24);
    canvas.blit(PROPS['prop-folder'](), 160, y + 26);
    if (index % 2 === 0) {
      canvas.blit(PROPS['prop-chair'](), 22, y + 44);
      canvas.blit(PROPS['prop-chair'](), 153, y + 44);
    }
  });

  // Plantes dans les angles.
  const plant = PROPS['prop-plant']();
  [
    [2, 24],
    [178, 24],
    [2, 300],
    [178, 380]
  ].forEach(([x, y]) => canvas.blit(plant, x, y));

  // Le couloir est habité : sans personnages, le menu ne raconte rien.
  canvas.blit(makeCharacterSource(CHARACTERS['char-colleague']), 82, 96);
  canvas.blit(makeCharacterSource(CHARACTERS['char-boss']), 80, 214);
  canvas.blit(makeCharacterSource(CHARACTERS['char-player']), 84, 344);
  return canvas;
}
