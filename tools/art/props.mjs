/**
 * Accessoires, objets ramassables et éléments interactifs, en pixel art ASCII.
 *
 * Chaque sprite se lit et se modifie directement ici. La légende relie les
 * caractères à la palette : aucune couleur en dur.
 *
 * Deux familles :
 *  - les sprites FIXES (`PROPS`), une image chacun ;
 *  - les PLANCHES (`PROP_SHEETS`), une bande horizontale de frames, dont
 *    l'animation est déclarée côté jeu dans `src/game/animations.ts`.
 *
 * Les objets ramassables n'ont pas de frames écrites à la main : leur reflet
 * balaie automatiquement le sprite de base (`sheen`). Un objet ajouté demain
 * hérite donc de l'animation sans une ligne de dessin en plus.
 */
import { PixelCanvas, fromRows, padRows, strip } from './canvas.mjs';

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
  u: 'woodLight',
  r: 'alert',
  z: 'stoneLight',
  Z: 'stoneMid',
  v: 'plum',
  V: 'plumDark',
  h: 'carpetStart',
  H: 'carpetStartDark',
  e: 'brass',
  E: 'goldDark',
  q: 'concreteLight',
  Q: 'concreteMid',
  x: 'concreteDark',
  a: 'asphaltLight',
  A: 'asphaltDark',
  f: 'paintLine',
  N: 'neonTube',
  U: 'rubber',
  j: 'marbleLight',
  J: 'marbleMid',
  // ── V0.11 : teintes des planches d'assets fournies.
  F: 'sofaNavy',
  '~': 'sofaNavyLight',
  '1': 'glassPane',
  '2': 'glassFrame',
  '3': 'lockerBlue',
  '4': 'lockerBlueDark',
  '5': 'server',
  '6': 'serverLed',
  '7': 'signGreen',
  '8': 'signGreenDark',
  '9': 'hazard',
  '0': 'hazardDark',
  '#': 'kitchenTile',
  '@': 'carpetBlue',
  '%': 'stateOk',
  '+': 'info'
};

/** Cadre commun des objets ramassables et des planches, en pixels d'art. */
export const ITEM_FRAME = 16;

/** Cadre commun des décors animés : plus large, pour le néon et l'imprimante. */
export const LIVING_FRAME = 24;

function sprite(width, rows) {
  return fromRows(padRows(rows, width), L);
}

// ───────────────────────── postes de travail ────────────────────────────

/** Tasse : petite tache chaude qui casse la monotonie des bureaux. */
const MUG = () =>
  sprite(12, [
    '..KKKKKK',
    '.KwwwwwwK',
    'KwCCCCCCwK',
    'KwCOOOOCwKKK',
    'KwCOOOOCwK.K',
    'KwCCCCCCwKKK',
    '.KwwwwwwK',
    '..KKKKKK'
  ]);

/** Post-it : le seul objet du jeu qui a le droit d'être bâclé. */
const STICKY = () =>
  sprite(14, [
    'KKKKKK',
    'KhhhhK.KKKKK',
    'KhHhhK.KttttK',
    'KhhhhKKKtTTtK',
    'KKKKKKKKttttK',
    '.....KKKKKKKK'
  ]);

/** Plante verte : la touche chaleureuse du décor. */
const PLANT = () =>
  sprite(16, [
    '.......K',
    '..KKK.KLK.KKK',
    '.KlllKKLKKlllK',
    'KllLllLLLllLllK',
    'KlLllLLLLLllLlK',
    '.KllLLLLLLLllK',
    '..KKlLLLLLlKK',
    '....KKLLLKK',
    '......KLK',
    '.....KKLKK',
    '....KpppppK',
    '....KpPwPpK',
    '....KpPPPpK',
    '.....KPPPK',
    '.....KKKKK'
  ]);

/** Chaise de bureau vue de dessus, avec ses accoudoirs. */
const CHAIR = () =>
  sprite(14, [
    '..KKKKKKKK',
    '.KttttttttK',
    'KtTTTTTTTTtK',
    'KtTTTTTTTTtK',
    'KtTTTTTTTTtK',
    '.KttttttttK',
    '..KKKKKKKK',
    'KK.KmmmmK.KK',
    'KmK.KmmK.KmK',
    'KKK.KmmK.KKK',
    '....KKKK'
  ]);

