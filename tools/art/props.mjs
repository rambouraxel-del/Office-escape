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
  J: 'marbleMid'
};

/** Cadre commun des objets ramassables et des planches, en pixels d'art. */
export const ITEM_FRAME = 16;

/** Cadre commun des décors animés : plus large, pour le néon et l'imprimante. */
export const LIVING_FRAME = 24;

function sprite(width, rows) {
  return fromRows(padRows(rows, width), L);
}

// ───────────────────────── postes de travail ────────────────────────────

/** Écran + clavier : le poste de travail, vu de dessus. */
const SCREEN = () =>
  sprite(16, [
    '..KKKKKKKKKKKK',
    '..KssssssssssK',
    '..KsSSSSSSSSsK',
    '..KsSssssssSsK',
    '..KsSsSSSSsSsK',
    '..KsSssssssSsK',
    '..KsSSSSSSSSsK',
    '..KssssssssssK',
    '..KKKKKKKKKKKK',
    '.KyK.KnnnnK.',
    'KyyKKKKKKKKKK',
    'KyyKMMMMMMMMK',
    '.KKKMnMnMnMnK',
    '...KKKKKKKKKK'
  ]);

/** Clavier seul : pour habiller un second poste sans répéter l'écran. */
const KEYBOARD = () =>
  sprite(14, [
    'KKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMK',
    'KMnMnMnMnMnMMK',
    'KMnMnMnMnMnMMK',
    'KMMMnnnnnMMMMK',
    'KKKKKKKKKKKKKK'
  ]);

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

