import { describe, expect, it } from 'vitest';
import { Torch, angleDelta, approachAngle } from '../src/systems/Torch';
import { LEVELS } from '../src/levels';

const RIGHT = 0;
const UP = -Math.PI / 2;

/** Une lampe de référence : 300 unités de portée, 30° de demi-ouverture. */
function torch(lights = []) {
  return new Torch({ range: 300, halfAngleDeg: 30, spill: 60 }, lights);
}

const HERE = { x: 0, y: 0 };

describe('angles', () => {
  it('mesure l’écart par le plus court chemin', () => {
    expect(angleDelta(0, 0)).toBeCloseTo(0);
    expect(angleDelta(Math.PI / 2, 0)).toBeCloseTo(Math.PI / 2);
    // Le piège classique : 350° et 10° sont à 20° l'un de l'autre, pas à 340°.
    expect(angleDelta(-0.1, 0.1)).toBeCloseTo(0.2);
    expect(angleDelta(Math.PI * 2 + 0.3, 0.1)).toBeCloseTo(0.2);
  });

  it('glisse vers l’angle visé sans faire le tour', () => {
    // Sans passage par le plus court chemin, la lampe balaierait 340° pour
    // corriger 20° : un tour complet parfaitement visible à l'écran.
    const next = approachAngle(-0.1, 0.1, 0.5);
    expect(next).toBeCloseTo(0);
    expect(approachAngle(1, 1, 0.5)).toBeCloseTo(1);
    // Un ratio de 1 arrive tout de suite ; un ratio de 0 ne bouge pas.
    expect(approachAngle(0, 1, 1)).toBeCloseTo(1);
    expect(approachAngle(0, 1, 0)).toBeCloseTo(0);
  });
});

describe('lampe torche', () => {
  it('éclaire à plein ce qu’on a sous les pieds, quelle que soit l’orientation', () => {
    // Sans cette flaque, on avance en fixant l'horizon et l'on se cogne dans
    // ce qu'on a sous le nez.
    expect(torch().lightAt({ x: 0, y: 40 }, HERE, RIGHT)).toBe(1);
    expect(torch().lightAt({ x: -40, y: 0 }, HERE, RIGHT)).toBe(1);
  });

  it('n’éclaire rien derrière soi ni au-delà de sa portée', () => {
    expect(torch().lightAt({ x: -200, y: 0 }, HERE, RIGHT)).toBe(0);
    expect(torch().lightAt({ x: 400, y: 0 }, HERE, RIGHT)).toBe(0);
  });

  it('n’éclaire rien hors du cône, même à bout portant', () => {
    // 90° sur le côté : dans le rayon, mais franchement hors du faisceau.
    expect(torch().lightAt({ x: 0, y: 200 }, HERE, RIGHT)).toBe(0);
  });

  it('s’atténue avec la distance et avec l’angle', () => {
    const near = torch().lightAt({ x: 120, y: 0 }, HERE, RIGHT);
    const far = torch().lightAt({ x: 260, y: 0 }, HERE, RIGHT);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);

    const axis = torch().lightAt({ x: 200, y: 0 }, HERE, RIGHT);
    const edge = torch().lightAt({ x: 200, y: 105 }, HERE, RIGHT);
    expect(axis).toBeGreaterThan(edge);
  });

  it('suit l’orientation du joueur', () => {
    const ahead = { x: 0, y: -200 };
    expect(torch().lightAt(ahead, HERE, UP)).toBeGreaterThan(0);
    expect(torch().lightAt(ahead, HERE, RIGHT)).toBe(0);
  });

  it('révèle aussi ce qui se tient sous une lampe fixe', () => {
    // Les flaques de néon du parking deviennent des zones à surveiller : on y
    // voit les gardes, et l'on s'y voit.
    const lamps = [{ x: 800, y: 800, radius: 200 }];
    const lit = new Torch({ range: 300, halfAngleDeg: 30, spill: 60 }, lamps);
    expect(lit.lightAt({ x: 800, y: 800 }, HERE, RIGHT)).toBe(1);
    expect(lit.lightAt({ x: 800, y: 940 }, HERE, RIGHT)).toBeGreaterThan(0);
    expect(lit.lightAt({ x: 800, y: 1010 }, HERE, RIGHT)).toBe(0);
  });
});

describe('nuit des niveaux livrés', () => {
  it('un niveau qui déclare une lampe éteint vraiment le reste', () => {
    LEVELS.filter((level) => level.ambient?.torch).forEach((level) => {
      const ambient = level.ambient!;
      // Le contrat de la V0.10.3 : hors lumière, les éléments de JEU sont
      // invisibles, pas « discrets ». Un PNJ à 10 % d'opacité sur du bitume
      // sombre reste repérable, et la nuit n'était qu'une gêne.
      expect(ambient.hiddenAlpha ?? 0, level.id).toBe(0);
      expect(ambient.darkness ?? 0, level.id).toBeGreaterThan(0.5);
      expect(ambient.torch!.range, level.id).toBeGreaterThan(ambient.torch!.spill);
      expect(ambient.torch!.halfAngleDeg, level.id).toBeGreaterThan(0);
      // Un faisceau qui couvre plus d'un quart de tour n'oriente plus rien :
      // ce serait le halo circulaire de la V0.10.1 sous un autre nom.
      expect(ambient.torch!.halfAngleDeg, level.id).toBeLessThanOrEqual(45);
    });
  });

  it('le décor d’un niveau de nuit reste navigable', () => {
    // `darkness` est un VOILE sur le décor, pas un rideau : au-delà, on ne
    // distingue plus les murs et l'on ne peut plus circuler.
    LEVELS.forEach((level) => {
      expect(level.ambient?.darkness ?? 0, level.id).toBeLessThan(0.8);
    });
  });
});
