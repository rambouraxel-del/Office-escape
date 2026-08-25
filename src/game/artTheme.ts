import type { ItemId, NpcArchetype, ObstacleKind, PropKind, ZoneMaterial } from './types';
import type { PaletteKey } from './palette';

/**
 * Couche de configuration visuelle : le seul endroit qui relie une DONNÉE de
 * niveau (`kind`, `archetype`, `ItemId`) à un asset.
 *
 * `LevelView` ne connaît donc aucun nom de fichier, et ajouter une matière ou
 * un rôle ne demande qu'une entrée ici.
 *
 * Le découpage des planches et les animations vivent à côté, dans
 * `animations.ts`, qui importe ce fichier — jamais l'inverse.
 */

/** Règle d'échelle du projet : 1 pixel d'art = 2 unités de monde. */
export const ART_SCALE = 2;

/** Épaisseur des traits d'habillage, en unités de monde (= 1 pixel d'art). */
export const OUTLINE = ART_SCALE;

export interface MaterialStyle {
  /** Motif raccordable étiré en `TileSprite`. */
  tile: string;
  /** Trait de contour. */
  edge: PaletteKey;
  /** Arête supérieure éclairée : donne du volume sans perspective. */
  crest: PaletteKey;
  /** Liseré intérieur en bas, côté ombre. */
  base: PaletteKey;
  /** Panneau incrusté au centre (armoires, piliers). */
  inset?: PaletteKey;
}

export const MATERIALS: Record<ObstacleKind, MaterialStyle> = {
  wall: { tile: 'tile-wall', edge: 'ink', crest: 'wallTop', base: 'wallDark' },
  partition: { tile: 'tile-wall', edge: 'ink', crest: 'metalLight', base: 'navyDark' },
  desk: { tile: 'tile-wood', edge: 'ink', crest: 'woodLight', base: 'woodDark' },
  cabinet: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark', inset: 'glassDim' },
  pillar: { tile: 'tile-stone', edge: 'ink', crest: 'stoneLight', base: 'stoneDark', inset: 'stoneLight' },
  door: { tile: 'tile-wood', edge: 'ink', crest: 'gold', base: 'woodDark', inset: 'goldDark' }
};

export const ZONE_TILES: Record<ZoneMaterial, string> = {
  start: 'tile-carpet-start',
  exit: 'tile-carpet-exit',
  alcove: 'tile-carpet-alcove',
  neutral: 'tile-floor-alt'
};

export const ZONE_EDGES: Record<ZoneMaterial, PaletteKey> = {
  start: 'carpetStartDark',
  exit: 'carpetExitDark',
  alcove: 'floorSeam',
  neutral: 'floorSeam'
};

export const FLOOR_TILE = 'tile-floor';

/** Diorama du menu, composé des mêmes motifs que le jeu. */
export const MENU_BACKGROUND = 'menu-bg';

// ──────────────────────────── personnages ───────────────────────────────

/**
 * Planches de personnages. Frames de 64×64 IMPOSÉES : `Body.setCircle()`
 * conserve l'offset (0,0) du corps, donc la taille de la FRAME positionne le
 * cercle de collision. Changer ce gabarit déplacerait toutes les collisions.
 */
export const CHARACTER_SHEETS = [
  'char-player',
  'char-colleague',
  'char-boss',
  'char-intern',
  'char-guard',
  'char-talker'
] as const;

export type CharacterSheet = (typeof CHARACTER_SHEETS)[number];

/**
 * La caméra du niveau 2 est un PNJ sans jambes : elle pointe vers un accessoire
 * fixe, pas vers une planche animée. L'animateur ignore proprement une texture
 * sans animation déclarée.
 */
export const CHARACTER_TEXTURES: Record<NpcArchetype, string> = {
  colleague: 'char-colleague',
  boss: 'char-boss',
  intern: 'char-intern',
  guard: 'char-guard',
  camera: 'prop-camera'
};

export const PLAYER_TEXTURE: CharacterSheet = 'char-player';
export const TALKER_TEXTURE: CharacterSheet = 'char-talker';

