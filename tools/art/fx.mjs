/**
 * Retours visuels animés : émotions des PNJ, ramassage, indice d'interaction.
 *
 * Ce sont les seuls sprites que le joueur voit APPARAÎTRE en cours de partie ;
 * ils doivent donc se lire en une fraction de seconde, à bout de bras, sans
 * concurrencer les cônes de vision. D'où le parti pris : une glyphe épaisse,
 * cernée d'encre, et rien d'autre.
 *
 * Rappel de la règle de réserve : `gold` = vigilance, `alert` = repéré. Aucune
 * autre partie du jeu n'a le droit d'utiliser ces deux teintes.
 */
import { PixelCanvas, padRows, strip } from './canvas.mjs';

const S = 16;

const L = {
  '.': null,
  K: 'ink',
  y: 'gold',
  Y: 'goldDark',
  r: 'alert',
  R: 'alertDark',
  w: 'paper',
  W: 'paperDim',
  t: 'tealLight'
};

function glyph(rows) {
  const canvas = new PixelCanvas(S, S);
  canvas.draw(padRows(rows, S), L);
  return canvas;
}

/** Décale une glyphe verticalement : le rebond se fait sans la redessiner. */
function shifted(canvas, dy) {
  return new PixelCanvas(S, S).blit(canvas, 0, dy);
}

// ─────────────────────────── émotions des PNJ ───────────────────────────

/** « ? » — suspicion : il a cru voir quelque chose. */
const QUESTION = glyph([
  '....KKKKKK',
  '...KyyyyyyK',
  '..KyyYYYYyyK',
  '..KyyKKKKyyK',
  '..KKK...KyyK',
  '.......KyyyK',
  '......KyyyK',
  '......KyyK',
  '......KyK',
  '......KKK',
  '',
  '.....KKKK',
  '.....KyyK',
  '.....KYyK',
  '.....KKKK'
]);

/** « ! » — alerte : il t'a vu, franchement. */
const EXCLAM = glyph([
  '.....KKKK',
  '....KrrrrK',
  '....KrRRrK',
  '....KrRRrK',
  '....KrRRrK',
  '....KrRRrK',
  '.....KrrK',
  '.....KrrK',
  '.....KKK',
  '',
  '....KKKK',
  '....KrrK',
  '....KrRK',
  '....KKKK'
]);

/** « … » — fouille : il cherche encore, mais il ne sait plus où. */
function dots(count) {
  const canvas = new PixelCanvas(S, S);
  for (let i = 0; i < count; i += 1) {
    const x = 3 + i * 4;
    canvas.stroke(x, 6, 4, 4, 'ink');
    canvas.rect(x + 1, 7, 2, 2, 'paper');
  }
  return canvas;
}

// ────────────────────────────── ramassage ───────────────────────────────

/** Éclat de ramassage : quatre frames, du point à l'anneau qui s'efface. */
function spark(step) {
  const canvas = new PixelCanvas(S, S);
  const c = 7;
  if (step === 0) {
    canvas.rect(c, c - 1, 2, 4, 'paper');
    canvas.rect(c - 1, c, 4, 2, 'paper');
    return canvas;
  }
  const radius = 1 + step * 2;
  const alpha = 1 - step * 0.25;
  canvas.circle(c, c, radius, 'paper', alpha);
  canvas.circle(c, c, radius - 1, 'gold', alpha * 0.7);
  return canvas;
}

// ──────────────────────── indice d'interaction ──────────────────────────

/**
 * Halo discret sur un élément avec lequel on peut interagir.
 * Volontairement pâle : le jeu ne doit pas virer au sapin de Noël.
 */
function hint(step) {
  const canvas = new PixelCanvas(S, S);
  const radius = 4 + (step < 3 ? step : 1);
  const alpha = 0.55 - step * 0.1;
  canvas.circle(7, 7, radius, 'tealLight', alpha);
  // Chevron central : la direction de l'action, même sans l'anneau.
  canvas.draw(padRows(['......KK', '.....KttK', '....KttttK', '....K....K'], S), L, 1, 5);
  return canvas;
}

/**
 * Halo lumineux : un disque à dégradé, utilisé en fondu additif.
 *
 * C'est LA brique d'éclairage du parking. Un seul sprite, réutilisé et
 * redimensionné : aucune texture générée à l'exécution, aucun shader, rien qui
 * coûte quoi que ce soit sur un téléphone.
 */
export function makeLight() {
  // 64 pixels d'art : agrandi à 400 unités de monde, un disque de 32 montrait
  // ses marches d'escalier.
  const size = 64;
  const centre = (size - 1) / 2;
  const canvas = new PixelCanvas(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - centre, y - centre) / centre;
      if (distance >= 1) continue;
      // Décroissance au carré : un halo linéaire fait un disque plat et faux.
      const falloff = (1 - distance) * (1 - distance);
      canvas.set(x, y, distance < 0.35 ? 'lampGlow' : 'neonTube', falloff);
    }
  }
  return canvas;
}

/**
 * Planches d'effets. Chaque entrée est une bande horizontale de frames de
 * 16×16 (32×32 une fois cuite), déclarée côté jeu dans `animations.ts`.
 */
export const FX_SHEETS = {
  // 0-1 suspicion · 2-3 alerte · 4-6 fouille · 7 vide
  'fx-emote': () =>
    strip([
      QUESTION,
      shifted(QUESTION, 1),
      EXCLAM,
      shifted(EXCLAM, 1),
      dots(1),
      dots(2),
      dots(3),
      new PixelCanvas(S, S)
    ]),
  'fx-pickup': () => strip([0, 1, 2, 3].map(spark)),
  'fx-hint': () => strip([0, 1, 2, 3].map(hint))
};
