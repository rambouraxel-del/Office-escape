/**
 * Écran d'accueil : un open space au crépuscule, vu DE FACE.
 *
 * C'est la seule pièce du projet dessinée en élévation. Le jeu se joue de
 * dessus — une vue de dessus dit « plan », pas « ambiance », et un menu doit
 * donner envie avant d'informer. La bible graphique autorise explicitement au
 * menu une direction un peu plus cinématographique que celle des niveaux ;
 * elle ne l'autorise pas à changer de PALETTE, et il n'y en a qu'une.
 *
 * Le décor est cuit en une seule image (`menu-room`). Ce qui bouge est
 * découpé en petites planches posées PAR-DESSUS, à des positions déclarées
 * dans `artTheme.ts` : la scène n'invente aucune coordonnée d'asset.
 */
import { PixelCanvas, fromRows, padRows, strip } from './canvas.mjs';
import { CHARACTERS, makeCharacterFrame } from './characters.mjs';

/** Résolution d'art de l'écran : 195 × 422, cuit ×2 → 390 × 844. */
const W = 195;
const H = 422;

/** Lignes de composition, en pixels d'art. Tout le reste s'y accroche. */
export const MENU_LAYOUT = {
  ceiling: 13,
  windowTop: 18,
  windowBottom: 100,
  /** Bande de mur nu réservée au titre : rien ne s'y pose. */
  titleTop: 102,
  /** Dessus de la crédence : les objets muraux posent leur base ici. */
  credenza: 150,
  floor: 174,
  /** Dessus des bureaux : personnages et écrans posent leur base ici. */
  desk: 214
};

const L = {
  '.': null,
  K: 'ink',
  k: 'inkSoft',
  w: 'paper',
  W: 'paperDim',
  m: 'metalMid',
  M: 'metalLight',
  n: 'metalDark',
  s: 'screen',
  S: 'screenGlow',
  g: 'glass',
  G: 'glassDim',
  o: 'woodMid',
  O: 'woodDark',
  u: 'woodLight',
  c: 'coral',
  C: 'coralDark',
  t: 'teal',
  T: 'tealDark',
  y: 'gold',
  Y: 'goldDark',
  l: 'leaf',
  L: 'leafDark',
  p: 'pot',
  P: 'potDark',
  b: 'blue',
  B: 'blueDark',
  z: 'skin',
  r: 'alert',
  N: 'neonTube',
  h: 'lampGlow'
};

function sprite(width, rows) {
  return fromRows(padRows(rows, width), L);
}

// ───────────────────────────── accessoires ──────────────────────────────
// Dessinés EN ÉLÉVATION, donc propres au menu : les accessoires du jeu sont
// vus de dessus et paraîtraient couchés sur la crédence.

/** Imprimante de bureau, vue de face. Sa diode est animée par la scène. */
const PRINTER = () =>
  sprite(26, [
    '..KKKKKKKKKKKKKKKKKKKKKK..',
    '..KmmmmmmmmmmmmmmmmmmmmK..',
    '..KMMMMMMMMMMMMMMMMMMMMK..',
    '..KmnnnnnnnnnnnnnnnnnnmK..',
    '..KmnwwwwwwwwwwwwwwwwnmK..',
    '..KmnnnnnnnnnnnnnnnnnnmK..',
    '..KmmmmmmmmmmmmmmmmmmmmK..',
    '..KmmKKKKKKKKKKKKKKmmmmK..',
    '..KmmKwwwwwwwwwwwwKmmmmK..',
    '..KmmKKKKKKKKKKKKKKmmmmK..',
    '..KnnnnnnnnnnnnnnnnnnnnK..',
    '..KKKKKKKKKKKKKKKKKKKKKK..'
  ]);

