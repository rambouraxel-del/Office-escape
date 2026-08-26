import { Save } from './save';

export interface Settings {
  /** Coupe entièrement la synthèse audio. */
  muted: boolean;
  /** Réduit flashs, secousses et tweens agressifs. */
  reducedMotion: boolean;
  /** Ajoute des hachures aux cônes en alerte (deutéranopie / protanopie). */
  colorBlindMode: boolean;
  /** Multiplicateur de taille des textes d'interface. */
  textScale: number;
  /** Côté du joystick. */
  joystickSide: 'left' | 'right';
  vibrations: boolean;
  /** Bulles d'aide en jeu. Activées par défaut : elles servent au premier essai. */
  tutorials: boolean;
  /**
   * Rejoue le meilleur parcours en surimpression. DÉSACTIVÉ par défaut :
   * l'enregistrement, lui, continue toujours, donc on peut l'allumer plus tard
   * et retrouver son record.
   */
  ghost: boolean;
}

const DEFAULTS: Settings = {
  muted: false,
  reducedMotion: false,
  colorBlindMode: false,
  textScale: 1,
  joystickSide: 'left',
  vibrations: true,
  tutorials: true,
  ghost: false
};

function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

let current: Settings = { ...DEFAULTS };

export const SettingsStore = {
  load(): Settings {
    const stored = Save.readSettings<Partial<Settings>>({});
    current = {
      ...DEFAULTS,
      // Le réglage système fait foi tant que le joueur n'a rien choisi.
      reducedMotion: prefersReducedMotion(),
      ...stored
    };
    current.textScale = Math.min(1.4, Math.max(0.9, current.textScale));
    return current;
  },

  get(): Settings {
    return current;
  },

  set<K extends keyof Settings>(key: K, value: Settings[K]): Settings {
    current = { ...current, [key]: value };
    Save.writeSettings(current);
    return current;
  },

  toggle(key: 'muted' | 'reducedMotion' | 'colorBlindMode' | 'vibrations' | 'tutorials' | 'ghost'): Settings {
    return SettingsStore.set(key, !current[key]);
  },

  reset(): Settings {
    current = { ...DEFAULTS, reducedMotion: prefersReducedMotion() };
    Save.writeSettings(current);
    return current;
  }
};
