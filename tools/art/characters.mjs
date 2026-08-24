/**
 * Personnages en pixel art.
 *
 * Vue du jeu : dessus strict pour le décor, mais personnages DE FACE — c'est la
 * convention des jeux 2D top-down (Zelda, RPG Maker) et la seule qui laisse
 * lire une expression. Aucune isométrie, aucun faux 3/4.
 *
 * Grille source 24×24, cuite ×2 dans un cadre de 64×64.
 * ATTENTION : le cadre de 64×64 est IMPOSÉ. `Body.setCircle()` conserve
 * l'offset (0,0) du corps, donc le cercle de collision est positionné par
 * rapport aux dimensions de la texture. Changer la taille du cadre
 * déplacerait toutes les collisions du jeu.
 */
import { PixelCanvas } from './canvas.mjs';

const W = 24;

/** Compose une ligne de sprite et vérifie sa largeur. */
function row(...parts) {
  const line = parts.map(([char, count]) => char.repeat(count)).join('');
  if (line.length !== W) {
    throw new Error(`Ligne de ${line.length} caractères au lieu de ${W} : « ${line} »`);
  }
  return line;
}

const pad = (n) => ['.', n];

/**
 * Silhouette commune. `big` élargit le corps (boss, vigile) : la caricature
 * passe d'abord par la silhouette, avant même la couleur.
 */
function body({ big = false, hairTop = 2, brow = null } = {}) {
  const rows = [];
  const shoulder = big ? 20 : 18;
  const side = (W - shoulder) / 2;

  // Crâne
  rows.push(row(pad(7), ['K', 10], pad(7)));
  rows.push(row(pad(5), ['K', 2], ['h', 10], ['K', 2], pad(5)));
  rows.push(row(pad(4), ['K', 1], ['h', 14], ['K', 1], pad(4)));
  for (let i = 0; i < hairTop; i += 1) {
    rows.push(row(pad(4), ['K', 1], ['h', 14], ['K', 1], pad(4)));
  }
  // Visage
  rows.push(row(pad(4), ['K', 1], ['h', 2], ['s', 10], ['h', 2], ['K', 1], pad(4)));
  rows.push(
    brow
      ? row(
          pad(4),
          ['K', 1],
          ['h', 2],
          ['s', 1],
          ['b', 3],
          ['s', 2],
          ['b', 3],
          ['s', 1],
          ['h', 2],
          ['K', 1],
          pad(4)
        )
      : row(pad(4), ['K', 1], ['h', 1], ['s', 12], ['h', 1], ['K', 1], pad(4))
  );
  rows.push(row(pad(4), ['K', 1], ['s', 3], ['e', 2], ['s', 4], ['e', 2], ['s', 3], ['K', 1], pad(4)));
  rows.push(row(pad(4), ['K', 1], ['s', 3], ['S', 2], ['s', 4], ['S', 2], ['s', 3], ['K', 1], pad(4)));
  rows.push(row(pad(4), ['K', 1], ['s', 5], ['m', 4], ['s', 5], ['K', 1], pad(4)));
  rows.push(row(pad(4), ['K', 1], ['s', 14], ['K', 1], pad(4)));
  rows.push(row(pad(5), ['K', 1], ['s', 12], ['K', 1], pad(5)));
  rows.push(row(pad(5), ['K', 14], pad(5)));

  // Buste : épaules, bras, torse. Les largeurs se déduisent des épaules pour
  // que la silhouette « large » reste juste sans recompter à la main.
  const inner = shoulder - 2;
  const armW = big ? 3 : 3;
  const torsoW = inner - armW * 2;
  rows.push(row(pad(side), ['K', shoulder], pad(side)));
  for (let i = 0; i < 5; i += 1) {
    const collar = i === 0;
    rows.push(
      row(
        pad(side),
        ['K', 1],
        ['a', armW],
        collar ? ['w', 2] : ['c', 2],
        ['c', torsoW - 4],
        collar ? ['w', 2] : ['c', 2],
        ['a', armW],
        ['K', 1],
        pad(side)
      )
    );
  }
  // Mains
  rows.push(row(pad(side), ['K', 1], ['s', armW], ['c', torsoW], ['s', armW], ['K', 1], pad(side)));
  rows.push(row(pad(side), ['K', shoulder], pad(side)));

  // Jambes et pieds
  const legPad = side + 3;
  const legWidth = (W - legPad * 2 - 2) / 2;
  rows.push(row(pad(legPad), ['p', legWidth], ['K', 2], ['p', legWidth], pad(legPad)));
  rows.push(row(pad(legPad), ['o', legWidth], ['K', 2], ['o', legWidth], pad(legPad)));
  rows.push(row(pad(legPad), ['K', legWidth], ['K', 2], ['K', legWidth], pad(legPad)));

  while (rows.length < W) rows.push(row(pad(W)));
  return rows.slice(0, W);
}

