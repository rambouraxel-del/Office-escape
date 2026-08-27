import type { ItemId, LevelTheme, NpcArchetype, ObstacleKind, PropKind, TextTone, ZoneMaterial } from './types';
import { hex, type PaletteKey } from './palette';

/**
 * Couche de configuration visuelle : le seul endroit qui relie une DONNÉE de
 * niveau (`kind`, `archetype`, `ItemId`, `theme`) à un asset ou à une couleur.
 *
 * `LevelView` ne connaît donc aucun nom de fichier, et ajouter une matière, un
 * rôle ou un thème de niveau ne demande qu'une entrée ici.
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

/**
 * Un jeu de matières par THÈME de niveau.
 *
 * C'est ce qui donne au parking son béton et à l'étage direction son marbre
 * sans qu'aucun niveau ne cite un nom de fichier : un `LevelDef` déclare
 * `theme: 'parking'`, et tout le reste suit.
 */
export const MATERIALS: Record<LevelTheme, Record<ObstacleKind, MaterialStyle>> = {
  office: {
    wall: { tile: 'tile-wall', edge: 'ink', crest: 'wallTop', base: 'wallDark' },
    partition: { tile: 'tile-wall', edge: 'ink', crest: 'metalLight', base: 'navyDark' },
    desk: { tile: 'tile-wood', edge: 'ink', crest: 'woodLight', base: 'woodDark' },
    cabinet: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark', inset: 'glassDim' },
    pillar: { tile: 'tile-stone', edge: 'ink', crest: 'stoneLight', base: 'stoneDark', inset: 'stoneLight' },
    door: { tile: 'tile-wood', edge: 'ink', crest: 'gold', base: 'woodDark', inset: 'goldDark' },
    // Sanitaires : faïence claire. Aucune incrustation — ce sont les cuvettes
    // et le lavabo posés dessus qui font la lecture, plus une étiquette « WC ».
    restroom: { tile: 'tile-bathroom', edge: 'ink', crest: 'marbleLight', base: 'marbleSeam' },
    // ── V0.11
    bench: { tile: 'tile-wood', edge: 'ink', crest: 'woodLight', base: 'woodDark', inset: 'floorLight' },
    meeting: { tile: 'tile-wood', edge: 'ink', crest: 'woodLight', base: 'woodDark', inset: 'woodLight' },
    reception: { tile: 'tile-wood', edge: 'ink', crest: 'marbleLight', base: 'woodDark', inset: 'marbleMid' },
    lockers: { tile: 'tile-locker', edge: 'ink', crest: 'metalLight', base: 'lockerBlueDark' },
    // Cloison vitrée : on voit à travers, donc elle ne bloque PAS la vue —
    // c'est `transparent` dans la donnée du niveau qui le décide, pas ce style.
    glass: { tile: 'tile-glass', edge: 'glassFrame', crest: 'paper', base: 'glassFrame' },
    server: { tile: 'tile-server', edge: 'ink', crest: 'metalDark', base: 'ink', inset: 'serverLed' },
    counter: { tile: 'tile-kitchen', edge: 'ink', crest: 'paper', base: 'metalDark', inset: 'metalLight' }
  },
  // Étage direction : plus froid, plus net, un liseré de laiton partout.
  exec: {
    wall: { tile: 'tile-wall', edge: 'ink', crest: 'marbleLight', base: 'wallDark' },
    partition: { tile: 'tile-metal', edge: 'ink', crest: 'marbleLight', base: 'metalDark' },
    desk: { tile: 'tile-wood', edge: 'ink', crest: 'brass', base: 'woodDark' },
    cabinet: { tile: 'tile-metal', edge: 'ink', crest: 'marbleLight', base: 'metalDark', inset: 'marbleMid' },
    pillar: { tile: 'tile-marble', edge: 'ink', crest: 'marbleLight', base: 'marbleSeam', inset: 'brass' },
    door: { tile: 'tile-wood', edge: 'ink', crest: 'brass', base: 'woodDark', inset: 'goldDark' },
    restroom: { tile: 'tile-bathroom', edge: 'ink', crest: 'marbleLight', base: 'brass' },
    bench: { tile: 'tile-wood', edge: 'ink', crest: 'brass', base: 'woodDark', inset: 'marbleLight' },
    meeting: { tile: 'tile-wood', edge: 'ink', crest: 'brass', base: 'woodDark', inset: 'brass' },
    reception: { tile: 'tile-marble', edge: 'ink', crest: 'brass', base: 'marbleSeam', inset: 'marbleLight' },
    lockers: { tile: 'tile-metal', edge: 'ink', crest: 'marbleLight', base: 'metalDark' },
    glass: { tile: 'tile-glass', edge: 'brass', crest: 'paper', base: 'glassFrame' },
    server: { tile: 'tile-server', edge: 'ink', crest: 'metalDark', base: 'ink', inset: 'serverLed' },
    counter: { tile: 'tile-marble', edge: 'ink', crest: 'marbleLight', base: 'brass', inset: 'marbleMid' }
  },
  // Parking : béton brut, et les « armoires » du niveau 3 sont des voitures.
  parking: {
    wall: { tile: 'tile-concrete', edge: 'ink', crest: 'concreteLight', base: 'concreteDark' },
    partition: { tile: 'tile-concrete', edge: 'ink', crest: 'concreteLight', base: 'concreteDark' },
    desk: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark' },
    cabinet: { tile: 'tile-carpaint', edge: 'ink', crest: 'navyLight', base: 'asphaltDark', inset: 'glassDim' },
    pillar: {
      tile: 'tile-concrete',
      edge: 'ink',
      crest: 'concreteLight',
      base: 'concreteDark',
      inset: 'paintLine'
    },
    door: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark', inset: 'goldDark' },
    restroom: { tile: 'tile-bathroom', edge: 'ink', crest: 'marbleLight', base: 'concreteDark' },
    bench: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark' },
    meeting: { tile: 'tile-metal', edge: 'ink', crest: 'metalLight', base: 'metalDark' },
    reception: { tile: 'tile-concrete', edge: 'ink', crest: 'concreteLight', base: 'concreteDark' },
    lockers: { tile: 'tile-locker', edge: 'ink', crest: 'metalLight', base: 'lockerBlueDark' },
    glass: { tile: 'tile-glass', edge: 'metalDark', crest: 'paper', base: 'glassFrame' },
    server: { tile: 'tile-server', edge: 'ink', crest: 'metalDark', base: 'ink', inset: 'serverLed' },
    counter: { tile: 'tile-concrete', edge: 'ink', crest: 'concreteLight', base: 'concreteDark' }
  }
};

