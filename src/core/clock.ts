/**
 * Horloge de jeu : convertit un temps réel écoulé en heure de bureau.
 *
 * Extraite de la scène pour être testable et pour que la règle anti-exploit
 * de la pause (`penaltyMinutes`) vive au même endroit que le calcul du score.
 */
export class GameClock {
  private elapsedMs = 0;
  private penaltyMinutes = 0;

  constructor(
    private readonly startHour: number,
    private readonly startMinute: number,
    private readonly msPerMinute: number
  ) {}

  advance(deltaMs: number): void {
    this.elapsedMs += deltaMs;
  }

  /** Pénalité de gameplay (dialogue raté, mise en pause manuelle). */
  addPenaltyMinutes(minutes: number): void {
    this.penaltyMinutes += minutes;
  }

  /** Minutes de jeu écoulées depuis le début, pénalités comprises. */
  get elapsedMinutes(): number {
    return Math.floor(this.elapsedMs / this.msPerMinute) + this.penaltyMinutes;
  }

  get totalMinutes(): number {
    return this.startHour * 60 + this.startMinute + this.elapsedMinutes;
  }

  /** Progression dans la minute courante, pour une aiguille fluide. */
  get minuteProgress(): number {
    return (this.elapsedMs % this.msPerMinute) / this.msPerMinute;
  }

  format(): string {
    return formatMinutes(this.totalMinutes);
  }

  reachedHour(hour: number): boolean {
    return this.totalMinutes >= hour * 60;
  }

  reset(): void {
    this.elapsedMs = 0;
    this.penaltyMinutes = 0;
  }
}

export function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safe / 60) % 24;
  const minutes = safe % 60;
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`;
}
