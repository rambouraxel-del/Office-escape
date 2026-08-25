import type { LevelDef } from '../game/types';

/**
 * Score à trois axes : le chrono ne suffit plus à juger une partie.
 * Rejouer pour la discrétion ou la collecte devient un objectif distinct.
 */
export interface RunStats {
  minutes: number;
  /** Aucun PNJ n'a atteint l'état ALERTE de toute la partie. */
  neverSpotted: boolean;
  /** Nombre de fois où une jauge de suspicion a démarré. */
  suspicionEvents: number;
  itemsCollected: number;
  itemsTotal: number;
  usedHidingSpot: boolean;
}

export interface ScoreBreakdown {
  stars: number;
  total: number;
  timePoints: number;
  stealthPoints: number;
  collectionPoints: number;
  labels: { time: string; stealth: string; collection: string };
}

export const MAX_TIME_POINTS = 600;
export const STEALTH_BONUS = 250;
export const SUSPICION_MALUS = 15;
export const COLLECTION_BONUS = 150;

export function starsFor(minutes: number, thresholds: readonly [number, number, number]): number {
  if (minutes <= thresholds[0]) return 3;
  if (minutes <= thresholds[1]) return 2;
  if (minutes <= thresholds[2]) return 1;
  return 0;
}

export function scoreRun(stats: RunStats, level: LevelDef): ScoreBreakdown {
  const [gold, , bronze] = level.stars;
  // Barème linéaire entre le seuil 3 étoiles (plein pot) et le seuil 1 étoile (zéro).
  const span = Math.max(1, bronze - gold);
  const overshoot = Math.max(0, stats.minutes - gold);
  const timePoints = Math.round(MAX_TIME_POINTS * Math.max(0, 1 - overshoot / span));

  const stealthPoints = stats.neverSpotted
    ? STEALTH_BONUS - Math.min(STEALTH_BONUS, stats.suspicionEvents * SUSPICION_MALUS)
    : 0;

  const collectionPoints =
    stats.itemsTotal === 0 ? 0 : Math.round((COLLECTION_BONUS * stats.itemsCollected) / stats.itemsTotal);

  return {
    stars: starsFor(stats.minutes, level.stars),
    total: timePoints + stealthPoints + collectionPoints,
    timePoints,
    stealthPoints,
    collectionPoints,
    labels: {
      time: `${stats.minutes} min`,
      stealth: stats.neverSpotted
        ? stats.suspicionEvents === 0
          ? 'fantôme'
          : `${stats.suspicionEvents} frayeur(s)`
        : 'repéré',
      collection: `${stats.itemsCollected}/${stats.itemsTotal}`
    }
  };
}
