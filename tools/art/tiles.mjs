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

/** Marbre de l'étage direction : froid, clair, veiné très discrètement. */
function marble() {
  const canvas = new PixelCanvas(S, S).fill('marbleMid');
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const n = noise(x, y, 71);
      if (n > 0.88) canvas.set(x, y, 'marbleLight', 0.9);
      else if (n < 0.04) canvas.set(x, y, 'marbleSeam', 0.22);
    }
  }
  // Dalles franches : c'est le joint net qui fait « hall de direction »,
  // là où la moquette du niveau 1 n'a qu'un grain.
  canvas.hLine(0, 0, S, 'marbleSeam', 0.85);
  canvas.vLine(0, 0, S, 'marbleSeam', 0.85);
  canvas.hLine(0, 1, S, 'marbleLight', 0.5);
  return canvas;
}

/** Bitume du parking : sombre, granuleux, sans chaleur. */
function asphalt(base, speck, seed) {
  const canvas = new PixelCanvas(S, S).fill(base);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const n = noise(x, y, seed);
      if (n > 0.86) canvas.set(x, y, speck, 0.55);
      else if (n < 0.14) canvas.set(x, y, 'asphaltDark', 0.5);
    }
  }
  return canvas;
}

/** Béton brut : piliers et murs du parking. */
function concrete() {
  const canvas = new PixelCanvas(S, S).fill('concreteMid');
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const n = noise(x, y, 89);
      if (n > 0.9) canvas.set(x, y, 'concreteLight', 0.55);
      else if (n < 0.1) canvas.set(x, y, 'concreteDark', 0.5);
    }
  }
  // Trace de coffrage : une ligne horizontale tous les huit pixels.
  for (let y = 0; y < S; y += 8) canvas.hLine(0, y, S, 'concreteDark', 0.35);
  return canvas;
}

/** Carrosserie : les « voitures » du parking sont des obstacles rectangulaires. */
function carPaint() {
  const canvas = new PixelCanvas(S, S).fill('navy');
  for (let y = 0; y < S; y += 1) {
    const tone = noise(0, y, 97);
    if (tone > 0.72) canvas.hLine(0, y, S, 'navyLight', 0.4);
    else if (tone < 0.2) canvas.hLine(0, y, S, 'navyDark', 0.45);
  }
  return canvas;
}

/**
 * Faïence de sanitaires : petits carreaux blancs et joints nets.
 * C'est la matière qui dit « toilettes » avant même les sanitaires posés
 * dessus — un rectangle métallique étiqueté « WC » ne l'a jamais dit.
 */
function bathroomTiles() {
  const canvas = new PixelCanvas(S, S).fill('marbleLight');
  for (let y = 0; y < S; y += 4) canvas.hLine(0, y, S, 'marbleSeam', 0.9);
  for (let x = 0; x < S; x += 4) canvas.vLine(x, 0, S, 'marbleSeam', 0.9);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      if (noise(x, y, 101) > 0.93) canvas.set(x, y, 'glass', 0.18);
    }
  }
  return canvas;
}

/**
 * Carrelage à dalles carrées : sol dur, joints marqués. Sert au hall, à la
 * cuisine et aux sanitaires — c'est le joint qui donne l'échelle de la pièce.
 */
function slabs(base, seam, speck, size, seed) {
  const canvas = new PixelCanvas(S, S).fill(base);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      if (noise(x, y, seed) > 0.93) canvas.set(x, y, speck, 0.5);
    }
  }
  for (let i = 0; i < S; i += size) {
    canvas.hLine(0, i, S, seam, 0.8);
    canvas.vLine(i, 0, S, seam, 0.8);
    canvas.hLine(0, i + 1, S, speck, 0.3);
  }
  return canvas;
}

/** Pavage extérieur : dalles décalées d'une rangée sur deux. */
function paving() {
  const canvas = new PixelCanvas(S, S).fill('paving');
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      if (noise(x, y, 91) > 0.88) canvas.set(x, y, 'pavingSeam', 0.35);
    }
  }
  [0, 8].forEach((row) => {
    canvas.hLine(0, row, S, 'pavingSeam', 0.75);
    // Décalage d'une demi-dalle : sans lui, on lit une grille, pas un pavage.
    const offset = row === 0 ? 0 : 8;
    for (let x = offset; x < S + offset; x += 16) canvas.vLine(x % S, row, 8, 'pavingSeam', 0.7);
  });
  return canvas;
}

/** Sol technique caoutchouc : pastilles antidérapantes. Local serveurs. */
function rubberFloor() {
  const canvas = new PixelCanvas(S, S).fill('rubber');
  for (let y = 2; y < S; y += 5) {
    for (let x = 2; x < S; x += 5) {
      canvas.set(x, y, 'rubberStud');
      canvas.set(x + 1, y, 'rubberStud', 0.5);
      canvas.set(x, y + 1, 'rubberStud', 0.5);
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
  'tile-stone': () => stone(),
  'tile-marble': () => marble(),
  'tile-carpet-exec': () => carpet('carpetExec', 'carpetExecDark', 'carpetExecDark', 67),
  'tile-asphalt': () => asphalt('asphaltMid', 'asphaltLight', 73),
  'tile-bay': () => asphalt('asphaltLight', 'asphaltSeam', 79),
  'tile-concrete': () => concrete(),
  'tile-carpaint': () => carPaint(),
  'tile-bathroom': () => bathroomTiles(),
  // ── Matières ajoutées en V0.11, d'après les planches d'assets fournies.
  'tile-carpet-blue': () => carpet('carpetBlue', 'carpetBlueDark', 'carpetBlueDark', 101),
  'tile-carpet-grey': () => carpet('carpetGrey', 'carpetGreyDark', 'carpetGreyDark', 103),
  'tile-slab': () => slabs('tileLight', 'tileLightSeam', 'paper', 8, 107),
  'tile-kitchen': () => slabs('kitchenTile', 'kitchenSeam', 'paper', 4, 109),
  'tile-paving': () => paving(),
  'tile-rubber': () => rubberFloor()
};
