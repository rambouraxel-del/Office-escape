import { describe, expect, it } from 'vitest';
import {
  buildVisionPolygon,
  cullBlockers,
  isPointVisible,
  makeBlocker,
  nearestObstacleDistance,
  rectContains,
  wrapAngle,
  type Blocker,
  type PointLike
} from '../src/game/geometry';

const wall = makeBlocker(100, 0, 20, 200); // mur vertical à x ∈ [90, 110]

describe('makeBlocker', () => {
  it('calcule bornes et cercle englobant', () => {
    const blocker = makeBlocker(50, 60, 40, 30);
    expect(blocker.left).toBe(30);
    expect(blocker.right).toBe(70);
    expect(blocker.top).toBe(45);
    expect(blocker.bottom).toBe(75);
    expect(blocker.radius).toBeCloseTo(Math.hypot(20, 15));
  });
});

describe('nearestObstacleDistance', () => {
  it('renvoie la distance au mur droit devant', () => {
    expect(nearestObstacleDistance({ x: 0, y: 0 }, 0, 500, [wall])).toBeCloseTo(90);
  });

  it('renvoie la portée maximale quand rien ne coupe', () => {
    expect(nearestObstacleDistance({ x: 0, y: 0 }, Math.PI, 500, [wall])).toBe(500);
  });

  it('ignore un obstacle situé derrière l’origine', () => {
    expect(nearestObstacleDistance({ x: 200, y: 0 }, 0, 500, [wall])).toBe(500);
  });

  it('gère un rayon parfaitement axial le long du mur', () => {
    // Rayon vertical descendant à x = 100 : il touche le haut du mur (y = -100).
    expect(nearestObstacleDistance({ x: 100, y: -300 }, Math.PI / 2, 500, [wall])).toBeCloseTo(200);
  });

  it('gère un rayon axial hors du mur', () => {
    expect(nearestObstacleDistance({ x: 300, y: -300 }, Math.PI / 2, 500, [wall])).toBe(500);
  });

  it('retient le plus proche parmi plusieurs obstacles', () => {
    const near = makeBlocker(40, 0, 10, 100);
    expect(nearestObstacleDistance({ x: 0, y: 0 }, 0, 500, [wall, near])).toBeCloseTo(35);
  });
});

describe('cullBlockers', () => {
  it('ne garde que les obstacles à portée', () => {
    const far = makeBlocker(2000, 2000, 40, 40);
    const out: Blocker[] = [];
    const count = cullBlockers({ x: 0, y: 0 }, 200, [wall, far], out);
    expect(count).toBe(1);
    expect(out[0]).toBe(wall);
  });

  it('garde un obstacle dont seul le coin entre dans la portée', () => {
    const corner = makeBlocker(160, 0, 100, 100);
    const out: Blocker[] = [];
    expect(cullBlockers({ x: 0, y: 0 }, 100, [corner], out)).toBe(1);
  });

  it('ne réalloue pas le tableau de sortie', () => {
    const out: Blocker[] = [];
    cullBlockers({ x: 0, y: 0 }, 500, [wall], out);
    const reference = out;
    cullBlockers({ x: 0, y: 0 }, 500, [wall], out);
    expect(out).toBe(reference);
  });
});

describe('wrapAngle', () => {
  it('ramène dans ]-PI, PI]', () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI * 0.5);
  });
});

describe('isPointVisible', () => {
  const origin = { x: 0, y: 0 };
  const half = Math.PI / 6;

  it('voit une cible dégagée dans le cône', () => {
    expect(isPointVisible({ x: 50, y: 0 }, origin, 0, half, 300, [])).toBe(true);
  });

  it('ne voit pas au-delà de la portée', () => {
    expect(isPointVisible({ x: 400, y: 0 }, origin, 0, half, 300, [])).toBe(false);
  });

  it('ne voit pas hors de l’angle', () => {
    expect(isPointVisible({ x: 0, y: 50 }, origin, 0, half, 300, [])).toBe(false);
  });

  it('ne voit pas à travers un mur', () => {
    expect(isPointVisible({ x: 200, y: 0 }, origin, 0, half, 300, [wall])).toBe(false);
  });

  it('voit une cible située avant le mur', () => {
    expect(isPointVisible({ x: 60, y: 0 }, origin, 0, half, 300, [wall])).toBe(true);
  });

  it('tolère les cibles collées à l’arête du mur', () => {
    // La tolérance de 5 px évite les faux négatifs quand le joueur frôle l'angle.
    expect(isPointVisible({ x: 93, y: 0 }, origin, 0, half, 300, [wall])).toBe(true);
  });

  it('ne se voit pas lui-même', () => {
    expect(isPointVisible(origin, origin, 0, half, 300, [])).toBe(false);
  });

  it('respecte le nombre d’obstacles passé', () => {
    // blockerCount = 0 : le mur est ignoré, comme après un cull vide.
    expect(isPointVisible({ x: 200, y: 0 }, origin, 0, half, 300, [wall], 0)).toBe(true);
  });
});

describe('buildVisionPolygon', () => {
  it('écrit segments + 2 sommets, origine comprise', () => {
    const out: PointLike[] = [];
    const count = buildVisionPolygon({ x: 0, y: 0 }, 0, Math.PI / 6, 200, [], out, 8);
    expect(count).toBe(10);
    expect(out[0]).toEqual({ x: 0, y: 0 });
  });

  it('réutilise le même tableau et les mêmes objets d’une frame à l’autre', () => {
    const out: PointLike[] = [];
    buildVisionPolygon({ x: 0, y: 0 }, 0, Math.PI / 6, 200, [], out, 8);
    const firstPoint = out[1];
    buildVisionPolygon({ x: 10, y: 10 }, 0, Math.PI / 6, 200, [], out, 8);
    expect(out[1]).toBe(firstPoint); // aucune allocation par frame
  });

  it('raccourcit les rayons interceptés par un mur', () => {
    const out: PointLike[] = [];
    buildVisionPolygon({ x: 0, y: 0 }, 0, 0.001, 500, [wall], out, 2);
    expect(out[1].x).toBeCloseTo(90, 1);
  });
});

describe('rectContains', () => {
  it('teste un rectangle défini par son centre', () => {
    const rect = { x: 100, y: 100, w: 40, h: 20 };
    expect(rectContains(rect, { x: 100, y: 100 })).toBe(true);
    expect(rectContains(rect, { x: 120, y: 110 })).toBe(true);
    expect(rectContains(rect, { x: 121, y: 100 })).toBe(false);
    expect(rectContains(rect, { x: 100, y: 111 })).toBe(false);
  });
});