/** Caméra de surveillance, vue de dessus (niveau 2). */
const CAMERA = () =>
  sprite(16, [
    '.....KKKK',
    '.....KmmK',
    '..KKKKmmKKKK',
    '.KmMMMMMMMMmK',
    'KmMMMMMMMMMMmKK',
    'KmMrMMMMMMMMmKKK',
    'KmMMMMMMMMMMmKK',
    '.KmmmmmmmmmmK',
    '..KKKKKKKKKK'
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

// ──────────────────────────── sanitaires ────────────────────────────────

/**
 * Cuvette vue de dessus : abattant ovale, réservoir derrière.
 * Deux formes suffisent — à cette taille, c'est la silhouette qui parle.
 */
const TOILET = () =>
  sprite(12, [
    '.KKKKKKKK',
    '.KwWWWWwK',
    '.KwwwwwwK',
    '.KKKKKKKK',
    '..KwwwwK',
    '.KwwwwwwK',
    'KwwKKKKwwK',
    'KwKGGGGKwK',
    'KwKGGGGKwK',
    'KwwKKKKwwK',
    '.KwwwwwwK',
    '..KKKKKK'
  ]);

/** Lavabo et son miroir : l'autre moitié de la lecture « toilettes ». */
const SINK = () =>
  sprite(14, [
    'KKKKKKKKKKKK',
    'KggggggggggK',
    'KgMMMMMMMMgK',
    'KggggggggggK',
    'KKKKKKKKKKKK',
    '..KKKKKKKK',
    '.KwwwwwwwwK',
    'KwwKKKKKKwwK',
    'KwKGGGGGGKwK',
    'KwwKKnnKKwwK',
    '.KwwwwwwwwK',
    '..KKKKKKKK'
  ]);

/** Fauteuil de direction : plus large et plus sombre qu'une chaise d'open space. */
const ARMCHAIR = () =>
  sprite(16, [
    '.KKKKKKKKKKKK',
    'KeVVVVVVVVVVeK',
    'KeVvvvvvvvvVeK',
    'KeVvvvvvvvvVeK',
    'KeVvvvvvvvvVeK',
    'KeVVVVVVVVVVeK',
    '.KKKKKKKKKKKK',
    '..KeeeeeeeeK',
    '..KK.KeeK.KK',
    '...K.KeeK.K',
    '.....KKKK'
  ]);

/** Cadre accroché : le portrait obligatoire du fondateur. */
const FRAME = () =>
  sprite(16, [
    'KKKKKKKKKKKKKK',
    'KeeeeeeeeeeeeK',
    'KeKKKKKKKKKKeK',
    'KeKjjjjjjjjKeK',
    'KeKjJJvvJJjKeK',
    'KeKjJvvvvJjKeK',
    'KeKjjjjjjjjKeK',
    'KeKKKKKKKKKKeK',
    'KeeeeeeeeeeeeK',
    'KKKKKKKKKKKKKK'
  ]);

/** Plot de chantier : le seul objet orange autorisé, et il est utile. */
const CONE = () =>
  sprite(12, [
    '...KKK',
    '...KcK',
    '..KcCcK',
    '..KcCcK',
    '.KcCCCcK',
    '.KcwwwcK',
    'KcCCCCCcK',
    'KcccccccK',
    'KKKKKKKKK'
  ]);

const DONUT = () =>
  sprite(16, [
    '.....KKKKKK',
    '...KKiiiiiiKK',
    '..KiiiIIIIiiiK',
    '.KiiIII..IIIiiK',
    '.KiiII....IIiiK',
    'KiiII......IIiiK',
    'KiIII......IIIiK',
    'KdII........IIdK',
    'KdDI........IDdK',
    'KddII......IIddK',
    '.KddII....IIddK',
    '.KdddII..IIdddK',
    '..KdddDDDDdddK',
    '...KKdddddDKK',
    '.....KKKKKK'
  ]);

const COFFEE = () =>
  sprite(16, [
    '...KKKKKKKKK',
    '..KwwwwwwwwwK',
    '..KwOOOOOOOwKKK',
    '..KwOuuuuuOwK.K',
    '..KwwwwwwwwwK.K',
    '..KwWWWWWWWwKK',
    '..KwWcccccWwK',
    '..KwWcWWWcWwK',
    '..KwWWWWWWWwK',
    '...KwWWWWWwK',
    '...KwwwwwwwK',
    '....KKKKKKK'
  ]);

const BADGE = () =>
  sprite(16, [
    '......KK',
    '......Kk',
    '..KKKKKKKKKK',
    '..KwwwwwwwwK',
    '..KwKKKKwwwK',
    '..KwKbbKwWwK',
    '..KwKbbKwwwK',
    '..KwKKKKwWwK',
    '..KwWWWWWWwK',
    '..KwwwwwwwwK',
    '..KwyyyywwwK',
    '..KwwwwwwwwK',
    '..KKKKKKKKKK'
  ]);

const REPORT = () =>
  sprite(16, [
    '..KKKKKKKKKKr',
    '..KwwwwwwwwKrr',
    '..KwWWWWWWwKKK',
    '..KwwwwwwwwwwK',
    '..KwWWWWWWWWwK',
    '..KwwwwwwwwwwK',
    '..KwWWWWWWwwwK',
    '..KwwwwwwwwwwK',
    '..KwWWWWWWWWwK',
    '..KwwwwwwwwwwK',
    '..KwWWWWwwwwwK',
    '..KKKKKKKKKKKK'
  ]);

// ────────────────────────────── planches ────────────────────────────────

/**
 * Idle d'objet ramassable : un reflet diagonal balaie le sprite.
 * Généré, jamais dessiné : tout objet ajouté plus tard aura la même vie.
 */
function shineSheet(make) {
  // Cadre commun de 16×16 : TOUS les objets ramassables partagent la même
  // taille de frame, quelle que soit la silhouette dessinée. Sans ça, chaque
  // objet imposerait sa propre déclaration de planche côté jeu.
  const drawn = make();
  const base = new PixelCanvas(ITEM_FRAME, ITEM_FRAME).blit(
    drawn,
    Math.floor((ITEM_FRAME - drawn.width) / 2),
    Math.floor((ITEM_FRAME - drawn.height) / 2)
  );
  const span = base.width + base.height;
  return strip(
    [0, 1, 2, 3].map((step) => {
      const frame = base.clone();
      // La quatrième frame laisse l'objet au repos : sans respiration, un
      // scintillement continu finit par fatiguer l'œil.
      if (step < 3) frame.sheen(Math.round((span * step) / 3) - 4, 'paper', 0.45, 3);
      return frame;
    })
  );
}

/**
 * Porte : quatre états d'ouverture. Le battant se replie vers la gauche et
 * découvre l'embrasure — la collision, elle, disparaît d'un coup côté jeu.
 */
function doorFrame(step) {
  const canvas = new PixelCanvas(16, 16);
  const panel = 12 - step * 4;
  // Embrasure toujours visible : c'est elle qui reste quand la porte est ouverte.
  canvas.stroke(1, 0, 14, 16, 'ink');
  canvas.rect(2, 1, 12, 14, 'inkSoft');
  if (panel <= 0) return canvas;

  canvas.rect(2, 1, panel, 14, 'tealDark');
  canvas.rect(3, 2, Math.max(0, panel - 2), 12, 'teal');
  canvas.stroke(2, 1, panel, 14, 'ink');
  if (panel >= 8) {
    canvas.stroke(4, 3, panel - 4, 5, 'ink');
    canvas.rect(5, 4, panel - 6, 3, 'glass');
    canvas.set(panel - 1, 10, 'gold');
    canvas.set(panel - 1, 11, 'goldDark');
  }
  return canvas;
}

/**
 * Vie de fond : deux frames, une variation d'un ou deux pixels.
 * Une lueur qui bouge suffit à faire croire qu'un bureau tourne encore ;
 * au-delà, ça devient un clignotant et ça vole l'attention aux cônes.
 */
function livingSheet(make, animate) {
  // Cadre commun : toutes les planches « vivantes » partagent une frame de
  // 24×24, quelle que soit la silhouette. Sans ça, chaque décor animé
  // imposerait sa propre taille de découpe côté jeu.
  const drawn = make();
  const base = new PixelCanvas(LIVING_FRAME, LIVING_FRAME).blit(
    drawn,
    Math.floor((LIVING_FRAME - drawn.width) / 2),
    Math.floor((LIVING_FRAME - drawn.height) / 2)
  );
  const lit = base.clone();
  animate(lit);
  return strip([base, lit]);
}

/** Néon de parking : un tube au plafond, jamais tout à fait stable. */
const NEON = () =>
  sprite(24, [
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KQQQQQQQQQQQQQQQQQQQQQQK',
    'KQNNNNNNNNNNNNNNNNNNNNQK',
    'KQNNNNNNNNNNNNNNNNNNNNQK',
    'KQQQQQQQQQQQQQQQQQQQQQQK',
    'KKKKKKKKKKKKKKKKKKKKKKKK'
  ]);

// ───────────────────── V0.11 : d'après les planches fournies ─────────────

/** Tableau blanc sur pied : la salle de réunion se reconnaît à ça. */
const WHITEBOARD = () =>
  sprite(20, [
    'KKKKKKKKKKKKKKKKKKKK',
    'KwwwwwwwwwwwwwwwwwwK',
    'KwwccwwwwwwwttwwwwwK',
    'KwwwwwwwwwwwwwwwwwwK',
    'KwwwwtttwwwwwwccwwwK',
    'KwwwwwwwwwwwwwwwwwwK',
    'KWWWWWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKKKKKK',
    '..KnK..........KnK'
  ]);

/** Baie de serveurs : diodes vertes, câbles, souffle de ventilation. */
const SERVER = () =>
  sprite(14, [
    'KKKKKKKKKKKKKK',
    'K5555555555555K'.slice(0, 14),
    'K5666555566655K'.slice(0, 14),
    'K5555555555555K'.slice(0, 14),
    'K5665556665555K'.slice(0, 14),
    'K5555555555555K'.slice(0, 14),
    'K5556665556665K'.slice(0, 14),
    'K5555555555555K'.slice(0, 14),
    'KnnnnnnnnnnnnK'
  ]);

/** Distributeur : la vitrine éclairée d'un couloir désert. */
const VENDING = () =>
  sprite(14, [
    'KKKKKKKKKKKKKK',
    'KnnnnnnnnnnnnK',
    'KnKcKyKtKbKnnK',
    'KnKcKyKtKbKnnK',
    'KnKKKKKKKKKnnK',
    'KnKdKiKcKyKnnK',
    'KnKdKiKcKyKnnK',
    'KnKKKKKKKKKn%K',
    'KnnnnnnnnnnnnK',
    'KKKKKKKKKKKKKK'
  ]);

/** Lecteur de badge mural : diode verte quand la porte cède. */
const READER = () =>
  sprite(8, ['.KKKK.', 'KnnnnK', 'Kn%%nK', 'KnnnnK', 'KnwwnK', 'KnnnnK', '.KKKK.']);

// Note V0.11.1 : la tasse, le bloc de notes et la chaise ne sont plus générés
// ici — ils sont FOURNIS et transportés par `tools/assets/import.mjs`.
//
// V0.12 — inventaire resserré. Un seul accessoire par FONCTION de pièce : le
// distributeur dit « coin pause », le WC dit « toilettes », la baie dit
// « local technique ». Les micro-props décoratifs (cadres, vases, trophées,
// vélos, pneus, cartons…) ont été retirés : ils multipliaient les assets sans
// rien ajouter à la lecture d'un niveau.
export const PROPS = {
  'prop-plant': PLANT,
  'prop-toilet': TOILET,
  'prop-sink': SINK,
  'prop-whiteboard': WHITEBOARD,
  'prop-vending': VENDING,
  'prop-server': SERVER,
  'prop-reader': READER,
  'prop-cone': CONE,
  'prop-exit-sign': EXIT_SIGN
};

/**
 * Sprites encore dessinés ici mais qui ne sont PLUS livrés comme assets de
 * jeu : ils servent uniquement aux vignettes du menu et au diorama d'accueil,
 * où le style généré reste cohérent avec le reste de l'écran.
 */
export const MENU_PARTS = { mug: MUG, sticky: STICKY, chair: CHAIR, armchair: ARMCHAIR, frame: FRAME };

export const PROP_SHEETS = {
  'prop-door': () => strip([0, 1, 2, 3].map(doorFrame)),
  // Caméra : sa diode d'enregistrement bat lentement.
  'prop-camera': () => livingSheet(CAMERA, (c) => c.rect(7, 13, 2, 1, 'alert', 0.3)),
  // Néon : une frange s'éteint. C'est ce qui rend un parking inquiétant.
  'prop-neon': () => livingSheet(NEON, (c) => c.rect(2, 11, 12, 2, 'neonDim')),
  'item-donut': () => shineSheet(DONUT),
  'item-coffee': () => shineSheet(COFFEE),
  'item-badge': () => shineSheet(BADGE),
  'item-report': () => shineSheet(REPORT)
};

export { PixelCanvas };
