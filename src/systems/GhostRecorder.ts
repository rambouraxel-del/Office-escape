import { GHOST_MAX_SAMPLES, GHOST_SAMPLE_MS } from '../game/constants';
import type { GhostSample } from '../core/save';

/**
 * Enregistre la trajectoire du joueur pour la rejouer au run suivant.
 *
 * Un fantôme de son propre record est l'incitation au rejeu la moins chère à
 * produire : quelques kilo-octets de localStorage, aucun serveur.
 */
export class GhostRecorder {
  private samples: GhostSample[] = [];
  private accumulator = 0;

  reset(): void {
    this.samples = [];
    this.accumulator = 0;
  }

  update(deltaMs: number, x: number, y: number): void {
    if (this.samples.length >= GHOST_MAX_SAMPLES) return;
    this.accumulator += deltaMs;
    if (this.samples.length > 0 && this.accumulator < GHOST_SAMPLE_MS) return;
    this.accumulator = 0;
    // Arrondi à l'entier : un demi-pixel de précision ne se voit pas et double
    // la taille du JSON.
    this.samples.push({ x: Math.round(x), y: Math.round(y) });
  }

  get track(): GhostSample[] {
    return this.samples;
  }
}

/**
 * Relit une trajectoire enregistrée en interpolant entre deux échantillons.
 * Renvoie `null` une fois la piste terminée.
 */
export class GhostPlayer {
  private elapsed = 0;

  constructor(private readonly samples: readonly GhostSample[]) {}

  get isEmpty(): boolean {
    return this.samples.length < 2;
  }

  reset(): void {
    this.elapsed = 0;
  }

  update(deltaMs: number): GhostSample | null {
    if (this.isEmpty) return null;
    this.elapsed += deltaMs;

    const position = this.elapsed / GHOST_SAMPLE_MS;
    const index = Math.floor(position);
    if (index >= this.samples.length - 1) return null;

    const ratio = position - index;
    const from = this.samples[index];
    const to = this.samples[index + 1];
    return {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio
    };
  }
}