/** Sol de base, un `TileSprite` sur tout le niveau. */
export const FLOOR_TILES: Record<LevelTheme, string> = {
  office: 'tile-floor',
  exec: 'tile-marble',
  parking: 'tile-asphalt'
};

export const ZONE_TILES: Record<ZoneMaterial, string> = {
  start: 'tile-carpet-start',
  exit: 'tile-carpet-exit',
  alcove: 'tile-carpet-alcove',
  neutral: 'tile-floor-alt',
  exec: 'tile-carpet-exec',
  bay: 'tile-bay',
  lounge: 'tile-carpet-blue',
  meeting: 'tile-carpet-grey',
  hall: 'tile-slab',
  kitchen: 'tile-kitchen',
  tech: 'tile-rubber',
  outdoor: 'tile-paving',
  parquet: 'tile-parquet'
};

/**
 * Liseré d'une zone. Pour une place de parking, c'est littéralement le
 * marquage au sol : le rectangle peint EST l'information.
 */
export const ZONE_EDGES: Record<ZoneMaterial, PaletteKey> = {
  start: 'carpetStartDark',
  exit: 'carpetExitDark',
  alcove: 'floorSeam',
  neutral: 'floorSeam',
  exec: 'brass',
  bay: 'paintLine',
  lounge: 'carpetBlueDark',
  meeting: 'carpetGreyDark',
  hall: 'tileLightSeam',
  kitchen: 'kitchenSeam',
  tech: 'rubberStud',
  outdoor: 'pavingSeam',
  parquet: 'woodDark'
};