/** Machine à café : le geyser de vapeur est ajouté par la scène. */
const COFFEE = () =>
  sprite(20, [
    '.KKKKKKKKKKKKKKKKKK.',
    '.KnnnnnnnnnnnnnnnnK.',
    '.KnMMMMMMMMMMMMMMnK.',
    '.KnMKKKKKKKKKKKKMnK.',
    '.KnMKsssssssssssKnK.',
    '.KnMKsSSSSSSSSSsKnK.',
    '.KnMKsssssssssssKnK.',
    '.KnMKKKKKKKKKKKKMnK.',
    '.KnMMMMMMMMMMMMMMnK.',
    '.KnnnKKKKKKKKKKnnnK.',
    '.KnnnKwwwwwwwwKnnnK.',
    '.KnnnKwWWWWWWwKnnnK.',
    '.KnnnKKKKKKKKKKnnnK.',
    '.KnnnnnnnnnnnnnnnnK.',
    '.KKKKKKKKKKKKKKKKKK.'
  ]);

/** Plante en pot, de face : plus haute et plus fournie que celle du jeu. */
const PLANT = () =>
  sprite(22, [
    '.........lL...........',
    '.......llllL..lL......',
    '......lllllLllllL.....',
    '....lLlllllLlllllL....',
    '...llllLllllLllllLl...',
    '..lllllllLlllLlllllL..',
    '...lLlllllLlllllLll...',
    '.....lllLllllLlll.....',
    '.......lllLlll........',
    '.........lLl..........',
    '.........LlL..........',
    '.......KKKKKKKK.......',
    '.......KppppppK.......',
    '.......KpppppPK.......',
    '.......KPppppPK.......',
    '.......KPPPPPPK.......',
    '........KKKKKK........'
  ]);

/** Pile de cartons d'archives : le décor d'un bureau qui déménage jamais. */
const BOXES = () =>
  sprite(24, [
    '....KKKKKKKKKKKKKK......',
    '....KooooooooooooK......',
    '....KoOOOOOOOOOOoK......',
    '....KooooooooooooK......',
    '....KKKKKKKKKKKKKK......',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '..KooooooooooooooooooK..',
    '..KoOOOOOOOOOOOOOOOOoK..',
    '..KooooooooooooooooooK..',
    '..KooooooooooooooooooK..',
    '..KKKKKKKKKKKKKKKKKKKK..'
  ]);

/** Tasse posée : minuscule, mais c'est elle qui dit « quelqu'un vit ici ». */
const CUP = () =>
  sprite(8, ['.KKKKKK.', '.KwwwwKK', '.KwWWwKK', '.KwWWwKK', '.KWWWWK.', '.KKKKKK.']);

/** Fauteuil de bureau vu de dos : ce qu'on voit d'un open space, en vrai. */
const CHAIR = () =>
  sprite(22, [
    '.....KKKKKKKKKKKK.....',
    '....KBBBBBBBBBBBBK....',
    '....KBbbbbbbbbbbBK....',
    '....KBbbbbbbbbbbBK....',
    '....KBbbbbbbbbbbBK....',
    '....KBBbbbbbbbbBBK....',
    '.....KBBBBBBBBBBK.....',
    '.......KKKKKKK........',
    '.........KBK..........',
    '.........KBK..........',
    '......KKKKKKKKKK......',
    '......KBBBBBBBBK......',
    '.......KK....KK.......'
  ]);

// ────────────────────────────── la pièce ────────────────────────────────

/** Silhouettes de la ville : largeur, hauteur, et si elle est éclairée. */
const SKYLINE_FAR = [
  [8, 16],
  [13, 26],
  [9, 12],
  [16, 32],
  [11, 20],
  [14, 24],
  [10, 15],
  [18, 30],
  [12, 22],
  [15, 18],
  [9, 27],
  [13, 14],
  [16, 23],
  [11, 31]
];

const SKYLINE_NEAR = [
  [14, 12],
  [10, 22],
  [17, 15],
  [12, 28],
  [15, 11],
  [11, 19],
  [16, 25],
  [13, 13],
  [18, 20],
  [12, 16],
  [14, 24],
  [10, 14]
];

