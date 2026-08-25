/**
 * Réglages de game feel. Aucune logique ici : uniquement des nombres que l'on
 * peut modifier sans lire le reste du code.
 */
import { PALETTE } from './palette';

export const VIEW_WIDTH = 390;
export const VIEW_HEIGHT = 844;

export const WALK_SPEED = 175;
export const RUN_SPEED = 290;
export const COFFEE_WALK_MULTIPLIER = 1.28;
export const COFFEE_RUN_MULTIPLIER = 1.18;
export const COFFEE_DURATION_MS = 15000;

export const JOYSTICK_RADIUS = 58;
export const JOYSTICK_MARGIN_X = 96;
export const JOYSTICK_Y = 736;
export const RUN_BUTTON_Y = 728;
export const CONTROL_MARGIN_X = 66;

export const PLAYER_RADIUS = 18;
export const NPC_RADIUS = 17;

export const DEFAULT_PATROL_SPEED = 82;
export const DEFAULT_CHASE_SPEED = 116;
export const DEFAULT_VISION_RANGE = 310;
export const DEFAULT_VISION_HALF_ANGLE_DEG = 31;

export const RUN_VISION_MULTIPLIER = 1.3;
export const RUN_DETECTION_MULTIPLIER = 4 / 3;
export const DETECTION_ALERT_SECONDS = 2;
export const DETECTION_INTERCEPT_SECONDS = 4;
export const DETECTION_DECAY_PER_SECOND = 1.55;

/** Le PNJ va fouiller la dernière position connue avant de repartir en ronde. */
export const SEARCH_SECONDS = 4;
export const SEARCH_ARRIVAL_RADIUS = 26;
/** Au-delà, un PNJ coincé contre un mur applique une poussée latérale. */
export const STUCK_SECONDS = 0.35;
export const STUCK_STRAFE_SECONDS = 0.8;

/** Une distraction (rapport lâché) attire les PNJ dans ce rayon. */
export const DISTRACTION_RADIUS = 300;
export const DISTRACTION_SECONDS = 6;

export const INTERACTION_RADIUS = 76;
export const INVENTORY_SLOTS = 2;

/**
 * Position des poches dans le HUD. Partagée entre `UiScene`, qui les dessine,
 * et `LevelScene`, qui y envoie l'objet ramassé : deux valeurs séparées se
 * seraient désynchronisées au premier ajustement de maquette.
 */
export const POCKET_SLOT_X = 44;
export const POCKET_SLOT_Y = 82;
export const POCKET_SLOT_STEP = 44;

/** Bandeau unique du HUD : centre vertical et hauteur. */
export const HUD_Y = 58;
export const HUD_HEIGHT = 112;

/** Message contextuel : au-dessus des commandes, jamais au milieu du terrain. */
export const TOAST_Y = 620;

/** Durée du sursaut d'un PNJ qui vient de repérer le joueur. */
export const REACT_MS = 520;

/**
 * Temps laissé à l'effet de fin AVANT de basculer sur l'écran de résultat.
 * Purement visuel : l'horloge est déjà figée quand ces délais démarrent.
 */
export const EXIT_FLOURISH_MS = 560;
export const INTERCEPT_FLOURISH_MS = 320;

/** Pénalité anti-exploit : la pause manuelle gèle l'horloge mais se paie. */
export const MANUAL_PAUSE_PENALTY_MINUTES = 1;

/** Échantillonnage du fantôme (record précédent rejoué). */
export const GHOST_SAMPLE_MS = 100;
export const GHOST_MAX_SAMPLES = 3000;

export const VISION_SEGMENTS = 30;

/**
 * Les rares couleurs que le CODE DE JEU manipule directement — le fond de
 * caméra, les cônes de vision, le fantôme. Tout le reste de l'habillage passe
 * par `artTheme.ts` ; ce qui figure ici n'est pas de la décoration, c'est de
 * l'information de gameplay.
 */
export const COLORS = {
  background: PALETTE.floorDark,
  /** Vigilance, fouille, poursuite : les trois états d'un cône. */
  coneCalm: PALETTE.gold,
  coneSearch: PALETTE.goldDark,
  coneAlert: PALETTE.alert,
  /** Record précédent rejoué, volontairement fantomatique. */
  ghost: PALETTE.tealLight
} as const;

export const DEPTH = {
  floor: 0,
  floorLabel: 1,
  vision: 4,
  obstacleShadow: 7,
  obstacle: 8,
  obstacleDetail: 9,
  deskProps: 10,
  obstacleLabel: 11,
  plant: 12,
  item: 15,
  darkness: 18,
  light: 19,
  ghost: 22,
  npc: 25,
  npcDetail: 27,
  player: 30,
  detection: 40,
  tutorial: 250
} as const;