/**
 * Décor de l'accueil (V0.10.2) : un open space en ÉLÉVATION, au crépuscule.
 *
 * C'est la seule image du projet qui n'est pas vue de dessus. Un menu doit
 * donner envie avant d'informer, et une vue de dessus donne un plan. La
 * palette, elle, reste la même : le menu peut changer de cadrage, pas de jeu.
 */
export const MENU_ROOM = 'menu-room';

/** Planches animées de l'accueil, posées par-dessus le décor cuit. */
export const MENU_SHEETS = {
  typist: 'menu-typist',
  sipper: 'menu-sipper',
  talker: 'menu-talker',
  screen: 'menu-screen'
} as const;

export type MenuSheet = (typeof MENU_SHEETS)[keyof typeof MENU_SHEETS];

/** Un habitant de l'accueil, posé par sa BASE : `y` est sa ligne d'appui. */
export interface MenuActor {
  sheet: MenuSheet;
  x: number;
  y: number;
  /** Décalage de départ, en frames : sans lui, tout le bureau respire ensemble. */
  offset: number;
}

/**
 * Composition de l'accueil, en unités d'écran (390 × 844).
 *
 * Elle vit ici et pas dans la scène pour la même raison qu'un niveau est une
 * donnée : `MenuStage` déroule cette table, il ne décide de rien. Déplacer un
 * personnage, c'est changer un nombre — pas relire du code de rendu.
 */
export const MENU_STAGE = {
  /** Ligne d'appui des bureaux du premier plan. */
  deskLine: 428,
  /** Cadran de l'horloge murale. Les aiguilles sont dessinées par la scène. */
  clock: { x: 48, y: 244, hourHand: 8, minuteHand: 12, secondHand: 13 },
  /** Tubes de la rampe de néons, qui vacillent. */
  neons: [
    { x: 104, y: 11, w: 112, h: 6 },
    { x: 288, y: 11, w: 112, h: 6 }
  ],
  /** Bec de la machine à café : la vapeur en part. */
  steam: { x: 100, y: 268 },
  /** Flaque du couchant sur le sol, qui respire. */
  glow: { x: 195, y: 384, w: 340, h: 210 },
  /** Zone où flottent les poussières, dans la lumière de la baie. */
  motes: { x: 30, y: 96, w: 330, h: 210, count: 7 },
  actors: [
    { sheet: MENU_SHEETS.screen, x: 186, y: 300, offset: 2 },
    { sheet: MENU_SHEETS.screen, x: 44, y: 428, offset: 0 },
    { sheet: MENU_SHEETS.typist, x: 128, y: 428, offset: 0 },
    { sheet: MENU_SHEETS.sipper, x: 246, y: 428, offset: 1 },
    { sheet: MENU_SHEETS.talker, x: 330, y: 428, offset: 3 }
  ] as MenuActor[]
} as const;

/** Vignettes de la sélection de niveau, une par thème. */
export const LEVEL_THUMBS: Record<LevelTheme, string> = {
  office: 'thumb-office',
  exec: 'thumb-exec',
  parking: 'thumb-parking'
};

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
  'char-guard',
  'char-hr',
  'char-tech'
] as const;

export type CharacterSheet = (typeof CHARACTER_SHEETS)[number];

/**
 * La caméra du niveau 2 est un PNJ sans jambes : elle pointe vers un décor
 * animé (sa diode d'enregistrement), pas vers une planche de personnage.
 */
export const CHARACTER_TEXTURES: Record<NpcArchetype, string> = {
  colleague: 'char-colleague',
  boss: 'char-boss',
  guard: 'char-guard',
  camera: 'prop-camera',
  hr: 'char-hr',
  tech: 'char-tech',
  // Quatre rôles partagent la planche d'un autre en attendant la leur. Ils
  // restent des archétypes distincts dans la donnée : le jour où la planche
  // arrive, une seule ligne change ici.
  // ASSET_TODO: char_stagiaire
  intern: 'char-tech',
  // ASSET_TODO: char_receptionniste
  receptionist: 'char-hr',
  // ASSET_TODO: char_agent_entretien
  janitor: 'char-guard'
};