/** Rangée d'immeubles posée sur une ligne d'horizon, avec ses fenêtres. */
function skyline(canvas, shapes, baseline, body, lit, x0, litChance) {
  let x = x0;
  shapes.forEach(([width, height], index) => {
    const top = baseline - height;
    canvas.rect(x, top, width, height, body);
    // Fenêtres allumées : une trame régulière, un immeuble sur `litChance`.
    for (let wy = top + 3; wy < baseline - 2; wy += 4) {
      for (let wx = x + 2; wx < x + width - 2; wx += 3) {
        if ((wx * 7 + wy * 13 + index * 5) % litChance === 0) canvas.set(wx, wy, lit);
      }
    }
    x += width + 1;
  });
}

/** Baie vitrée : le ciel fait tout le travail, le reste est un cadre. */
function bayWindow(canvas) {
  const top = MENU_LAYOUT.windowTop;
  const bottom = MENU_LAYOUT.windowBottom;
  const left = 8;
  const right = W - 8;
  const inner = { x: left + 3, y: top + 3, w: right - left - 6, h: bottom - top - 6 };

  // Ciel : quatre bandes, du violet froid au braise. Un dégradé pixel se lit
  // mieux en paliers francs qu'en interpolation — c'est la règle du média.
  const bands = [
    ['duskHigh', 0, 20],
    ['duskMid', 20, 34],
    ['duskLow', 34, 48],
    ['duskGlow', 48, inner.h]
  ];
  bands.forEach(([color, from, to]) => {
    canvas.rect(inner.x, inner.y + from, inner.w, to - from, color);
  });

  // Soleil couchant, largement dans le dernier tiers : il donne la direction
  // de la lumière, et donc l'ombre de tout le reste de la pièce.
  // Quelques étoiles dans la bande froide : c'est ce qui dit « il est tard ».
  [
    [12, 6],
    [38, 11],
    [64, 4],
    [96, 9],
    [128, 5],
    [152, 12],
    [168, 7]
  ].forEach(([dx, dy]) => canvas.set(inner.x + dx, inner.y + dy, 'paper', 0.7));

  const sunX = inner.x + Math.round(inner.w * 0.7);
  const sunY = inner.y + 38;
  canvas.disc(sunX, sunY, 14, 'duskGlow', 0.3);
  canvas.disc(sunX, sunY, 9, 'duskGlow', 0.65);
  canvas.disc(sunX, sunY, 5, 'lampGlow');

  const horizon = inner.y + inner.h;
  skyline(canvas, SKYLINE_FAR, horizon - 8, 'cityFar', 'cityLit', inner.x - 4, 3);
  skyline(canvas, SKYLINE_NEAR, horizon, 'cityNear', 'cityLit', inner.x - 6, 2);

  // Meneaux : sans eux, c'est un trou dans le mur, pas une fenêtre.
  [Math.round(inner.x + inner.w / 3), Math.round(inner.x + (inner.w * 2) / 3)].forEach((x) => {
    canvas.rect(x, inner.y, 2, inner.h, 'metalDark');
  });
  canvas.rect(inner.x, inner.y + 34, inner.w, 2, 'metalDark');

  // Dormant et appui.
  canvas.rect(left, top, right - left, 3, 'metalMid');
  canvas.rect(left, bottom - 3, right - left, 3, 'metalMid');
  canvas.rect(left, top, 3, bottom - top, 'metalMid');
  canvas.rect(right - 3, top, 3, bottom - top, 'metalMid');
  canvas.stroke(left, top, right - left, bottom - top, 'ink');
  canvas.stroke(inner.x - 1, inner.y - 1, inner.w + 2, inner.h + 2, 'metalDark');
  canvas.hLine(left + 1, top + 1, right - left - 2, 'metalLight');

  canvas.rect(left - 4, bottom, right - left + 8, 5, 'metalLight');
  canvas.hLine(left - 4, bottom + 4, right - left + 8, 'metalDark');
  canvas.stroke(left - 4, bottom, right - left + 8, 5, 'ink');
}

