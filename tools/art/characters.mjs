/**
 * Personnages en pixel art — planches d'animation.
 *
 * Vue du jeu : dessus strict pour le décor, mais personnages DE FACE — c'est la
 * convention des jeux 2D top-down (Zelda, RPG Maker) et la seule qui laisse
 * lire une expression. Aucune isométrie, aucun faux 3/4.
 *
 * Chaque rôle produit UNE planche de 8 colonnes × 3 lignes :
 *
 *   colonnes  0-1 repos · 2-5 marche · 6-7 sursaut
 *   lignes    0 face (bas) · 1 tournée (droite, miroir pour la gauche) · 2 dos (haut)
 *
 * Grille source 32×32 par frame, cuite ×2 → frames de 64×64 en jeu.
 * ATTENTION : la frame de 64×64 est IMPOSÉE. `Body.setCircle()` conserve
 * l'offset (0,0) du corps, donc le cercle de collision est positionné par
 * rapport aux dimensions de la FRAME. Changer ce gabarit déplacerait toutes
 * les collisions du jeu.
 *
 * La tête (la partie expressive) reste écrite en ASCII lisible ; le buste et
 * les jambes sont paramétriques, parce qu'ils changent à chaque pose.
 */
import { PixelCanvas } from './canvas.mjs';

/** Côté d'une frame, en pixels d'art. */
export const FRAME = 32;
/** Colonnes d'une planche : repos ×2, marche ×4, sursaut ×2. */
export const COLUMNS = 8;
/** Lignes d'une planche, dans cet ordre. */
export const VIEWS = ['down', 'side', 'up'];

const TOP = 2; // haut du crâne
const HEAD_H = 13; // hauteur de tête CONSTANTE : c'est elle qui aligne tout le reste
const HEAD_W = 16;
const SHOULDER_Y = TOP + HEAD_H; // 15
const FOOT_Y = 25; // ligne de sol des pieds, au repos
const SHADOW_Y = 27;

/**
 * Les huit poses d'une ligne.
 * `bob` remonte le haut du corps (les pieds restent au sol, les jambes
 * s'allongent d'autant) ; `stride` avance une jambe ; `arms` balance les mains
 * d'un pixel, ou les lève (2).
 */
const POSES = [
  { bob: 0, stride: 0, arms: 0 }, // 0 repos, expiration
  { bob: 1, stride: 0, arms: 0 }, // 1 repos, inspiration
  { bob: 0, stride: 1, arms: 1 }, // 2 marche : appui gauche
  { bob: 1, stride: 0, arms: 0 }, // 3 marche : passage
  { bob: 0, stride: -1, arms: -1 }, // 4 marche : appui droit
  { bob: 1, stride: 0, arms: 0 }, // 5 marche : passage
  { bob: 1, stride: 0, arms: 2 }, // 6 sursaut : bras en l'air
  { bob: 0, stride: 0, arms: 2 } // 7 sursaut : retombée
];

/** Compose une ligne de sprite et vérifie sa largeur. */
function seg(width, ...parts) {
  const line = parts.map(([char, count]) => char.repeat(count)).join('');
  if (line.length !== width) {
    throw new Error(`Ligne de ${line.length} caractères au lieu de ${width} : « ${line} »`);
  }
  return line;
}

/**
 * Repères anatomiques, en lignes comptées depuis le haut du crâne.
 * Les accessoires s'y accrochent : sans ça, une frange plus haute décale
 * lunettes et moustache sur le col — c'est exactement ce qui s'était produit.
 */
function anatomyOf(hairTop) {
  return {
    hairBottom: 2 + hairTop,
    face: 3 + hairTop,
    brow: 4 + hairTop,
    eyes: 5 + hairTop,
    mouth: 7 + hairTop,
    chin: HEAD_H - 1
  };
}

// ──────────────────────────────── têtes ─────────────────────────────────