export const PLAYER_TEXTURE: CharacterSheet = 'char-player';
// ASSET_TODO: char_collegue_bavard
export const TALKER_TEXTURE: CharacterSheet = 'char-hr';

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
  // ── V0.11.1 : accessoires FOURNIS.
  workstation: 'prop-workstation',
  monitor: 'prop-monitor',
  filebox: 'prop-filebox',
  stapler: 'prop-stapler',

  sofa: 'prop-sofa',
  coffeeTable: 'prop-coffee-table',
  whiteboard: 'prop-whiteboard',
  corkboard: 'prop-corkboard',
  coatRack: 'prop-coat-rack',
  wallClock: 'prop-wall-clock',
  mat: 'prop-mat',
  server: 'prop-server',
  vending: 'prop-vending',
  microwave: 'prop-microwave',
  fridge: 'prop-fridge',
  mop: 'prop-mop',
  wetFloor: 'prop-wet-floor',
  recycling: 'prop-recycling',
  laptop: 'prop-laptop',
  reader: 'prop-reader',
  turnstile: 'prop-turnstile',
  railing: 'prop-railing',
  urinal: 'prop-urinal',
  sinkCounter: 'prop-sink-counter',
  binder: 'prop-binder',
  hazardTape: 'prop-hazard-tape',

  plant: 'prop-plant',
  cactus: 'prop-cactus',
  toilet: 'prop-toilet',
  sink: 'prop-sink',
  stall: 'prop-stall',
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
  sticky: 'prop-sticky',
  screen: 'prop-screen',
  // étage direction
  armchair: 'prop-armchair',
  frame: 'prop-frame',
  award: 'prop-award',
  vase: 'prop-vase',
  machine: 'prop-machine',
  // parking
  cone: 'prop-cone',
  barrier: 'prop-barrier',
  extinguisher: 'prop-extinguisher',
  bike: 'prop-bike',
  cart: 'prop-cart',
  crate: 'prop-crate',
  tire: 'prop-tire',
  parkingSign: 'prop-parking-sign',
  neon: 'prop-neon'
};

/**
 * Plan de dessin d'un accessoire. Une table plutôt qu'un `if` dans la vue :
 * ajouter un élément accroché en hauteur ne demande pas de toucher au code.
 */
export const PROP_ELEVATION: Partial<Record<PropKind, 'wall'>> = {
  exitSign: 'wall',
  frame: 'wall',
  parkingSign: 'wall',
  neon: 'wall'
};

/** Porte : planche de quatre frames, du battant fermé à l'embrasure vide. */
export const DOOR_TEXTURE = 'prop-door';

