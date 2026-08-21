import type { LevelDef } from '../game/types';
import { LEVEL_01 } from './level01';
import { LEVEL_02 } from './level02';
import { LEVEL_03 } from './level03';

/** Ordre de campagne. L'index sert au déverrouillage progressif. */
export const LEVELS: readonly LevelDef[] = [LEVEL_01, LEVEL_02, LEVEL_03];

export function getLevel(levelId: string): LevelDef {
  const level = LEVELS.find((candidate) => candidate.id === levelId);
  if (!level) throw new Error(`Niveau inconnu : ${levelId}`);
  return level;
}

export function levelIndex(levelId: string): number {
  return LEVELS.findIndex((candidate) => candidate.id === levelId);
}

export function nextLevelId(levelId: string): string | null {
  const index = levelIndex(levelId);
  if (index < 0 || index + 1 >= LEVELS.length) return null;
  return LEVELS[index + 1].id;
}

export const LEVEL_IDS = LEVELS.map((level) => level.id);
