/**
 * Réglages de game feel. Aucune logique ici : uniquement des nombres que l'on
 * peut modifier sans lire le reste du code.
 */

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

/** Pénalité anti-exploit : la pause manuelle gèle l'horloge mais se paie. */
export const MANUAL_PAUSE_PENALTY_MINUTES = 1;

/** Échantillonnage du fantôme (record précédent rejoué). */
export const GHOST_SAMPLE_MS = 100;
export const GHOST_MAX_SAMPLES = 3000;

export const VISION_SEGMENTS = 30;

export const COLORS = {
  background: 0xefe3c9,
  floor: 0xf2e7ce,
  floorAlt: 0xeadcc0,
  floorLine: 0xd8c9aa,
  wall: 0x243247,
  wallTrim: 0x44546b,
  desk: 0x9c633d,
  cabinet: 0x6d7f92,
  pillar: 0x5d5261,
  partition: 0x8a9bb0,
  doorLocked: 0xb07a3d,
  player: 0x149c96,
  colleague: 0xe06f4f,
  boss: 0x714868,
  intern: 0x4f7f96,
  guard: 0x3f5d70,
  camera: 0x53616f,
  coneCalm: 0xe9b949,
  coneAlert: 0xe85d4f,
  coneSearch: 0xc98f4a,
  hud: 0x111d35,
  door: 0x337f87,
  green: 0x5c9567,
  ink: 0x172238,
  sage: 0x718d57,
  coral: 0xe06f4f,
  ghost: 0x9fd4ad
} as const;

export const ARCHETYPE_COLORS: Record<string, number> = {
  colleague: COLORS.colleague,
  boss: COLORS.boss,
  intern: COLORS.intern,
  guard: COLORS.guard,
  camera: COLORS.camera
};

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
