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
  background: 0xefe7d7,
  floor: 0xeee4d1,
  floorLine: 0xd7cbb5,
  wall: 0x665b50,
  desk: 0x9f8064,
  player: 0x3f6f8f,
  colleague: 0xc9674f,
  boss: 0x75558a,
  coneCalm: 0xf3c969,
  coneAlert: 0xef6a5b,
  hud: 0x18232d,
  restroom: 0xb8c9d4,
  door: 0x5d87a0,
  green: 0x6ca178
} as const;
