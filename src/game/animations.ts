import { CHARACTER_SHEETS, DOOR_TEXTURE, FX_TEXTURES, ITEM_TEXTURES, MENU_SHEETS } from './artTheme';

/**
 * Déclaration CENTRALE des planches et des animations.
 *
 * Aucune scène ne décide d'un découpage de planche ni d'une vitesse : tout se
 * lit ici, et `BootScene` se contente de dérouler ces tables. Ajouter un
 * personnage, un objet ou un effet animé, c'est ajouter une ligne — pas une
 * condition dans `LevelScene`.
 *
 * Ce fichier reste PUR (aucun import de Phaser) : les conversions
 * direction → orientation sont donc testables sans navigateur.
 */

/**
 * Frame de personnage. 64×64 IMPOSÉ : `Body.setCircle()` conserve l'offset
 * (0,0) du corps, donc le cercle de collision est positionné par rapport aux
 * dimensions de la FRAME. Changer ce gabarit déplacerait toutes les collisions.
 */
export const CHARACTER_FRAME = 64;

/** Frame des objets, portes et effets. 16 pixels d'art × 2. */
export const SHEET_FRAME = 32;

/**
 * Frame des décors qui respirent (écran, imprimante, néon…). Plus large que
 * les objets : un tube de néon ne tient pas dans 16 pixels d'art.
 */
export const LIVING_FRAME = 48;

/**
 * Décors animés : deux frames, une variation d'un ou deux pixels, très lente.
 *
 * C'est ce qui fait qu'un bureau paraît encore allumé. La cadence est
 * volontairement basse — un clignotement rapide volerait l'attention aux
 * cônes de vision, qui sont, eux, de l'information de gameplay.
 */
export const LIVING_SHEETS: Record<string, number> = {
  'prop-camera': 1.2,
  'prop-neon': 2.4
};

export function livingAnimKey(texture: string): string {
  return `${texture}-live`;
}

/**
 * Habitants de l'accueil (V0.10.2).
 *
 * Cadences volontairement basses : un menu doit être VIVANT, pas agité. Le
 * buste fait 64 × 44 (32 × 22 pixels d'art) — la tête et le torse d'un
 * personnage du jeu, recadrés au-dessus du plateau ; l'écran est plus petit.
 */
export const MENU_FRAMES = 4;

export const MENU_ANIMATED = [
  { key: MENU_SHEETS.typist, frameWidth: 64, frameHeight: 44, frameRate: 5 },
  { key: MENU_SHEETS.sipper, frameWidth: 64, frameHeight: 44, frameRate: 1.4 },
  { key: MENU_SHEETS.talker, frameWidth: 64, frameHeight: 44, frameRate: 2.6 },
  { key: MENU_SHEETS.screen, frameWidth: 52, frameHeight: 40, frameRate: 2.2 }
] as const;

export function menuAnimKey(sheet: string): string {
  return `${sheet}-live`;
}

/** Colonnes d'une planche de personnage : repos ×2, marche ×4, sursaut ×2. */
export const CHARACTER_COLUMNS = 8;

/** Orientations dessinées. Le profil regarde à DROITE ; la gauche est un miroir. */
export type CharacterView = 'down' | 'side' | 'up';

/** Direction logique d'un personnage, telle que la lit le jeu. */
export type Facing = 'down' | 'up' | 'left' | 'right';

export type CharacterState = 'idle' | 'walk' | 'run' | 'react';

const VIEW_ROW: Record<CharacterView, number> = { down: 0, side: 1, up: 2 };

export const FACING_VIEW: Record<Facing, CharacterView> = {
  down: 'down',
  up: 'up',
  left: 'side',
  right: 'side'
};

/** Le profil est dessiné vers la droite : seule la gauche se retourne. */
export const FACING_FLIP: Record<Facing, boolean> = {
  down: false,
  up: false,
  left: true,
  right: false
};

/**
 * Poses et cadence de chaque état.
 * `run` réutilise les frames de la marche, plus vite : quatre frames bien
 * rythmées valent mieux qu'un second cycle à dessiner et à maintenir.
 */
const STATE_COLUMNS: Record<CharacterState, { columns: number[]; frameRate: number }> = {
  idle: { columns: [0, 1], frameRate: 2 },
  walk: { columns: [2, 3, 4, 5], frameRate: 8 },
  run: { columns: [2, 3, 4, 5], frameRate: 14 },
  react: { columns: [6, 7], frameRate: 7 }
};

export const CHARACTER_STATES = Object.keys(STATE_COLUMNS) as CharacterState[];
export const CHARACTER_VIEWS = Object.keys(VIEW_ROW) as CharacterView[];

/** En deçà, on considère le personnage à l'arrêt et on garde son orientation. */
const MOVING_EPSILON = 6;

/**
 * Orientation déduite d'un vecteur de déplacement.
 *
 * À l'arrêt, on CONSERVE la dernière orientation : un PNJ qui s'immobilise ne
 * doit pas se retourner vers le joueur tout seul — ce serait une information
 * de gameplay fausse.
 */