/**
 * Repères anatomiques déduits de la silhouette.
 * Les accessoires s'y accrochent : sans ça, une frange plus haute décale
 * lunettes et moustache sur le col — c'est exactement ce qui s'est produit.
 */
function anatomyOf(hairTop) {
  const eyes = 3 + hairTop + 2;
  return {
    hairTop: 0,
    hairBottom: 2 + hairTop,
    face: eyes - 2,
    brow: eyes - 1,
    eyes,
    mouth: eyes + 2,
    chin: eyes + 5,
    shoulders: eyes + 6,
    torso: eyes + 8
  };
}

function overlayTie(canvas, colorKey, anatomy) {
  const top = anatomy.shoulders + 1;
  canvas.rect(11, top, 2, 5, colorKey);
  canvas.set(11, top + 5, colorKey);
}

/** Grosses lunettes rondes : la lecture doit tenir à 24 pixels de haut. */
function overlayGlasses(canvas, anatomy) {
  const y = anatomy.eyes - 1;
  canvas.stroke(6, y, 5, 4, 'ink');
  canvas.stroke(13, y, 5, 4, 'ink');
  canvas.hLine(11, y + 1, 2, 'ink');
  canvas.rect(7, y + 1, 3, 2, 'glass');
  canvas.rect(14, y + 1, 3, 2, 'glass');
}

function overlayMoustache(canvas, colorKey, anatomy) {
  const y = anatomy.mouth - 1;
  canvas.hLine(7, y, 10, colorKey);
  canvas.hLine(6, y + 1, 4, colorKey);
  canvas.hLine(14, y + 1, 4, colorKey);
}

/** Bouche grande ouverte : le bavard se reconnaît sans lire son étiquette. */
function overlayOpenMouth(canvas, anatomy) {
  canvas.rect(9, anatomy.mouth - 1, 6, 4, 'ink');
  canvas.rect(10, anatomy.mouth, 4, 2, 'alertDark');
  canvas.hLine(10, anatomy.mouth - 1, 4, 'paper');
}

function overlayCap(canvas, colorKey, darkKey, anatomy) {
  canvas.rect(5, 1, 14, anatomy.hairBottom, colorKey);
  canvas.hLine(6, 0, 12, 'ink');
  canvas.rect(4, anatomy.hairBottom + 1, 16, 1, darkKey);
  canvas.hLine(4, anatomy.hairBottom + 2, 16, 'ink');
}

function overlayHeadphones(canvas, colorKey, anatomy) {
  canvas.hLine(6, 0, 12, colorKey);
  canvas.set(5, 1, colorKey).set(18, 1, colorKey);
  canvas.rect(3, anatomy.face, 2, 4, colorKey);
  canvas.rect(19, anatomy.face, 2, 4, colorKey);
  canvas.vLine(4, 2, anatomy.face - 2, colorKey);
  canvas.vLine(19, 2, anatomy.face - 2, colorKey);
}

function overlayBadge(canvas, colorKey, anatomy) {
  canvas.rect(15, anatomy.torso, 2, 3, colorKey);
  canvas.set(15, anatomy.torso - 1, 'metalDark');
}