/** Tête de face. Hauteur constante : les lignes vides compensent la frange. */
function headRowsDown(hairTop, hasBrow) {
  const line = (...parts) => seg(HEAD_W, ...parts);
  const rows = [
    line(['.', 3], ['K', 10], ['.', 3]),
    line(['.', 1], ['K', 2], ['h', 10], ['K', 2], ['.', 1]),
    line(['K', 1], ['h', 14], ['K', 1])
  ];
  for (let i = 0; i < hairTop; i += 1) rows.push(line(['K', 1], ['h', 14], ['K', 1]));
  rows.push(line(['K', 1], ['h', 2], ['s', 10], ['h', 2], ['K', 1]));
  rows.push(
    hasBrow
      ? line(['K', 1], ['h', 2], ['s', 1], ['b', 3], ['s', 2], ['b', 3], ['s', 1], ['h', 2], ['K', 1])
      : line(['K', 1], ['h', 1], ['s', 12], ['h', 1], ['K', 1])
  );
  rows.push(line(['K', 1], ['s', 3], ['e', 2], ['s', 4], ['e', 2], ['s', 3], ['K', 1]));
  rows.push(line(['K', 1], ['s', 3], ['S', 2], ['s', 4], ['S', 2], ['s', 3], ['K', 1]));
  rows.push(line(['K', 1], ['s', 5], ['m', 4], ['s', 5], ['K', 1]));
  for (let i = 0; i < 3 - hairTop; i += 1) rows.push(line(['K', 1], ['s', 14], ['K', 1]));
  rows.push(line(['.', 1], ['K', 1], ['s', 12], ['K', 1], ['.', 1]));
  rows.push(line(['.', 1], ['K', 14], ['.', 1]));
  return rows;
}

/**
 * Tête TOURNÉE vers la droite (le miroir donne la gauche).
 *
 * Pas un profil strict : la masse de la tête reste identique à celle de face,
 * les cheveux glissent vers l'arrière et le visage vers l'avant. C'est ce qui
 * garde le rôle lisible — un profil de 12 pixels perdrait les deux yeux, donc
 * la caricature.
 */
function headRowsSide(hairTop, hasBrow) {
  const line = (...parts) => seg(HEAD_W, ...parts);
  const rows = [
    line(['.', 3], ['K', 10], ['.', 3]),
    line(['.', 1], ['K', 2], ['h', 10], ['K', 2], ['.', 1]),
    line(['K', 1], ['h', 14], ['K', 1])
  ];
  for (let i = 0; i < hairTop; i += 1) rows.push(line(['K', 1], ['h', 14], ['K', 1]));
  rows.push(line(['K', 1], ['h', 5], ['s', 9], ['K', 1]));
  rows.push(
    hasBrow
      ? line(['K', 1], ['h', 5], ['s', 1], ['b', 3], ['s', 2], ['b', 2], ['s', 1], ['K', 1])
      : line(['K', 1], ['h', 5], ['s', 9], ['K', 1])
  );
  rows.push(line(['K', 1], ['h', 5], ['s', 1], ['e', 2], ['s', 2], ['e', 2], ['s', 2], ['K', 1]));
  rows.push(line(['K', 1], ['h', 5], ['s', 1], ['S', 2], ['s', 2], ['S', 2], ['s', 2], ['K', 1]));
  rows.push(line(['K', 1], ['h', 5], ['s', 3], ['m', 3], ['s', 3], ['K', 1]));
  for (let i = 0; i < 3 - hairTop; i += 1) rows.push(line(['K', 1], ['h', 5], ['s', 9], ['K', 1]));
  rows.push(line(['.', 1], ['K', 1], ['h', 4], ['s', 8], ['K', 1], ['.', 1]));
  rows.push(line(['.', 1], ['K', 14], ['.', 1]));
  return rows;
}

/**
 * Tête de dos : la MÊME silhouette que de face, entièrement recouverte de
 * cheveux. Aucun visage à inventer, aucune ligne à recompter.
 */
function headRowsUp(hairTop) {
  return headRowsDown(hairTop, false).map((row) => row.replace(/[sSemb]/g, 'h'));
}

// ─────────────────────────────── accessoires ────────────────────────────

/*
 * Toutes les surcouches de tête reçoivent (canvas, ox, oy, anatomy) où
 * (ox, oy) est le coin haut-gauche de la BOÎTE DE TÊTE dans la frame. Elles
 * travaillent donc en coordonnées locales à la tête, et suivent
 * automatiquement la respiration du personnage.
 */

/** Grosses lunettes rondes : la lecture doit tenir à 24 pixels de haut. */
function glassesDown(c, ox, oy, a) {
  const y = oy + a.eyes - 1;
  c.stroke(ox + 2, y, 5, 4, 'ink');
  c.stroke(ox + 9, y, 5, 4, 'ink');
  c.hLine(ox + 7, y + 1, 2, 'ink');
  c.rect(ox + 3, y + 1, 3, 2, 'glass');
  c.rect(ox + 10, y + 1, 3, 2, 'glass');
}

