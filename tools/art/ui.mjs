/**
 * Habillage d'interface en pixel art.
 *
 * Deux familles :
 *  - des panneaux en 9 tranches (`nineslice` Phaser), qui s'étirent sans
 *    déformer leurs coins — indispensable pour des panneaux de taille variable ;
 *  - des boutons ronds et une police chiffrée, cuits à taille fixe.
 */
import { PixelCanvas, fromRows, padRows } from './canvas.mjs';

/** Disque tramé, avec bord net : un cercle « propre » en pixel art. */
function pixelDisc(radius, fill, edge, highlight) {
  const size = radius * 2;
  const canvas = new PixelCanvas(size, size);
  const center = radius - 0.5;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      if (distance > radius - 0.5) continue;
      if (distance > radius - 2.5) {
        canvas.set(x, y, edge);
        continue;
      }
      // Reflet en croissant : une source lumineuse en haut à gauche, plutôt
      // qu'une coupe horizontale qui ferait ressembler le bouton à une jauge.
      const lit = Math.hypot(x - (center - radius * 0.34), y - (center - radius * 0.38));
      if (highlight && lit < radius * 0.52) canvas.set(x, y, highlight);
      else canvas.set(x, y, fill);
    }
  }
  return canvas;
}

/**
 * Panneau en 9 tranches : coins de `corner` pixels, centre étirable.
 * Le motif du centre doit rester uni, sinon l'étirement le déforme.
 */
function ninePanel({ size = 12, corner = 4, fill, edge, inner, highlight }) {
  const canvas = new PixelCanvas(size, size).fill(fill);
  canvas.stroke(0, 0, size, size, edge);
  canvas.stroke(1, 1, size - 2, size - 2, inner ?? fill);
  if (highlight) {
    canvas.hLine(2, 1, size - 4, highlight, 0.5);
    canvas.vLine(1, 2, size - 4, highlight, 0.35);
  }
  // Coins mordus : la silhouette cesse d'être un rectangle parfait.
  canvas.set(0, 0, null).set(size - 1, 0, null);
  canvas.set(0, size - 1, null).set(size - 1, size - 1, null);
  canvas.set(1, 1, edge).set(size - 2, 1, edge);
  canvas.set(1, size - 2, edge).set(size - 2, size - 2, edge);
  void corner;
  return canvas;
}

const D = { '.': null, X: 'paper' };

/** Chiffres 8×12 pour l'horloge. Teintés à l'exécution via `setTint`. */
const DIGITS = [
  [
    '.XXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXX.'
  ],
  [
    '...XXX..',
    '..XXXX..',
    '.XXXXX..',
    '...XXX..',
    '...XXX..',
    '...XXX..',
    '...XXX..',
    '...XXX..',
    '...XXX..',
    '...XXX..',
    '.XXXXXXX',
    '.XXXXXXX'
  ],
  [
    '.XXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    '......XX',
    '.....XX.',
    '....XX..',
    '...XX...',
    '..XX....',
    '.XX.....',
    'XX......',
    'XXXXXXXX',
    'XXXXXXXX'
  ],
  [
    'XXXXXXXX',
    'XXXXXXXX',
    '.....XX.',
    '....XX..',
    '...XXXX.',
    '....XXXX',
    '......XX',
    '......XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXX.'
  ],
  [
    '....XXX.',
    '...XXXX.',
    '..XX.XX.',
    '.XX..XX.',
    'XX...XX.',
    'XX...XX.',
    'XXXXXXXX',
    'XXXXXXXX',
    '.....XX.',
    '.....XX.',
    '.....XX.',
    '.....XX.'
  ],
  [
    'XXXXXXXX',
    'XXXXXXXX',
    'XX......',
    'XX......',
    'XXXXXXX.',
    'XXXXXXXX',
    '......XX',
    '......XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXX.'
  ],
  [
    '..XXXXX.',
    '.XXXXXXX',
    '.XX.....',
    'XX......',
    'XXXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXX.'
  ],
  [
    'XXXXXXXX',
    'XXXXXXXX',
    '.....XX.',
    '.....XX.',
    '....XX..',
    '....XX..',
    '...XX...',
    '...XX...',
    '..XX....',
    '..XX....',
    '..XX....',
    '..XX....'
  ],
  [
    '.XXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    'XX....XX',
    '.XXXXXX.',
    '.XXXXXX.',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXX.'
  ],
  [
    '.XXXXXX.',
    'XXXXXXXX',
    'XX....XX',
    'XX....XX',
    'XX....XX',
    'XXXXXXXX',
    '.XXXXXXX',
    '......XX',
    '.....XX.',
    '....XX..',
    '.XXXXX..',
    '.XXXX...'
  ],
  [
    '........',
    '........',
    '..XX....',
    '..XX....',
    '........',
    '........',
    '........',
    '..XX....',
    '..XX....',
    '........',
    '........',
    '........'
  ]
];

/** Planche de 11 glyphes : « 0 » à « 9 » puis « : ». */
function digitSheet() {
  const sheet = new PixelCanvas(8 * DIGITS.length, 12);
  DIGITS.forEach((glyph, index) => {
    sheet.blit(fromRows(padRows(glyph, 8), D), index * 8, 0);
  });
  return sheet;
}

export const UI = {
  // Panneaux étirables
  'ui-panel': () => ninePanel({ fill: 'paper', edge: 'ink', inner: 'paperDim', highlight: 'paper' }),
  'ui-panel-dark': () =>
    ninePanel({ fill: 'hudPanel', edge: 'ink', inner: 'hudPanelLight', highlight: 'hudEdge' }),
  'ui-panel-inset': () => ninePanel({ fill: 'hudInset', edge: 'ink', inner: 'hudPanel' }),
  'ui-button': () => ninePanel({ fill: 'teal', edge: 'ink', inner: 'tealDark', highlight: 'tealLight' }),
  'ui-button-warm': () =>
    ninePanel({ fill: 'coral', edge: 'ink', inner: 'coralDark', highlight: 'coralLight' }),
  'ui-button-muted': () =>
    ninePanel({ fill: 'navyLight', edge: 'ink', inner: 'navyDark', highlight: 'metalLight' }),

  // Commandes tactiles
  'ui-stick-base': () => pixelDisc(36, 'hudPanel', 'ink', 'hudPanelLight'),
  'ui-stick-knob': () => pixelDisc(16, 'hudPanelLight', 'ink', 'hudEdge'),
  'ui-btn-run': () => pixelDisc(22, 'teal', 'ink', 'tealLight'),
  'ui-btn-run-on': () => pixelDisc(22, 'tealLight', 'ink', 'paper'),
  'ui-btn-action': () => pixelDisc(24, 'gold', 'ink', 'paper'),
  'ui-btn-pause': () => pixelDisc(11, 'navyLight', 'ink', 'metalLight'),

  // Horloge
  'ui-digits': () => digitSheet()
};

export const DIGIT_FRAME = { width: 8, height: 12, count: DIGITS.length };