/** Effets animés, jamais déclarés ailleurs. */
export const FX_TEXTURES = {
  emote: 'fx-emote',
  pickup: 'fx-pickup',
  hint: 'fx-hint',
  light: 'fx-light',
  /** Faisceau de la lampe torche : pointe à gauche, ouverture vers la droite. */
  beam: 'fx-beam'
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

// ─────────────────────────── tons de texte ──────────────────────────────

/**
 * Hiérarchie de lecture de l'interface, en chaînes CSS prêtes à l'emploi.
 *
 * Aucune scène n'écrit `'#rrggbb'` : elle choisit un RÔLE. C'est ce qui
 * garantit qu'un changement de palette se voit partout, et qu'on ne fabrique
 * pas par accident un vert « presque » identique à celui d'à côté.
 */
export const TEXT = {
  /** Sur panneau sombre : titre et valeurs. */
  onDark: hex('paper'),
  /** Sur panneau sombre : légende, unité, mention secondaire. */
  onDarkMuted: hex('hudMuted'),
  /** Sur panneau clair : l'essentiel. */
  onLight: hex('ink'),
  /** Sur panneau clair : le corps de texte. */
  onLightBody: hex('inkSoft'),
  /** Sur panneau clair : ce qu'on peut ne pas lire. */
  onLightMuted: hex('inkFaint'),
  /** Titre de section chaleureux (dialogue, résultat). */
  heading: hex('headingWarm'),
  /** Réussite, record, bonus. */
  success: hex('success'),
  /** Étoile gagnée. Une teinte de laiton, jamais le `gold` de la détection. */
  star: hex('brass'),
  /** Information neutre, valeur de réglage. */
  info: hex('info')
} as const;

/**
 * Étiquettes posées DANS le monde. Séparées des tons d'interface : elles
 * peuvent réutiliser la même teinte qu'un rôle d'écran sans que ce soit une
 * confusion — un mot gravé sur une armoire n'est pas un titre de panneau.
 */
export const WORLD_TEXT = {
  /** Sur le sol : étiquette de zone. */
  floor: hex('shadow'),
  /** Sur un meuble sombre : étiquette gravée. */
  furniture: hex('paper')
} as const;

/**
 * États de détection. Ils réutilisent volontairement les teintes RÉSERVÉES du
 * système de détection : c'est la même information, elle doit avoir la même
 * couleur partout.
 */
export const STATE_TEXT = {
  calm: hex('stateOk'),
  idle: hex('stateIdle'),
  hidden: hex('glass'),
  seen: hex('gold'),
  searching: hex('goldDark'),
  chase: hex('alertSoft')
} as const;

/**
 * Tons disponibles pour une étiquette posée dans un niveau. Un `LevelDef`
 * choisit un ton, jamais une valeur hexadécimale.
 */
export const TEXT_TONES: Record<TextTone, PaletteKey> = {
  zone: 'shadow',
  quiet: 'inkFaint',
  warm: 'headingWarm',
  cool: 'concreteLight'
};

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
    'tile-carpet-exec',
    'tile-wall',
    'tile-wood',
    'tile-metal',
    'tile-stone',
    'tile-marble',
    'tile-asphalt',
    'tile-bay',
    'tile-concrete',
    'tile-carpaint',
    'tile-bathroom',
    'tile-carpet-blue',
    'tile-carpet-grey',
    'tile-slab',
    'tile-kitchen',
    'tile-paving',
    'tile-rubber',
    'tile-glass',
    'tile-locker',
    'tile-server',
    'tile-parquet'
  ],
  props: [
    'prop-keyboard',
    'prop-mug',
    'prop-folder',
    'prop-sticky',
    'prop-phone',
    'prop-lamp',
    'prop-plant',
    'prop-cactus',
    'prop-toilet',
    'prop-sink',
    'prop-stall',
    'prop-chair',
    'prop-trash',
    'prop-boxes',
    'prop-books',
    'prop-exit-sign',
    'prop-armchair',
    'prop-frame',
    'prop-award',
    'prop-vase',
    'prop-cone',
    'prop-barrier',
    'prop-extinguisher',
    'prop-bike',
    'prop-cart',
    'prop-crate',
    'prop-tire',
    'prop-parking-sign',
    'prop-sofa',
    'prop-coffee-table',
    'prop-whiteboard',
    'prop-corkboard',
    'prop-coat-rack',
    'prop-wall-clock',
    'prop-mat',
    'prop-server',
    'prop-vending',
    'prop-microwave',
    'prop-fridge',
    'prop-mop',
    'prop-wet-floor',
    'prop-recycling',
    'prop-laptop',
    'prop-reader',
    'prop-turnstile',
    'prop-railing',
    'prop-urinal',
    'prop-sink-counter',
    'prop-binder',
    'prop-hazard-tape',
    'prop-workstation',
    'prop-monitor',
    'prop-filebox',
    'prop-stapler'
  ],
  fx: ['fx-light', 'fx-beam'],
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
    'ui-btn-pause',
    'thumb-office',
    'thumb-exec',
    'thumb-parking',
    'menu-room'
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
