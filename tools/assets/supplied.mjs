/**
 * Table de transport : quel fichier FOURNI devient quelle texture du jeu.
 *
 * C'est le seul endroit qui relie un livrable graphique à une clé du moteur.
 * Ajouter un asset fourni, c'est ajouter une ligne ici — jamais du code.
 *
 * `kind: 'character'` déclenche la recomposition 6×3 → 8×3 (voir `import.mjs`).
 * Tout le reste est transporté tel quel, à la décimation près.
 */
export const SUPPLIED = [
  // ── Personnages. Six planches couvrent les six archétypes du jeu. Depuis la
  // V0.12 il n'en reste qu'un à partager : le collègue bavard emprunte la
  // planche RH en attendant la sienne (`ASSET_TODO: char_collegue_bavard`).
  { key: 'char-player', group: 'characters', kind: 'character', source: 'characters/char-player-v011.png' },
  {
    key: 'char-colleague',
    group: 'characters',
    kind: 'character',
    source: 'characters/char-colleague-v011.png'
  },
  { key: 'char-boss', group: 'characters', kind: 'character', source: 'characters/char-boss-v011.png' },
  { key: 'char-guard', group: 'characters', kind: 'character', source: 'characters/char-security-v011.png' },
  { key: 'char-hr', group: 'characters', kind: 'character', source: 'characters/char-hr-v011.png' },
  { key: 'char-tech', group: 'characters', kind: 'character', source: 'characters/char-it-v011.png' },

  // ── Sols. Les dix motifs fournis remplacent les motifs générés de même rôle.
  { key: 'tile-carpet-blue', group: 'tiles', source: 'architecture/floor-carpet-blue.png' },
  { key: 'tile-carpet-grey', group: 'tiles', source: 'architecture/floor-carpet-gray.png' },
  { key: 'tile-concrete', group: 'tiles', source: 'architecture/floor-concrete.png' },
  { key: 'tile-floor-alt', group: 'tiles', source: 'architecture/floor-dark.png' },
  { key: 'tile-kitchen', group: 'tiles', source: 'architecture/floor-kitchen.png' },
  { key: 'tile-slab', group: 'tiles', source: 'architecture/floor-light.png' },
  { key: 'tile-paving', group: 'tiles', source: 'architecture/floor-paving.png' },
  { key: 'tile-bathroom', group: 'tiles', source: 'architecture/floor-restroom.png' },
  { key: 'tile-rubber', group: 'tiles', source: 'architecture/floor-rubber.png' },
  { key: 'tile-parquet', group: 'tiles', source: 'architecture/floor-wood.png' },

  // ── Mobilier et accessoires.
  { key: 'prop-workstation', group: 'props', source: 'furniture/desk-standard.png' },
  { key: 'prop-chair', group: 'props', source: 'furniture/chair-blue.png' },
  { key: 'prop-monitor', group: 'props', source: 'props/monitor-office-a.png' },
  { key: 'prop-filebox', group: 'props', source: 'props/filebox-blue-a.png' },
  { key: 'prop-stapler', group: 'props', source: 'props/stapler-a.png' },
  { key: 'prop-mug', group: 'props', source: 'props/mug-coffee-a.png' },
  { key: 'prop-sticky', group: 'props', source: 'props/sticky-notes-a.png' }
];

/**
 * Assets fournis que le jeu ne transporte PAS encore, avec la raison.
 *
 * Les murs livrés sont des segments d'un jeu de tuiles : course horizontale,
 * course verticale, angles rentrant et sortant, T, embout. Le moteur, lui,
 * habille des RECTANGLES de taille arbitraire en étirant un motif. Brancher
 * les segments demanderait un auto-tuilage complet, donc un changement de
 * format de niveau — c'est un chantier de version, pas une passe d'assets.
 * Les murs générés restent en place en attendant.
 */
// ASSET_TODO: mur_top_down_raccordable
export const NOT_TRANSPORTED = [
  {
    files: [
      'architecture/wall-h-gray-a.png',
      'architecture/wall-h-gray-b.png',
      'architecture/wall-h-light-a.png',
      'architecture/wall-h-light-b.png',
      'architecture/wall-h-wood-a.png',
      'architecture/wall-h-wood-b.png',
      'architecture/wall-v-gray.png',
      'architecture/wall-v-light.png',
      'architecture/wall-v-white.png',
      'architecture/wall-inner-a.png',
      'architecture/wall-inner-b.png',
      'architecture/wall-outer-a.png',
      'architecture/wall-t.png',
      'architecture/wall-endcap.png'
    ],
    reason:
      'jeu de tuiles de murs : demande un auto-tuilage, donc un changement de format de niveau'
  }
];