/** Horloge murale. Le cadran est cuit ici, les aiguilles sont vivantes. */
function clockFace(canvas, cx, cy) {
  canvas.disc(cx, cy, 11, 'ink');
  canvas.disc(cx, cy, 10, 'metalLight');
  canvas.disc(cx, cy, 8, 'paper');
  // Quatre index : de quoi lire l'heure sans compter douze graduations.
  canvas.rect(cx - 1, cy - 7, 2, 2, 'inkSoft');
  canvas.rect(cx - 1, cy + 6, 2, 2, 'inkSoft');
  canvas.rect(cx - 7, cy - 1, 2, 2, 'inkSoft');
  canvas.rect(cx + 6, cy - 1, 2, 2, 'inkSoft');
}

/** Affiche encadrée : le seul aplat de couleur franche du mur. */
function poster(canvas, x, y) {
  canvas.rect(x, y, 36, 26, 'ink');
  canvas.rect(x + 2, y + 2, 32, 22, 'paper');
  canvas.rect(x + 5, y + 6, 26, 3, 'coral');
  canvas.rect(x + 5, y + 12, 18, 3, 'teal');
  canvas.rect(x + 5, y + 18, 22, 2, 'paperDim');
  canvas.hLine(x + 2, y + 2, 32, 'paperDim');
}

/** Meuble rectangulaire : matière, arête éclairée, base sombre, contour. */
function slab(canvas, x, y, w, h, body, crest, base) {
  canvas.rect(x, y, w, h, body);
  canvas.hLine(x + 1, y + 1, w - 2, crest);
  canvas.hLine(x + 1, y + h - 2, w - 2, base);
  canvas.stroke(x, y, w, h, 'ink');
}

/** Un poste de travail vu de face : plateau, piètement, ombre portée. */
function desk(canvas, x, w) {
  const top = MENU_LAYOUT.desk;
  slab(canvas, x, top, w, 8, 'woodLight', 'paperDim', 'woodDark');
  // Voile de pudeur : la plaque qui cache les jambes dans tout open space.
  slab(canvas, x + 4, top + 8, w - 8, 20, 'woodMid', 'woodLight', 'woodDark');
  canvas.rect(x + 8, top + 28, 4, 14, 'metalDark');
  canvas.rect(x + w - 12, top + 28, 4, 14, 'metalDark');
  canvas.rect(x + 8, top + 42, w - 16, 2, 'metalDark');
  // L'ombre au sol ancre le meuble ; sans elle, tout flotte.
  canvas.shade(x + 2, top + 44, w - 4, 3, 'ink', 0.3);
}

