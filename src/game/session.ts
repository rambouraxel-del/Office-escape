import type { RunStats } from '../core/scoring';

/**
 * État d'entrée partagé entre `UiScene` (qui l'écrit) et `LevelScene` (qui le
 * lit une fois par frame). Un objet mutable plutôt que des événements : pas de
 * question d'ordre de traitement entre scènes parallèles.
 */
export interface InputState {
  moveX: number;
  moveY: number;
  runHeld: boolean;
  /** Impulsions consommées par la scène de jeu à la frame suivante. */
  interactPressed: boolean;
  useSlot: number | null;
  pausePressed: boolean;
}

export function createInputState(): InputState {
  return { moveX: 0, moveY: 0, runHeld: false, interactPressed: false, useSlot: null, pausePressed: false };
}

export function resetInputState(state: InputState): void {
  state.moveX = 0;
  state.moveY = 0;
  state.runHeld = false;
  state.interactPressed = false;
  state.useSlot = null;
  state.pausePressed = false;
}

/** Ce qu'une partie doit savoir avant de démarrer. */
export interface RunRequest {
  levelId: string;
  seed: number;
  daily: boolean;
  dayKey?: string;
}

export type RunOutcome = 'escaped' | 'intercepted' | 'overtime';

export interface RunResult {
  request: RunRequest;
  outcome: RunOutcome;
  stats: RunStats;
  /** Heure de bureau affichée à la fin. */
  finishedAt: string;
  reason?: string;
}

export const REGISTRY_KEYS = {
  input: 'input-state',
  request: 'run-request',
  result: 'run-result'
} as const;
