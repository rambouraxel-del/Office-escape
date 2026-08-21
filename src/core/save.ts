/**
 * Accès unique au stockage local.
 *
 * Toute lecture/écriture passe par ici : le `try/catch` (navigation privée iOS,
 * stockage bloqué) n'est écrit qu'une fois, et le schéma est versionné pour
 * permettre les migrations.
 */

const NAMESPACE = 'office-escape:v1';
const LEGACY_KEYS = ['office-escape-tutorial-v04', 'office-escape-best-v05'];

export interface RunRecord {
  minutes: number;
  score: number;
  stars: number;
  at: string;
}

export interface GhostSample {
  x: number;
  y: number;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(`${NAMESPACE}:${key}`);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(`${NAMESPACE}:${key}`, value);
  } catch {
    /* Le jeu reste jouable sans persistance. */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(`${NAMESPACE}:${key}`);
  } catch {
    /* idem */
  }
}

function readJson<T>(key: string, fallback: T): T {
  const raw = read(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const Save = {
  /** Reprend l'ancien meilleur temps (clés V0.5) puis efface les clés obsolètes. */
  migrateLegacy(): void {
    try {
      const legacyBest = localStorage.getItem('office-escape-best-v05');
      if (legacyBest !== null && read('record:level-01') === null) {
        const minutes = Number(legacyBest);
        if (Number.isFinite(minutes)) {
          write('record:level-01', JSON.stringify({ minutes, score: 0, stars: 0, at: 'legacy' }));
        }
      }
      if (localStorage.getItem('office-escape-tutorial-v04') === 'done') {
        write('tutorials-done:level-01', '1');
      }
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* rien à migrer si le stockage est indisponible */
    }
  },

  getRecord(levelId: string): RunRecord | null {
    return readJson<RunRecord | null>(`record:${levelId}`, null);
  },

  setRecord(levelId: string, record: RunRecord): void {
    write(`record:${levelId}`, JSON.stringify(record));
  },

  getDailyRecord(dayKey: string): RunRecord | null {
    return readJson<RunRecord | null>(`daily:${dayKey}`, null);
  },

  setDailyRecord(dayKey: string, record: RunRecord): void {
    write(`daily:${dayKey}`, JSON.stringify(record));
  },

  getGhost(levelId: string): GhostSample[] | null {
    return readJson<GhostSample[] | null>(`ghost:${levelId}`, null);
  },

  setGhost(levelId: string, samples: GhostSample[]): void {
    write(`ghost:${levelId}`, JSON.stringify(samples));
  },

  isLevelUnlocked(levelId: string, index: number): boolean {
    if (index === 0) return true;
    return read(`cleared:${levelId}`) === '1';
  },

  markCleared(levelId: string): void {
    write(`cleared:${levelId}`, '1');
  },

  /** Les tutoriels sont suivis PAR NIVEAU : chaque niveau introduit ses mécaniques. */
  areTutorialsDone(levelId: string): boolean {
    return read(`tutorials-done:${levelId}`) === '1';
  },

  markTutorialsDone(levelId: string): void {
    write(`tutorials-done:${levelId}`, '1');
  },

  readSettings<T>(fallback: T): T {
    return readJson<T>('settings', fallback);
  },

  writeSettings(value: unknown): void {
    write('settings', JSON.stringify(value));
  },

  /** Efface progression, records et fantômes. Les réglages sont conservés. */
  resetProgress(levelIds: string[]): void {
    levelIds.forEach((levelId) => {
      remove(`tutorials-done:${levelId}`);
      remove(`record:${levelId}`);
      remove(`ghost:${levelId}`);
      remove(`cleared:${levelId}`);
    });
  }
};