/**
 * Personnage à sa résolution native (32×32), avant agrandissement.
 * Utile pour composer des scènes en résolution d'art, comme le fond du menu.
 * @param {object} spec
 * @returns {PixelCanvas} 32×32
 */
export function makeCharacterSource(spec) {
  const legend = {
    '.': null,
    K: 'ink',
    h: spec.hair,
    s: 'skin',
    S: 'skinShade',
    e: 'ink',
    m: spec.mouth ?? 'coralDark',
    b: spec.brow ?? spec.hair,
    c: spec.cloth,
    a: spec.clothDark,
    w: 'paper',
    p: spec.pants,
    o: 'ink'
  };

  const hairTop = spec.hairTop ?? 2;
  const anatomy = anatomyOf(hairTop);

  const source = new PixelCanvas(W, W);
  source.draw(body({ big: spec.big, hairTop, brow: spec.brow }), legend);

  if (spec.glasses) overlayGlasses(source, anatomy);
  if (spec.moustache) overlayMoustache(source, spec.moustacheColor ?? spec.hair, anatomy);
  if (spec.openMouth) overlayOpenMouth(source, anatomy);
  if (spec.cap) overlayCap(source, spec.cap, spec.capDark ?? 'navyDark', anatomy);
  if (spec.headphones) overlayHeadphones(source, spec.headphones, anatomy);
  if (spec.tie) overlayTie(source, spec.tie, anatomy);
  if (spec.badge) overlayBadge(source, spec.badge, anatomy);

  // Ombre portée au sol : ancre le personnage sans casser la vue de dessus.
  const framed = new PixelCanvas(32, 32);
  for (let x = 8; x < 24; x += 1) {
    const edge = x < 10 || x >= 22;
    framed.set(x, 27, 'ink', edge ? 0.12 : 0.22);
    if (!edge) framed.set(x, 28, 'ink', 0.16);
  }
  framed.blit(source, 4, 2);

  return framed;
}

/**
 * Personnage prêt pour le jeu.
 * @returns {PixelCanvas} 64×64 — dimensions IMPOSÉES, voir l'en-tête du fichier.
 */
export function makeCharacter(spec) {
  return makeCharacterSource(spec).scale(2);
}

/** Les six rôles du jeu. La silhouette et l'accessoire priment sur la couleur. */
export const CHARACTERS = {
  // Joueur : petit, énergique, mèche en bataille, chemise turquoise.
  'char-player': {
    hair: 'hairDark',
    cloth: 'teal',
    clothDark: 'tealDark',
    pants: 'navy',
    tie: 'gold',
    hairTop: 2
  },
  // Collègue : grosses lunettes rondes, pull corail, l'air ravi de parler.
  'char-colleague': {
    hair: 'hairRed',
    cloth: 'coral',
    clothDark: 'coralDark',
    pants: 'navyDark',
    glasses: true,
    hairTop: 2
  },
  // Boss : plus large, moustache, sourcils froncés, costume prune.
  'char-boss': {
    hair: 'hairGrey',
    cloth: 'plum',
    clothDark: 'plumDark',
    pants: 'ink',
    tie: 'gold',
    moustache: true,
    moustacheColor: 'hairGrey',
    brow: 'hairGrey',
    big: true,
    hairTop: 1
  },
  // Stagiaire : casque sur les oreilles, sweat bleu.
  'char-intern': {
    hair: 'hairBlond',
    cloth: 'blue',
    clothDark: 'blueDark',
    pants: 'navy',
    headphones: 'ink',
    hairTop: 2
  },
  // Vigile : carrure large, casquette, uniforme sombre, badge.
  'char-guard': {
    hair: 'hairDark',
    cloth: 'navy',
    clothDark: 'navyDark',
    pants: 'ink',
    cap: 'navyLight',
    badge: 'gold',
    brow: 'hairDark',
    big: true,
    hairTop: 1
  },
  // Collègue bavard : bouche grande ouverte, chemise claire.
  'char-talker': {
    hair: 'hairRed',
    cloth: 'coralLight',
    clothDark: 'coral',
    pants: 'woodDark',
    openMouth: true,
    hairTop: 3
  }
};
