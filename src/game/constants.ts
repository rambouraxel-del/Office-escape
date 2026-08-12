import Phaser from 'phaser';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const WORLD_WIDTH = 500;
export const WORLD_HEIGHT = 2200;

export const WALK_SPEED = 175;
export const RUN_SPEED = 290;
export const JOYSTICK_RADIUS = 58;
export const JOYSTICK_X = 180;
export const JOYSTICK_Y = 758;

export const PLAYER_RADIUS = 18;
export const NPC_RADIUS = 17;
export const NPC_PATROL_SPEED = 82;
export const NPC_CHASE_SPEED = 116;
export const BOSS_PATROL_SPEED = 72;
export const BOSS_CHASE_SPEED = 128;

export const BASE_VISION_RANGE = 310;
export const VISION_HALF_ANGLE = Phaser.Math.DegToRad(31);
export const BOSS_VISION_RANGE = 340;
export const BOSS_VISION_HALF_ANGLE = Phaser.Math.DegToRad(36);
export const RUN_VISION_MULTIPLIER = 1.3;
export const DETECTION_ALERT_SECONDS = 2;
export const DETECTION_INTERCEPT_SECONDS = 4;
export const RUN_DETECTION_MULTIPLIER = 4 / 3;
export const DETECTION_DECAY_PER_SECOND = 1.55;

export const REAL_MS_PER_GAME_MINUTE = 5000;
export const START_HOUR = 17;
export const START_MINUTE = 0;

export const COLORS = {
  background: 0xefe3c9,
  floor: 0xf2e7ce,
  floorAlt: 0xeadcc0,
  floorLine: 0xd8c9aa,
  wall: 0x243247,
  wallTrim: 0x44546b,
  desk: 0x9c633d,
  deskTop: 0xc18a58,
  player: 0x149c96,
  colleague: 0xe06f4f,
  boss: 0x714868,
  coneCalm: 0xe9b949,
  coneAlert: 0xe85d4f,
  hud: 0x111d35,
  restroom: 0x8eb6bd,
  door: 0x337f87,
  green: 0x5c9567,
  ink: 0x172238,
  cream: 0xfff7e8,
  sage: 0x718d57,
  coral: 0xe06f4f,
  plum: 0x714868
} as const;