function glassesSide(c, ox, oy, a) {
  const y = oy + a.eyes - 1;
  c.stroke(ox + 5, y, 5, 4, 'ink');
  c.stroke(ox + 10, y, 5, 4, 'ink');
  c.rect(ox + 6, y + 1, 3, 2, 'glass');
  c.rect(ox + 11, y + 1, 3, 2, 'glass');
  // Branche qui repart vers l'arrière : sans elle, la lunette flotte.
  c.hLine(ox + 2, y + 1, 3, 'ink');
}

function moustacheDown(c, ox, oy, a, key) {
  const y = oy + a.mouth - 1;
  c.hLine(ox + 3, y, 10, key);
  c.hLine(ox + 2, y + 1, 4, key);
  c.hLine(ox + 10, y + 1, 4, key);
}

function moustacheSide(c, ox, oy, a, key) {
  const y = oy + a.mouth - 1;
  c.hLine(ox + 6, y, 8, key);
  c.hLine(ox + 5, y + 1, 3, key);
  c.hLine(ox + 11, y + 1, 3, key);
}

/** Bouche grande ouverte : le bavard se reconnaît sans lire son étiquette. */
function openMouthDown(c, ox, oy, a) {
  c.rect(ox + 5, oy + a.mouth - 1, 6, 4, 'ink');
  c.rect(ox + 6, oy + a.mouth, 4, 2, 'alertDark');
  c.hLine(ox + 6, oy + a.mouth - 1, 4, 'paper');
}

function openMouthSide(c, ox, oy, a) {
  c.rect(ox + 8, oy + a.mouth - 1, 5, 4, 'ink');
  c.rect(ox + 9, oy + a.mouth, 3, 2, 'alertDark');
  c.hLine(ox + 9, oy + a.mouth - 1, 3, 'paper');
}

function capDown(c, ox, oy, a, key, darkKey) {
  c.rect(ox + 1, oy + 1, 14, a.hairBottom, key);
  c.hLine(ox + 2, oy, 12, 'ink');
  c.rect(ox, oy + a.hairBottom + 1, 16, 1, darkKey);
  c.hLine(ox, oy + a.hairBottom + 2, 16, 'ink');
}

function capSide(c, ox, oy, a, key, darkKey) {
  c.rect(ox + 1, oy + 1, 14, a.hairBottom, key);
  c.hLine(ox + 2, oy, 12, 'ink');
  // Visière vers l'avant seulement : c'est elle qui donne le sens du regard.
  c.rect(ox + 8, oy + a.hairBottom + 1, 8, 1, darkKey);
  c.hLine(ox + 8, oy + a.hairBottom + 2, 8, 'ink');
}

function capUp(c, ox, oy, a, key, darkKey) {
  c.rect(ox + 1, oy + 1, 14, a.hairBottom + 1, key);
  c.hLine(ox + 2, oy, 12, 'ink');
  c.hLine(ox + 1, oy + a.hairBottom + 2, 14, darkKey);
  // Bouton de casquette, vu de dessus.
  c.rect(ox + 7, oy + 2, 2, 2, darkKey);
}

function headphonesDown(c, ox, oy, a, key) {
  c.hLine(ox + 2, oy, 12, key);
  c.set(ox + 1, oy + 1, key).set(ox + 14, oy + 1, key);
  c.rect(ox - 1, oy + a.face, 2, 4, key);
  c.rect(ox + 15, oy + a.face, 2, 4, key);
  c.vLine(ox, oy + 2, a.face - 2, key);
  c.vLine(ox + 15, oy + 2, a.face - 2, key);
}

function headphonesSide(c, ox, oy, a, key) {
  // De trois quarts, seule l'oreillette arrière reste visible en entier.
  c.hLine(ox + 2, oy, 12, key);
  c.set(ox + 1, oy + 1, key);
  c.vLine(ox, oy + 2, a.face - 2, key);
  c.rect(ox - 1, oy + a.face, 3, 4, key);
}

function headphonesUp(c, ox, oy, a, key) {
  headphonesDown(c, ox, oy, a, key);
  // De dos, l'arceau se voit sur toute la largeur du crâne.
  c.hLine(ox + 2, oy + 1, 12, key);
}

/** Nuque : sans elle, la tête de dos se colle au col. */
function neckUp(c, ox, oy, a) {
  c.rect(ox + 6, oy + a.chin - 1, 4, 1, 'skinShade');
}

/** Museau de profil : un pixel, mais c'est lui qui donne le sens du regard. */
function noseSide(c, ox, oy, a) {
  c.set(ox + 15, oy + a.eyes + 1, 'skin');
  c.set(ox + 16, oy + a.eyes + 1, 'ink');
}

// ──────────────────────────── buste et jambes ───────────────────────────