export function facingFromVector(dx: number, dy: number, previous: Facing): Facing {
  if (Math.hypot(dx, dy) < MOVING_EPSILON) return previous;
  // L'axe dominant l'emporte ; à égalité, on privilégie le profil, plus lisible.
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

export function characterAnimKey(texture: string, state: CharacterState, view: CharacterView): string {
  return `${texture}-${state}-${view}`;
}

// ────────────────────────────── planches ────────────────────────────────

export interface SheetDef {
  key: string;
  /** Sous-dossier de `public/assets/`. */
  group: 'characters' | 'props' | 'fx' | 'ui';
  frameWidth: number;
  frameHeight: number;
  /** Nombre total de frames de la planche. Vérifié par les tests. */
  frames: number;
}

const CHARACTER_SHEET_DEFS: SheetDef[] = CHARACTER_SHEETS.map((key) => ({
  key,
  group: 'characters',
  frameWidth: CHARACTER_FRAME,
  frameHeight: CHARACTER_FRAME,
  frames: CHARACTER_COLUMNS * CHARACTER_VIEWS.length
}));

const square = (key: string, group: SheetDef['group'], frames: number): SheetDef => ({
  key,
  group,
  frameWidth: SHEET_FRAME,
  frameHeight: SHEET_FRAME,
  frames
});

export const SHEET_MANIFEST: SheetDef[] = [
  ...CHARACTER_SHEET_DEFS,
  ...Object.values(ITEM_TEXTURES).map((key) => square(key, 'props', 4)),
  square(DOOR_TEXTURE, 'props', 4),
  ...Object.keys(LIVING_SHEETS).map((key) => ({
    key,
    group: 'props' as const,
    frameWidth: LIVING_FRAME,
    frameHeight: LIVING_FRAME,
    frames: 2
  })),
  square(FX_TEXTURES.emote, 'fx', 8),
  square(FX_TEXTURES.pickup, 'fx', 4),
  square(FX_TEXTURES.hint, 'fx', 4),
  ...MENU_ANIMATED.map(({ key, frameWidth, frameHeight }) => ({
    key,
    group: 'ui' as const,
    frameWidth,
    frameHeight,
    frames: MENU_FRAMES
  }))
];

// ───────────────────────────── animations ───────────────────────────────

export interface AnimationDef {
  key: string;
  /** Clé de la planche source. */
  sheet: string;
  frames: number[];
  frameRate: number;
  /** -1 = boucle infinie, 0 = une seule fois. */
  repeat: number;
}

function characterAnimations(): AnimationDef[] {
  const animations: AnimationDef[] = [];
  CHARACTER_SHEETS.forEach((sheet) => {
    CHARACTER_VIEWS.forEach((view) => {
      CHARACTER_STATES.forEach((state) => {
        const { columns, frameRate } = STATE_COLUMNS[state];
        animations.push({
          key: characterAnimKey(sheet, state, view),
          sheet,
          frames: columns.map((column) => VIEW_ROW[view] * CHARACTER_COLUMNS + column),
          frameRate,
          repeat: -1
        });
      });
    });
  });
  return animations;
}

/** Émotions au-dessus de la tête d'un PNJ. Une par état de détection. */
export const EMOTES = {
  suspicion: 'emote-suspicion',
  alert: 'emote-alert',
  search: 'emote-search'
} as const;

export type EmoteKey = (typeof EMOTES)[keyof typeof EMOTES];

/** Idle d'objet ramassable : le reflet balaie le sprite puis le laisse respirer. */
export function itemAnimKey(texture: string): string {
  return `${texture}-idle`;
}

export const DOOR_OPEN_ANIM = 'door-open';
export const PICKUP_ANIM = 'pickup-burst';
export const HINT_ANIM = 'hint-pulse';

/** Durée de l'ouverture d'une porte, en millisecondes. Utilisée par la vue. */
export const DOOR_OPEN_MS = 320;

export const ANIMATIONS: AnimationDef[] = [
  ...characterAnimations(),
  ...Object.values(ITEM_TEXTURES).map((key) => ({
    key: itemAnimKey(key),
    sheet: key,
    frames: [0, 1, 2, 3],
    frameRate: 5,
    repeat: -1
  })),
  { key: DOOR_OPEN_ANIM, sheet: DOOR_TEXTURE, frames: [0, 1, 2, 3], frameRate: 13, repeat: 0 },
  { key: EMOTES.suspicion, sheet: FX_TEXTURES.emote, frames: [0, 1], frameRate: 3, repeat: -1 },
  { key: EMOTES.alert, sheet: FX_TEXTURES.emote, frames: [2, 3], frameRate: 7, repeat: -1 },
  { key: EMOTES.search, sheet: FX_TEXTURES.emote, frames: [4, 5, 6], frameRate: 4, repeat: -1 },
  { key: PICKUP_ANIM, sheet: FX_TEXTURES.pickup, frames: [0, 1, 2, 3], frameRate: 16, repeat: 0 },
  { key: HINT_ANIM, sheet: FX_TEXTURES.hint, frames: [0, 1, 2, 3], frameRate: 4, repeat: -1 },
  ...Object.entries(LIVING_SHEETS).map(([sheet, frameRate]) => ({
    key: livingAnimKey(sheet),
    sheet,
    frames: [0, 1],
    frameRate,
    repeat: -1
  })),
  ...MENU_ANIMATED.map(({ key, frameRate }) => ({
    key: menuAnimKey(key),
    sheet: key,
    frames: [0, 1, 2, 3],
    frameRate,
    repeat: -1
  }))
];
