/**
 * Accessoires et objets, en pixel art ASCII.
 *
 * Chaque sprite se lit et se modifie directement ici. La légende relie les
 * caractères à la palette : aucune couleur en dur.
 */
import { PixelCanvas, fromRows, padRows } from './canvas.mjs';

const L = {
  '.': null,
  K: 'ink',
  k: 'inkSoft',
  w: 'paper',
  W: 'paperDim',
  g: 'glass',
  G: 'glassDim',
  s: 'screen',
  S: 'screenGlow',
  m: 'metalMid',
  M: 'metalLight',
  n: 'metalDark',
  d: 'dough',
  D: 'doughDark',
  i: 'icing',
  I: 'icingDark',
  c: 'coral',
  C: 'coralDark',
  t: 'teal',
  T: 'tealDark',
  b: 'blue',
  B: 'blueDark',
  y: 'gold',
  Y: 'goldDark',
  l: 'leaf',
  L: 'leafDark',
  p: 'pot',
  P: 'potDark',
  o: 'woodMid',
  O: 'woodDark',
  r: 'alert',
  z: 'stoneLight'
};

function sprite(width, rows) {
  return fromRows(padRows(rows, width), L);
}

/** Écran + clavier, posés sur un bureau. */
const SCREEN = () =>
  sprite(16, [
    '..KKKKKKKKKKKK..',
    '..KssssssssssK..',
    '..KsSSSSSSSSsK..',
    '..KsSssssssSsK..',
    '..KsSsSSSSsSsK..',
    '..KsSssssssSsK..',
    '..KsSSSSSSSSsK..',
    '..KssssssssssK..',
    '..KKKKKKKKKKKK..',
    '.....KnnnnK.....',
    '...KKKKKKKKKK...',
    '...KMMMMMMMMK...',
    '...KMnMnMnMnK...',
    '...KKKKKKKKKK...'
  ]);

/** Tasse : petite tache chaude qui casse la monotonie des bureaux. */
const MUG = () =>
  sprite(11, [
    '..KKKKKK.',
    '.KwwwwwwK',
    'KwCCCCCCwK',
    'KwCCCCCCwKK',
    'KwwwwwwwwKK',
    'KwwwwwwwwK',
    '.KwwwwwwK',
    '..KKKKKK'
  ]);

/** Pile de dossiers. */
const FOLDER = () =>
  sprite(12, [
    '.KKKKKKKKKK.',
    'KyyyyyyyyyyK',
    'KyYYYYYYYYyK',
    'KKKKKKKKKKKK',
    'KwwwwwwwwwwK',
    'KwWWWWWWWWwK',
    'KKKKKKKKKKKK'
  ]);

/** Plante verte : la touche chaleureuse du décor. */
const PLANT = () =>
  sprite(16, [
    '.......K........',
    '..KKK.KLK.KKK...',
    '.KlllKKLKKlllK..',
    'KllLllLLLllLllK.',
    'KlLllLLLLLllLlK.',
    '.KllLLLLLLLllK..',
    '..KKlLLLLLlKK...',
    '....KKLLLKK.....',
    '......KLK.......',
    '.....KKLKK......',
    '....KpppppK.....',
    '....KpPPPpK.....',
    '....KpPPPpK.....',
    '.....KPPPK......',
    '.....KKKKK......'
  ]);

/** Chaise de bureau vue de dessus. */
const CHAIR = () =>
  sprite(12, [
    '..KKKKKKKK..',
    '.KttttttttK.',
    'KtTTTTTTTTtK',
    'KtTTTTTTTTtK',
    '.KttttttttK.',
    '..KKKKKKKK..',
    '...KmmmmK...',
    '..KKmmmmKK..',
    '.KmK.KK.KmK.',
    '.KK...K..KK.'
  ]);

/** Porte des WC : battant turquoise, poignée dorée, panneau vitré. */
const DOOR = () =>
  sprite(12, [
    'KKKKKKKKKKKK',
    'KTTTTTTTTTTK',
    'KTttttttttTK',
    'KTtKKKKKKtTK',
    'KTtKggggKtTK',
    'KTtKggggKtTK',
    'KTtKGGGGKtTK',
    'KTtKKKKKKtTK',
    'KTttttttttTK',
    'KTttttttttTK',
    'KTtttttyKtTK',
    'KTttttttttTK',
    'KTttttttttTK',
    'KTTTTTTTTTTK',
    'KKKKKKKKKKKK'
  ]);