/** Largeur d'épaules : la carrure porte la caricature avant la couleur. */
function shoulderWidth(spec, view) {
  return (spec.big ? 20 : 18) - (view === 'side' ? 4 : 0);
}

function drawBody(c, spec, view, pose) {
  const isUp = view === 'up';
  const shoulder = shoulderWidth(spec, view);
  const side = (FRAME - shoulder) / 2;
  const y = SHOULDER_Y - pose.bob;
  const armW = 3;
  const torsoW = shoulder - 2 - armW * 2;
  // Col : deux pixels sur un buste de face, un seul sur un buste tourné —
  // sinon le col mange tout le torse et le personnage vire au bonhomme blanc.
  const collarW = Math.min(2, Math.floor(torsoW / 4));

  // Épaules.
  c.rect(side, y, shoulder, 1, 'ink');

  // Torse : cinq lignes, col clair sur la première (sauf de dos).
  for (let i = 1; i <= 5; i += 1) {
    c.set(side, y + i, 'ink').set(side + shoulder - 1, y + i, 'ink');
    c.rect(side + 1, y + i, armW, 1, spec.clothDark);
    c.rect(side + shoulder - 1 - armW, y + i, armW, 1, spec.clothDark);
    c.rect(side + 1 + armW, y + i, torsoW, 1, spec.cloth);
    if (i === 1 && !isUp && collarW > 0) {
      c.rect(side + 1 + armW, y + i, collarW, 1, 'paper');
      c.rect(side + shoulder - 1 - armW - collarW, y + i, collarW, 1, 'paper');
    }
  }

  if (pose.arms === 2) {
    drawRaisedArms(c, spec, side, shoulder, y);
  } else {
    drawHands(c, spec, side, shoulder, armW, torsoW, y, pose.arms);
  }

  // Taille.
  c.rect(side, y + 7, shoulder, 1, 'ink');

  drawLegs(c, spec, side, y + 8, pose.stride);
}

function drawHands(c, spec, side, shoulder, armW, torsoW, y, swing) {
  const leftY = y + 6 - (swing > 0 ? 1 : 0);
  const rightY = y + 6 - (swing < 0 ? 1 : 0);
  // Le bras s'allonge jusqu'à la main : pas de trou entre les deux.
  for (let row = y + 6; row > leftY; row -= 1) c.rect(side + 1, row, armW, 1, spec.clothDark);
  for (let row = y + 6; row > rightY; row -= 1)
    c.rect(side + shoulder - 1 - armW, row, armW, 1, spec.clothDark);

  c.set(side, y + 6, 'ink').set(side + shoulder - 1, y + 6, 'ink');
  c.rect(side + 1 + armW, y + 6, torsoW, 1, spec.cloth);
  // La main avancée occupe deux lignes : à cette taille, un balancement d'un
  // seul pixel ne se voit pas en mouvement.
  c.rect(side + 1, leftY, armW, swing > 0 ? 2 : 1, 'skin');
  c.rect(side + shoulder - 1 - armW, rightY, armW, swing < 0 ? 2 : 1, 'skin');
}

/** Bras levés : la lecture « il vient de me voir » doit être instantanée. */
function drawRaisedArms(c, spec, side, shoulder, y) {
  [side - 2, side + shoulder].forEach((x) => {
    c.vLine(x - 1, y - 4, 7, 'ink');
    c.vLine(x + 2, y - 4, 7, 'ink');
    c.rect(x, y - 4, 2, 6, spec.clothDark);
    c.rect(x, y - 6, 2, 2, 'skin');
    c.rect(x - 1, y - 7, 4, 1, 'ink');
    c.vLine(x - 1, y - 6, 2, 'ink');
    c.vLine(x + 2, y - 6, 2, 'ink');
  });
}

/**
 * Jambes. Les pieds restent posés au sol : c'est le corps qui monte, et la
 * jambe qui s'allonge. La jambe avancée descend d'un pixel de plus.
 */
function drawLegs(c, spec, side, top, stride) {
  const legPad = side + 3;
  const legWidth = (FRAME - legPad * 2 - 2) / 2;
  const legs = [
    { x: legPad, bottom: FOOT_Y + (stride > 0 ? 1 : 0) },
    { x: legPad + legWidth + 2, bottom: FOOT_Y + (stride < 0 ? 1 : 0) }
  ];

  legs.forEach(({ x, bottom }) => {
    const height = bottom - top;
    if (height < 1) return;
    c.rect(x, top, legWidth, height, spec.pants);
    c.rect(x, bottom, legWidth, 1, 'ink');
  });
  // Entrejambe : deux pixels d'encre qui séparent les deux jambes.
  c.rect(legPad + legWidth, top, 2, FOOT_Y - top + 1, 'ink');
}

