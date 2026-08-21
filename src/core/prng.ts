/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 *
 * Indispensable pour le Défi du jour : à seed égale, la partie doit être
 * identique pour tout le monde. `Math.random()` est banni du gameplay.
 */
export class Prng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  /** Flottant dans [0, 1[. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Flottant dans [min, max[. */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Entier dans [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Vrai avec la probabilité donnée (0 → jamais, 1 → toujours). */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

/** Hash 32 bits stable d'une chaîne (FNV-1a). */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Clé calendaire locale `AAAA-MM-JJ`, base du Défi du jour. */
export function dailyKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dailySeed(date = new Date()): number {
  return hashString(`office-escape:${dailyKey(date)}`);
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