export function makeMenuRoom() {
  const canvas = new PixelCanvas(W, H);
  const { ceiling, credenza, desk: deskTop, floor } = MENU_LAYOUT;

  // ── plafond et rampe de néons
  canvas.rect(0, 0, W, ceiling, 'navyDark');
  canvas.hLine(0, ceiling - 1, W, 'ink');
  [24, 116].forEach((x) => {
    canvas.rect(x, 4, 56, 3, 'neonTube');
    canvas.rect(x - 1, 3, 58, 1, 'metalDark');
    canvas.rect(x - 2, 7, 60, 2, 'lampGlow', 0.3);
  });

  // ── mur du fond
  canvas.rect(0, ceiling, W, credenza - ceiling, 'menuWall');
  canvas.rect(0, ceiling, W, 5, 'menuWallLit');
  // Le mur s'assombrit vers le sol : la lumière vient de la baie, en hauteur.
  for (let y = MENU_LAYOUT.windowBottom; y < credenza; y += 1) {
    const ratio = (y - MENU_LAYOUT.windowBottom) / (credenza - MENU_LAYOUT.windowBottom);
    canvas.shade(0, y, W, 1, 'ink', ratio * 0.32);
  }
  // Plinthe : une pièce sans plinthe n'a pas de sol, elle a un fond d'écran.
  canvas.rect(0, credenza - 4, W, 4, 'wallDark');

  bayWindow(canvas);
  clockFace(canvas, 24, 122);
  poster(canvas, 150, 108);

  // ── crédence et ce qui traîne dessus
  slab(canvas, -2, credenza, W + 4, 24, 'woodMid', 'woodLight', 'woodDark');
  // Tiroirs : sans refends ni poignées, une crédence est une planche.
  for (let x = 4; x < W - 8; x += 32) {
    canvas.stroke(x, credenza + 5, 30, 16, 'woodDark');
    canvas.rect(x + 11, credenza + 12, 8, 2, 'metalLight');
    canvas.hLine(x + 1, credenza + 6, 28, 'woodLight', 0.5);
  }
  canvas.rect(0, credenza + 24, W, 3, 'ink', 0.24);
  canvas.blit(PRINTER(), 6, credenza - 12);
  canvas.blit(COFFEE(), 40, credenza - 15);
  canvas.blit(CUP(), 66, credenza - 6);
  canvas.blit(PLANT(), 118, credenza - 17);
  canvas.blit(BOXES(), 158, credenza - 11);

  // ── sol
  canvas.rect(0, floor, W, H - floor, 'floorMid');
  for (let y = floor + 8; y < H; y += 16) canvas.hLine(0, y, W, 'floorSeam', 0.35);
  // Rangée du fond, en retrait : plus petite, plus sombre, elle creuse la
  // pièce. Sans elle, la crédence et les bureaux sont collés au même plan.
  [16, 76, 136].forEach((x) => {
    slab(canvas, x, floor + 4, 44, 5, 'woodMid', 'woodLight', 'woodDark');
    slab(canvas, x + 4, floor + 9, 36, 12, 'woodDark', 'woodMid', 'ink');
    // Des écrans, pas des fauteuils : un fauteuil de même taille qu'au premier
    // plan écraserait la perspective qu'on vient de créer.
    slab(canvas, x + 8, floor - 6, 13, 10, 'metalDark', 'metalMid', 'ink');
    slab(canvas, x + 26, floor - 5, 12, 9, 'metalDark', 'metalMid', 'ink');
  });
  canvas.shade(0, floor - 8, W, 42, 'hudInset', 0.3);

  // Flaque du couchant : la baie éclaire le sol, sinon la fenêtre ne sert à
  // rien d'autre qu'à être jolie.
  for (let y = floor; y < floor + 40; y += 1) {
    canvas.shade(24, y, W - 48, 1, 'duskGlow', 0.22 * (1 - (y - floor) / 40));
  }

  canvas.rect(14, deskTop + 62, W - 28, 66, 'carpetAlcove');
  canvas.stroke(14, deskTop + 62, W - 28, 66, 'floorSeam');
  canvas.hLine(18, deskTop + 66, W - 36, 'floorSeam', 0.5);

  // ── la rangée de bureaux : c'est là que la scène pose ce qui bouge
  desk(canvas, 2, 90);
  desk(canvas, 103, 90);
  canvas.blit(CHAIR(), 48, deskTop + 32);
  canvas.blit(CHAIR(), 126, deskTop + 38);

  // ── premier plan : une arête de bureau qui cadre la composition
  canvas.blit(PLANT(), 6, H - 66);
  canvas.blit(BOXES(), 160, H - 60);
  slab(canvas, -6, H - 44, W + 12, 44, 'woodDark', 'woodMid', 'ink');

  // Le bas plonge dans l'ombre : c'est ce qui laisse le regard remonter vers
  // la fenêtre, et ce qui permet au panneau de boutons de s'y poser.
  const shadowTop = deskTop + 44;
  for (let y = shadowTop; y < H; y += 1) {
    const ratio = (y - shadowTop) / (H - shadowTop);
    canvas.shade(0, y, W, 1, 'hudInset', 0.16 + ratio * 0.58);
  }

  // Bain de lumière chaude, puis vignette : la pièce doit avoir une heure.
  canvas.tintAll('duskGlow', 0.07);
  for (let x = 0; x < 16; x += 1) {
    const alpha = (1 - x / 16) * 0.34;
    canvas.shade(x, 0, 1, H, 'hudInset', alpha);
    canvas.shade(W - 1 - x, 0, 1, H, 'hudInset', alpha);
  }

  return canvas;
}