/** Caméra de surveillance, vue de dessus (niveau 2). */
const CAMERA = () =>
  sprite(16, [
    '.....KKKK.......',
    '.....KmmK.......',
    '..KKKKmmKKKK....',
    '.KmMMMMMMMMmK...',
    'KmMMMMMMMMMMmKK.',
    'KmMrMMMMMMMMmKKK',
    'KmMMMMMMMMMMmKK.',
    '.KmmmmmmmmmmK...',
    '..KKKKKKKKKK....'
  ]);

/** Panneau de sortie lumineux, accroché au mur du fond. */
const EXIT_SIGN = () =>
  sprite(20, [
    'KKKKKKKKKKKKKKKKKKKK',
    'KllllllllllllllllllK',
    'KlwwwLwwwwLwwwwLwwlK',
    'KlwLLLLLwLLLLwLLLLwK',
    'KlwwwLwwwwLwwwwLwwlK',
    'KllllllllllllllllllK',
    'KKKKKKKKKKKKKKKKKKKK'
  ]);

// ─────────────────────────────── objets ────────────────────────────────

const DONUT = () =>
  sprite(16, [
    '.....KKKKKK.....',
    '...KKiiiiiiKK...',
    '..KiiiIIIIiiiK..',
    '.KiiIII..IIIiiK.',
    '.KiiII....IIiiK.',
    'KiiII......IIiiK',
    'KiIII......IIIiK',
    'KdII........IIdK',
    'KdDI........IDdK',
    'KddII......IIddK',
    '.KddII....IIddK.',
    '.KdddII..IIdddK.',
    '..KdddDDDDdddK..',
    '...KKdddddDKK...',
    '.....KKKKKK.....'
  ]);

const COFFEE = () =>
  sprite(16, [
    '...KKKKKKKKK....',
    '..KwwwwwwwwwK...',
    '..KwOOOOOOOwKKK.',
    '..KwOOOOOOOwK.K.',
    '..KwwwwwwwwwK.K.',
    '..KwWWWWWWWwKK..',
    '..KwWWWWWWWwK...',
    '..KwWWWWWWWwK...',
    '..KwWWWWWWWwK...',
    '...KwWWWWWwK....',
    '...KwwwwwwwK....',
    '....KKKKKKK.....'
  ]);

const BADGE = () =>
  sprite(16, [
    '......KK........',
    '......Kk........',
    '..KKKKKKKKKK....',
    '..KwwwwwwwwK....',
    '..KwKKKKwwwK....',
    '..KwKbbKwwwK....',
    '..KwKbbKwwwK....',
    '..KwKKKKwwwK....',
    '..KwWWWWWWwK....',
    '..KwwwwwwwwK....',
    '..KwWWWWwwwK....',
    '..KwwwwwwwwK....',
    '..KKKKKKKKKK....'
  ]);

const REPORT = () =>
  sprite(16, [
    '..KKKKKKKKKKr...',
    '..KwwwwwwwwKrr..',
    '..KwWWWWWWwKKK..',
    '..KwwwwwwwwwwK..',
    '..KwWWWWWWWWwK..',
    '..KwwwwwwwwwwK..',
    '..KwWWWWWWwwwK..',
    '..KwwwwwwwwwwK..',
    '..KwWWWWWWWWwK..',
    '..KwwwwwwwwwwK..',
    '..KwWWWWwwwwwK..',
    '..KKKKKKKKKKKK..'
  ]);

export const PROPS = {
  'prop-screen': SCREEN,
  'prop-mug': MUG,
  'prop-folder': FOLDER,
  'prop-plant': PLANT,
  'prop-chair': CHAIR,
  'prop-door': DOOR,
  'prop-camera': CAMERA,
  'prop-exit-sign': EXIT_SIGN,
  'item-donut': DONUT,
  'item-coffee': COFFEE,
  'item-badge': BADGE,
  'item-report': REPORT
};

export { PixelCanvas };