/** Pile de dossiers, avec son trombone. */
const FOLDER = () =>
  sprite(12, [
    '.KKKKKKKKKK',
    'KyyyyyyyyyyK',
    'KyYYYYYYYYyK',
    'KKKKKKKKKKKK',
    'KwwwwwwwwwwK',
    'KwWWnnWWWWwK',
    'KKKKnnKKKKKK'
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

/** Téléphone de bureau. */
const PHONE = () =>
  sprite(14, [
    '.KKKKKKKKKKK',
    'KKnnnnnnnnnKK',
    'KnKKKKKKKKKnK',
    'KnKZZZZZZZKnK',
    'KKKKKKKKKKKKK',
    'KZZKKKKKKKZZK',
    'KZZZZZZZZZZZK',
    'KKKKKKKKKKKKK'
  ]);

/** Lampe d'architecte, vue de dessus : le cône de lumière est un disque. */
const LAMP = () =>
  sprite(14, [
    '....KKKK',
    '...KyyyyK',
    '..KyywwyyK',
    '..KyywwyyK',
    '...KyyyyK',
    '....KKKK',
    '.....KnK',
    '....KnnnK',
    '...KZZZZZK',
    '...KKKKKKK'
  ]);

// ─────────────────────────── meubles et plantes ─────────────────────────

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

/** Cactus : la plante de celui qui oublie d'arroser. */
const CACTUS = () =>
  sprite(12, [
    '....KK',
    '...KllK',
    '.K.KlLlK.K',
    'KlKKlLlKKlK',
    'KlLKlLlKLlK',
    'KlLllLLlllLK',
    '.KlLLLLLLlK',
    '..KKlLLlKK',
    '...KpppppK',
    '...KpPPPpK',
    '....KKKKK'
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

/** Poubelle de bureau : le détail qui fait « lieu vécu ». */
const TRASH = () =>
  sprite(12, [
    '..KKKKKK',
    '.KwWwWwWK',
    'KmMMMMMMmK',
    'KmMnnnnMmK',
    'KmMMMMMMmK',
    'KmMnnnnMmK',
    'KmMMMMMMmK',
    '.KmmmmmmK',
    '..KKKKKK'
  ]);

/** Fontaine à eau : sa bonbonne bleue se repère de loin. */
const COOLER = () =>
  sprite(14, [
    '...KKKKKK',
    '..KgggggggK',
    '.KgbbbbbbbgK',
    '.KgbBBBBBbgK',
    '.KgbBBBBBbgK',
    '.KgbbbbbbbgK',
    '..KgggggggK',
    '..KMMMMMMMK',
    '.KMMMMMMMMMK',
    '.KMMnnnnnMMK',
    '.KMMMMMMMMMK',
    '.KKKKKKKKKKK'
  ]);

/** Imprimante : le seul appareil du bureau qui ne marche jamais. */
const PRINTER = () =>
  sprite(18, [
    '..KKKKKKKKKKKKK',
    '.KMMMMMMMMMMMMMK',
    'KMMwwwwwwwwwwMMMK',
    'KMMwWWWWWWWWwMMMK',
    'KMMwwwwwwwwwwMMMK',
    'KMMMMMMMMMMMMMMMK',
    'KMMnnnnnnnnnnMcMK',
    'KMMMMMMMMMMMMMMMK',
    'KMMMMMMMMMMMMMMMK',
    '.KMMMMMMMMMMMMMK',
    '..KKKKKKKKKKKKK'
  ]);

/** Cartons de déménagement : quelqu'un est parti avant toi. */
const BOXES = () =>
  sprite(16, [
    '.KKKKKKKKK',
    '.KoooooooK',
    '.KoOOoOOooK.KKKK',
    '.KoooooooK.KoooK',
    '.KoOOOOOoKKKoOoK',
    '.KoooooooKKKoooK',
    '.KKKKKKKKKKKKKKK',
    'KooooooooooooooK',
    'KoOOOOoOOOOoOOoK',
    'KooooooooooooooK',
    'KKKKKKKKKKKKKKKK'
  ]);

/** Petite bibliothèque de classeurs, posée au sol. */
const BOOKS = () =>
  sprite(14, [
    'KKKKKKKKKKKKKK',
    'KcCbBvVyYtTcCK',
    'KcCbBvVyYtTcCK',
    'KcCbBvVyYtTcCK',
    'KKKKKKKKKKKKKK',
    'KOOOOOOOOOOOOK',
    'KKKKKKKKKKKKKK'
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

/** Séparation de cabine, vue de dessus : une cloison et son montant. */
const STALL = () =>
  sprite(20, [
    'KKKKKKKKKKKKKKKKKKKK',
    'KMMMMMMMMMMMMMMMMMMK',
    'KMnnnnnnnnnnnnnnnnMK',
    'KMMMMMMMMMMMMMMMMMMK',
    'KKKKKKKKKKKKKKKKKKKK'
  ]);

// ────────────────────── étage direction (niveau 2) ──────────────────────

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

/** Trophée : la récompense d'un séminaire dont personne ne se souvient. */
const AWARD = () =>
  sprite(12, [
    '.KeeeeeeK',
    'KeEEEEEEeK',
    'KeEeeeeEeK',
    'KKeEEEEeKK',
    '..KeeeeK',
    '...KeeK',
    '..KeeeeK',
    '.KKKKKKKK',
    '.KOOOOOOK',
    '.KKKKKKKK'
  ]);

/** Vase design, posé sur rien de précis. */
const VASE = () =>
  sprite(12, [
    '..K.KlK.K',
    '.KlKKLKKlK',
    'KlLKlLlKLlK',
    '.KlLLLLLlK',
    '..KKLLLKK',
    '...KjjjK',
    '..KjJJJjK',
    '..KjJJJjK',
    '..KjjjjjK',
    '...KKKKK'
  ]);

/** Machine à café de couloir : le vrai centre névralgique de l'étage. */
const COFFEE_MACHINE = () =>
  sprite(14, [
    '.KKKKKKKKKK',
    'KnnnnnnnnnnK',
    'KnMMMMMMMMnK',
    'KnMssssssMnK',
    'KnMsSSSSsMnK',
    'KnMssssssMnK',
    'KnMMMMMMMMnK',
    'KnnKwwwwKnnK',
    'KnnKwWWwKnnK',
    'KnnnnnnnnnnK',
    'KnnEnnnnnnnK',
    '.KKKKKKKKKK'
  ]);

// ─────────────────────────── parking (niveau 3) ─────────────────────────

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

/** Barrière de sécurité, vue de dessus. */
const BARRIER = () =>
  sprite(20, [
    'KKKKKKKKKKKKKKKKKKKK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KqfffQQfffQQfffQQffK',
    'KqqqqqqqqqqqqqqqqqqK',
    'KKKKKKKKKKKKKKKKKKKK',
    '.KQK..........KQK',
    '.KQK..........KQK',
    'KKQKK........KKQKK'
  ]);

/** Extincteur mural : rouge, mais franchement plus sombre qu'une alerte. */
const EXTINGUISHER = () =>
  sprite(10, [
    '..KKK',
    '..KnK',
    '.KKKKK',
    'KCCCCCK',
    'KCcccCK',
    'KCcccCK',
    'KCcccCK',
    'KCCCCCK',
    'KKKKKKK'
  ]);

/** Vélo attaché à un poteau depuis un temps certain. */
const BIKE = () =>
  sprite(18, [
    '...KKK.....KKK',
    '..KUUUK...KUUUK',
    '.KUKKKUK.KUKKKUK',
    'KUKQQQKUKUKQQQKUK',
    'KUKQnQKUKUKQnQKUK',
    'KUKKKKUKKUKKKKUK',
    '.KUUUKKtKKUUUK',
    '..KKK.KtK.KKK'
  ]);

/** Chariot de ménage abandonné en plein passage. */
const CART = () =>
  sprite(16, [
    '.KKKKKKKKKKKK',
    'KMMMMMMMMMMMMK',
    'KMbbbbMMccccMK',
    'KMbBBbMMcCCcMK',
    'KMbbbbMMccccMK',
    'KMMMMMMMMMMMMK',
    'KKKKKKKKKKKKKK',
    '.KnK......KnK',
    '.KUK......KUK'
  ]);

/** Caisse en bois : le décor le plus universel du jeu vidéo. */
const CRATE = () =>
  sprite(14, [
    'KKKKKKKKKKKKKK',
    'KoOooooooooOoK',
    'KOOKKKKKKKKOOK',
    'KoKuuuuuuuuKoK',
    'KoKuOOOOOOuKoK',
    'KoKuuuuuuuuKoK',
    'KOOKKKKKKKKOOK',
    'KoOooooooooOoK',
    'KKKKKKKKKKKKKK'
  ]);

/** Pile de pneus, oubliée près d'un pilier. */
const TIRE = () =>
  sprite(14, [
    '..KKKKKKKK',
    '.KUUUUUUUUK',
    'KUUKKKKKKUUK',
    'KUKQQQQQQKUK',
    'KUKQxxxxQKUK',
    'KUKQQQQQQKUK',
    'KUUKKKKKKUUK',
    '.KUUUUUUUUK',
    '..KKKKKKKK'
  ]);

/** Panneau « P » et sa flèche : la signalétique du parking. */
const PARKING_SIGN = () =>
  sprite(14, [
    'KKKKKKKKKKKK',
    'KbbbbbbbbbbK',
    'KbfffffffbbK',
    'KbfKKKKfbbbK',
    'KbfKffKfbbbK',
    'KbfKKKKfbbbK',
    'KbfKbbbbbbbK',
    'KbfKbbbbbbbK',
    'KbbbbbbbbbbK',
    'KKKKKKKKKKKK',
    '...KQQK',
    '...KQQK',
    '..KKQQKK'
  ]);

// ───────────────────────────── objets ramassables ────────────────────────

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

export const PROPS = {
  'prop-keyboard': KEYBOARD,
  'prop-mug': MUG,
  'prop-folder': FOLDER,
  'prop-sticky': STICKY,
  'prop-phone': PHONE,
  'prop-lamp': LAMP,
  'prop-plant': PLANT,
  'prop-toilet': TOILET,
  'prop-sink': SINK,
  'prop-stall': STALL,
  'prop-armchair': ARMCHAIR,
  'prop-frame': FRAME,
  'prop-award': AWARD,
  'prop-vase': VASE,
  'prop-cone': CONE,
  'prop-barrier': BARRIER,
  'prop-extinguisher': EXTINGUISHER,
  'prop-bike': BIKE,
  'prop-cart': CART,
  'prop-crate': CRATE,
  'prop-tire': TIRE,
  'prop-parking-sign': PARKING_SIGN,
  'prop-cactus': CACTUS,
  'prop-chair': CHAIR,
  'prop-trash': TRASH,
  'prop-boxes': BOXES,
  'prop-books': BOOKS,
  'prop-exit-sign': EXIT_SIGN
};

/**
 * Image fixe des décors animés : le menu et les vignettes composent des PNG
 * statiques, ils ne peuvent pas blitter une planche.
 */
export const STILLS = {
  'prop-screen': SCREEN,
  'prop-printer': PRINTER,
  'prop-cooler': COOLER,
  'prop-camera': CAMERA,
  'prop-neon': NEON,
  'prop-machine': COFFEE_MACHINE
};

export const PROP_SHEETS = {
  'prop-door': () => strip([0, 1, 2, 3].map(doorFrame)),
  // Écran : la lueur interne monte d'un cran, rien de plus.
  'prop-screen': () => livingSheet(SCREEN, (c) => c.rect(9, 8, 6, 4, 'screenGlow', 0.85)),
  // Imprimante : la diode passe du rouge au vert, comme toute imprimante ment.
  'prop-printer': () => livingSheet(PRINTER, (c) => c.rect(17, 13, 2, 1, 'leaf')),
  // Fontaine : une bulle remonte dans la bonbonne.
  'prop-cooler': () => livingSheet(COOLER, (c) => c.rect(11, 9, 2, 2, 'glass')),
  // Caméra : sa diode d'enregistrement bat lentement.
  'prop-camera': () => livingSheet(CAMERA, (c) => c.rect(7, 13, 2, 1, 'alert', 0.3)),
  // Néon : une frange s'éteint. C'est ce qui rend un parking inquiétant.
  'prop-neon': () => livingSheet(NEON, (c) => c.rect(2, 11, 12, 2, 'neonDim')),
  'prop-machine': () => livingSheet(COFFEE_MACHINE, (c) => c.rect(9, 9, 6, 3, 'screenGlow', 0.6)),
  'item-donut': () => shineSheet(DONUT),
  'item-coffee': () => shineSheet(COFFEE),
  'item-badge': () => shineSheet(BADGE),
  'item-report': () => shineSheet(REPORT)
};

export { PixelCanvas };
