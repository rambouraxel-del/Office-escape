import type { ItemId, NpcArchetype, ObstacleKind, PropKind, ZoneMaterial } from './types';
import type { PaletteKey } from './palette';

/**
 * Couche de configuration visuelle : le seul endroit qui relie une DONNÉE de
 * niveau (`kind`, `archetype`, `ItemId`) à un asset.
 *
 * `LevelView` ne connaît donc aucun nom de fichier, et ajouter une matière ou
 * un rôle ne demande qu'une entrée ici.
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

/**
 * Textures de personnages. 64×64 IMPOSÉ : `Body.setCircle()` conserve
 * l'offset (0,0) du corps, donc la taille de la texture positionne le cercle
 * de collision. Changer ces dimensions déplacerait toutes les collisions.
 */
export const CHARACTER_TEXTURES: Record<NpcArchetype, string> = {
  colleague: 'char-colleague',
  boss: 'char-boss',
  intern: 'char-intern',
  guard: 'char-guard',
  camera: 'prop-camera'
};

export const PLAYER_TEXTURE = 'char-player';
export const TALKER_TEXTURE = 'char-talker';

export const ITEM_TEXTURES: Record<ItemId, string> = {
  donut: 'item-donut',
  coffee: 'item-coffee',
  badge: 'item-badge',
  report: 'item-report'
};

/** Accessoires posés sur les bureaux, dans l'ordre de dessin. */
export const DESK_PROPS = {
  screen: 'prop-screen',
  mug: 'prop-mug',
  folder: 'prop-folder',
  chair: 'prop-chair'
} as const;

export const PROP_TEXTURES: Record<PropKind, string> = {
  plant: 'prop-plant',
  chair: 'prop-chair',
  exitSign: 'prop-exit-sign'
};

export const DOOR_TEXTURE = 'prop-door';

/** Tous les assets à précharger, groupés par dossier. */
export const ASSET_MANIFEST = {
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
  characters: ['char-player', 'char-colleague', 'char-boss', 'char-intern', 'char-guard', 'char-talker'],
  props: [
    'prop-screen',
    'prop-mug',
    'prop-folder',
    'prop-plant',
    'prop-chair',
    'prop-door',
    'prop-camera',
    'prop-exit-sign',
    'item-donut',
    'item-coffee',
    'item-badge',
    'item-report'
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
