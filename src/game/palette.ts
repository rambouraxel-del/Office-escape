import paletteJson from './palette.json';

/**
 * Palette pixel art, typée pour le jeu.
 *
 * `palette.json` est la source de vérité unique : le générateur de sprites
 * (`tools/art/`) lit le même fichier. Une couleur qui n'est pas ici n'a pas le
 * droit d'exister dans le jeu.
 */
const RAW = paletteJson as Record<string, string>;

export type PaletteKey = Exclude<keyof typeof paletteJson, '$comment'>;

/** Convertit `#rrggbb` en entier Phaser (0xrrggbb). */
function toInt(value: string): number {
  return Number.parseInt(value.slice(1), 16);
}

/** Couleur en entier, pour Phaser. */
export function color(key: PaletteKey): number {
  return toInt(RAW[key]);
}

/** Couleur en `#rrggbb`, pour les styles de texte. */
export function hex(key: PaletteKey): string {
  return RAW[key];
}

/** Toutes les couleurs en entier, pratique pour les tables de correspondance. */
export const PALETTE = Object.fromEntries(
  Object.entries(RAW)
    .filter(([key]) => key !== '$comment')
    .map(([key, value]) => [key, toInt(value)])
) as Record<PaletteKey, number>;