// ──────────────────────────────── assemblage ─────────────────────────────

/** Ombre au sol : elle ancre le personnage sans introduire de perspective. */
function drawShadow(c) {
  for (let x = 8; x < 24; x += 1) {
    const edge = x < 10 || x >= 22;
    c.set(x, SHADOW_Y, 'ink', edge ? 0.12 : 0.22);
    if (!edge) c.set(x, SHADOW_Y + 1, 'ink', 0.16);
  }
}

/**
 * Une frame de personnage, en résolution d'art.
 * @param {object} spec description du rôle
 * @param {'down'|'side'|'up'} view orientation
 * @param {number} column indice de pose (0…7)
 * @returns {PixelCanvas} 32×32
 */
export function makeCharacterFrame(spec, view = 'down', column = 0) {
  const pose = POSES[column] ?? POSES[0];
  const hairTop = spec.hairTop ?? 2;
  const anatomy = anatomyOf(hairTop);
  const hasBrow = Boolean(spec.brow);
  const legend = {
    '.': null,
    K: 'ink',
    h: spec.hair,
    s: 'skin',
    S: 'skinShade',
    e: 'ink',
    m: spec.mouth ?? 'coralDark',
    b: spec.brow ?? spec.hair
  };

  const c = new PixelCanvas(FRAME, FRAME);
  drawShadow(c);
  drawBody(c, spec, view, pose);

  const rows =
    view === 'side'
      ? headRowsSide(hairTop, hasBrow)
      : view === 'up'
        ? headRowsUp(hairTop)
        : headRowsDown(hairTop, hasBrow);
  const ox = (FRAME - HEAD_W) / 2;
  const oy = TOP - pose.bob;
  c.draw(rows, legend, ox, oy);

  if (view === 'side') noseSide(c, ox, oy, anatomy);
  if (view === 'up') neckUp(c, ox, oy, anatomy);

  applyAccessories(c, spec, view, ox, oy, anatomy);
  applyOutfit(c, spec, view, pose);
  return c;
}

function applyAccessories(c, spec, view, ox, oy, a) {
  const front = view !== 'up';
  if (spec.glasses && front) (view === 'side' ? glassesSide : glassesDown)(c, ox, oy, a);
  if (spec.moustache && front) {
    (view === 'side' ? moustacheSide : moustacheDown)(c, ox, oy, a, spec.moustacheColor ?? spec.hair);
  }
  if (spec.openMouth && front) (view === 'side' ? openMouthSide : openMouthDown)(c, ox, oy, a);
  if (spec.cap) {
    const draw = view === 'side' ? capSide : view === 'up' ? capUp : capDown;
    draw(c, ox, oy, a, spec.cap, spec.capDark ?? 'navyDark');
  }
  if (spec.headphones) {
    const draw = view === 'side' ? headphonesSide : view === 'up' ? headphonesUp : headphonesDown;
    draw(c, ox, oy, a, spec.headphones);
  }
}

/** Cravate et badge : posés sur le buste, donc en coordonnées de frame. */
function applyOutfit(c, spec, view, pose) {
  if (view === 'up') return;
  const y = SHOULDER_Y - pose.bob;
  const shoulder = shoulderWidth(spec, view);
  const side = (FRAME - shoulder) / 2;
  if (spec.tie) {
    const x = view === 'side' ? 17 : 15;
    c.rect(x, y + 2, 2, 4, spec.tie);
    c.set(x, y + 6, spec.tie);
  }
  if (spec.badge) {
    const x = view === 'side' ? side + 4 : 19;
    c.rect(x, y + 3, 2, 3, spec.badge);
    c.set(x, y + 2, 'metalDark');
  }
}

/**
 * Planche complète d'un rôle : 8 poses × 3 orientations.
 * @returns {PixelCanvas} 256×96 en résolution d'art (512×192 une fois cuit)
 */
export function makeCharacterSheet(spec) {
  const sheet = new PixelCanvas(FRAME * COLUMNS, FRAME * VIEWS.length);
  VIEWS.forEach((view, rowIndex) => {
    for (let column = 0; column < COLUMNS; column += 1) {
      sheet.blit(makeCharacterFrame(spec, view, column), column * FRAME, rowIndex * FRAME);
    }
  });
  return sheet;
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
    pants: 'stoneDark',
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
    pants: 'navyLight',
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