// ────────────────────────── ce qui bouge ────────────────────────────────

/** Hauteur visible d'une personne assise : la tête et le buste, pas plus. */
const BUST_H = 22;

/**
 * Buste d'un rôle du jeu, recadré au-dessus du plateau.
 *
 * On réutilise les personnages existants plutôt que d'en dessiner d'autres :
 * le menu doit montrer les gens qu'on va croiser, pas une autre distribution.
 */
function bust(role, column) {
  const canvas = new PixelCanvas(32, BUST_H);
  canvas.blit(makeCharacterFrame(CHARACTERS[role], 'down', column), 0, 0);
  return canvas;
}

/** Quelqu'un tape : la tête respire, les mains alternent sur le plateau. */
function typistFrame(column, hand) {
  const canvas = bust('char-colleague', column);
  const left = hand === 0 ? BUST_H - 2 : BUST_H - 3;
  const right = hand === 0 ? BUST_H - 3 : BUST_H - 2;
  canvas.rect(9, left, 3, 2, 'skin');
  canvas.rect(20, right, 3, 2, 'skin');
  return canvas;
}

/** Quelqu'un boit : la tasse monte, s'arrête aux lèvres, redescend. */
function sipperFrame(column, lift) {
  const canvas = bust('char-boss', column);
  const y = BUST_H - 4 - lift;
  canvas.rect(19, y, 5, 4, 'paper');
  canvas.rect(19, y, 5, 1, 'paperDim');
  canvas.set(24, y + 1, 'paperDim');
  canvas.set(24, y + 2, 'paperDim');
  canvas.rect(18, y + 4, 7, 1, 'ink');
  return canvas;
}

/** Quelqu'un raconte sa journée, une main en l'air. Le bavard du niveau 1. */
function talkerFrame(column, raise) {
  const canvas = bust('char-talker', column);
  canvas.rect(24, BUST_H - 6 - raise, 3, 3, 'skin');
  canvas.rect(24, BUST_H - 3 - raise, 2, 2, 'coralDark');
  return canvas;
}

/**
 * Contenu d'un écran : des lignes qui défilent, une barre qui se remplit.
 * Volontairement abstrait — un vrai texte serait illisible à cette taille et
 * daterait le jeu.
 */
function screenFrame(step) {
  const canvas = new PixelCanvas(26, 20);
  canvas.rect(0, 0, 26, 17, 'ink');
  canvas.rect(1, 1, 24, 15, 'screen');
  // Lignes de « code » : la même trame décalée d'un cran par frame.
  for (let row = 0; row < 5; row += 1) {
    const width = 4 + ((row * 5 + step * 3) % 14);
    canvas.rect(3, 3 + row * 3, width, 1, row % 2 === 0 ? 'screenGlow' : 'glassDim');
  }
  // Barre de progression : la seule chose qui avance vraiment.
  canvas.rect(3, 13, 20, 2, 'inkSoft');
  canvas.rect(3, 13, 4 + step * 5, 2, 'teal');
  // Pied et lueur projetée.
  canvas.rect(11, 17, 4, 2, 'metalDark');
  canvas.rect(7, 19, 12, 1, 'metalMid');
  return canvas;
}

export const MENU_SHEETS = {
  'menu-typist': () => strip([typistFrame(0, 0), typistFrame(1, 1), typistFrame(0, 1), typistFrame(1, 0)]),
  'menu-sipper': () => strip([sipperFrame(0, 0), sipperFrame(1, 4), sipperFrame(1, 7), sipperFrame(0, 4)]),
  'menu-talker': () => strip([talkerFrame(0, 0), talkerFrame(1, 2), talkerFrame(0, 3), talkerFrame(1, 1)]),
  'menu-screen': () => strip([0, 1, 2, 3].map(screenFrame))
};

export const MENU_STILLS = {
  'menu-room': makeMenuRoom
};
