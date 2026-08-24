/**
 * Motifs de sol et de matière.
 *
 * Les obstacles d'un `LevelDef` sont des rectangles de taille arbitraire : on
 * ne peut pas les couvrir avec des sprites fixes. Chaque matière est donc un
 * motif RACCORDABLE de 16×16 (cuit ×2 en 32×32) que le jeu étire en
 * `TileSprite`, plus une bordure dessinée au trait. Un meuble de n'importe
 * quelle taille reste ainsi du pixel art propre.
 */
import { PixelCanvas } from './canvas.mjs';

const S = 16;

/**
 * Bruit déterministe : la génération doit être reproductible, sinon chaque
 * `npm run art` réécrirait tous les PNG et pollurait les diffs.
 */
function noise(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Moquette : nuance chaude, grain fin, joint de dalle sur deux bords. */
function carpet(base, speck, seam, seed) {
  const canvas = new PixelCanvas(S, S).fill(base);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const n = noise(x, y, seed);
      // Grain volontairement discret : le sol doit meubler l'espace, pas
      // rivaliser avec les personnages ni brouiller les cônes de vision.
      if (n > 0.94) canvas.set(x, y, speck, 0.7);
      else if (n < 0.05) canvas.set(x, y, seam, 0.25);
    }
  }
  // Joints sur deux bords seulement : le raccord reste invisible.
  canvas.hLine(0, 0, S, seam, 0.35);
  canvas.vLine(0, 0, S, seam, 0.35);
  return canvas;
}

/** Bois : veines horizontales, pour les plateaux de bureau. */
function wood(seed) {
  const canvas = new PixelCanvas(S, S).fill('woodMid');
  for (let y = 0; y < S; y += 1) {
    const tone = noise(0, y, seed);
    const color = tone > 0.62 ? 'woodLight' : tone < 0.24 ? 'woodDark' : null;
    if (color) canvas.hLine(0, y, S, color, 0.55);
    for (let x = 0; x < S; x += 1) {
      if (noise(x, y, seed + 7) > 0.93) canvas.set(x, y, 'woodDark', 0.5);
    }
  }
  return canvas;
}

/** Cloison vue de dessus : panneaux verticaux et arête claire. */
function wallPanel() {
  const canvas = new PixelCanvas(S, S).fill('wallMid');
  canvas.hLine(0, 0, S, 'wallLight');
  canvas.hLine(0, 1, S, 'wallLight', 0.45);
  canvas.hLine(0, S - 1, S, 'wallDark');
  for (let x = 0; x < S; x += 8) canvas.vLine(x, 2, S - 3, 'wallDark', 0.4);
  for (let y = 2; y < S - 1; y += 1) {
    for (let x = 0; x < S; x += 1) {
      if (noise(x, y, 31) > 0.94) canvas.set(x, y, 'wallLight', 0.3);
    }
  }
  return canvas;
}

/** Métal brossé : armoires et blocs techniques. */
function metal() {
  const canvas = new PixelCanvas(S, S).fill('metalMid');
  for (let y = 0; y < S; y += 1) {
    if (y % 4 === 0) canvas.hLine(0, y, S, 'metalLight', 0.4);
    if (y % 4 === 2) canvas.hLine(0, y, S, 'metalDark', 0.35);
  }
  return canvas;
}

/** Béton : pilier et zones d'archives. */
function stone() {
  const canvas = new PixelCanvas(S, S).fill('stoneMid');
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const n = noise(x, y, 53);
      if (n > 0.88) canvas.set(x, y, 'stoneLight', 0.5);
      else if (n < 0.12) canvas.set(x, y, 'stoneDark', 0.45);
    }
  }
  return canvas;
}

export const TILES = {
  'tile-floor': () => carpet('floorMid', 'floorLight', 'floorSeam', 11),
  'tile-floor-alt': () => carpet('floorDark', 'floorMid', 'floorSeam', 23),
  'tile-carpet-start': () => carpet('carpetStart', 'carpetStartDark', 'carpetStartDark', 41),
  'tile-carpet-exit': () => carpet('carpetExit', 'carpetExitDark', 'carpetExitDark', 47),
  'tile-carpet-alcove': () => carpet('carpetAlcove', 'floorLight', 'floorSeam', 59),
  'tile-wall': () => wallPanel(),
  'tile-wood': () => wood(17),
  'tile-metal': () => metal(),
  'tile-stone': () => stone()
};