// ─────────────────────── objets, accessoires, effets ────────────────────

/** Objets ramassables : chacun est une planche de quatre frames (reflet). */
export const ITEM_TEXTURES: Record<ItemId, string> = {
  donut: 'item-donut',
  coffee: 'item-coffee',
  badge: 'item-badge',
  report: 'item-report'
};

/** Accessoires posés sur les bureaux, dans l'ordre de dessin. */
export const DESK_PROPS = {
  screen: 'prop-screen',
  keyboard: 'prop-keyboard',
  mug: 'prop-mug',
  folder: 'prop-folder',
  sticky: 'prop-sticky'
} as const;

export const PROP_TEXTURES: Record<PropKind, string> = {
  plant: 'prop-plant',
  cactus: 'prop-cactus',
  chair: 'prop-chair',
  exitSign: 'prop-exit-sign',
  trash: 'prop-trash',
  cooler: 'prop-cooler',
  printer: 'prop-printer',
  boxes: 'prop-boxes',
  books: 'prop-books',
  phone: 'prop-phone',
  lamp: 'prop-lamp',
  keyboard: 'prop-keyboard',
  sticky: 'prop-sticky'
};

/**
 * Plan de dessin d'un accessoire. Deux valeurs seulement : posé au sol, ou
 * accroché en hauteur (panneau de sortie). Une table plutôt qu'un `if` dans la
 * vue : ajouter un accessoire mural ne demandera pas de toucher au code.
 */
export const PROP_ELEVATION: Partial<Record<PropKind, 'wall'>> = {
  exitSign: 'wall'
};

/** Porte : planche de quatre frames, du battant fermé à l'embrasure vide. */
export const DOOR_TEXTURE = 'prop-door';

/** Effets animés, jamais déclarés ailleurs. */
export const FX_TEXTURES = {
  emote: 'fx-emote',
  pickup: 'fx-pickup',
  hint: 'fx-hint'
} as const;

/** Habillages d'interface, pour que les scènes n'écrivent aucun nom de fichier. */
export const UI_TEXTURES = {
  stickBase: 'ui-stick-base',
  stickKnob: 'ui-stick-knob',
  run: 'ui-btn-run',
  runOn: 'ui-btn-run-on',
  action: 'ui-btn-action',
  pause: 'ui-btn-pause'
} as const;

// ──────────────────────────── préchargement ─────────────────────────────

/**
 * Images fixes à précharger, groupées par dossier.
 * Les planches, elles, sont déclarées dans `animations.ts` (`SHEET_MANIFEST`) :
 * elles ont besoin d'une taille de frame, pas seulement d'un chemin.
 */
export const IMAGE_MANIFEST = {
  tiles: [
    'tile-floor',
    'tile-floor-alt',
    'tile-carpet-start',
    'tile-carpet-exit',
    'tile-carpet-alcove',
    'tile-wall',
    'tile-wood',
    'tile-metal',
    'tile-stone'
  ],
  props: [
    'prop-screen',
    'prop-keyboard',
    'prop-mug',
    'prop-folder',
    'prop-sticky',
    'prop-phone',
    'prop-lamp',
    'prop-plant',
    'prop-cactus',
    'prop-chair',
    'prop-trash',
    'prop-cooler',
    'prop-printer',
    'prop-boxes',
    'prop-books',
    'prop-camera',
    'prop-exit-sign'
  ],
  ui: [
    'ui-panel',
    'ui-panel-dark',
    'ui-panel-inset',
    'ui-button',
    'ui-button-warm',
    'ui-button-muted',
    'ui-stick-base',
    'ui-stick-knob',
    'ui-btn-run',
    'ui-btn-run-on',
    'ui-btn-action',
    'ui-btn-pause'
  ]
} as const;

/** Planche de chiffres de l'horloge : « 0 »…« 9 » puis « : ». */
export const DIGITS = {
  key: 'ui-digits',
  frameWidth: 16,
  frameHeight: 24,
  colonFrame: 10
} as const;

/** Coins des panneaux en 9 tranches, en unités de monde. */
export const NINE_SLICE_CORNER = 8;
