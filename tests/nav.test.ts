import { describe, expect, it } from 'vitest';
import { NavGrid } from '../src/systems/NavGrid';
import { LEVELS } from '../src/levels';
import type { Vec2 } from '../src/game/types';

/** Tampon de sortie, comme en jeu : la recherche écrit dans un tableau réutilisé. */
function buffer(): Vec2[] {
  return Array.from({ length: 64 }, () => ({ x: 0, y: 0 }));
}

describe('grille de navigation', () => {
  it('marque bloquées les cellules d’un obstacle, marge comprise', () => {
    const nav = new NavGrid(200, 200, [{ x: 100, y: 100, w: 40, h: 40 }], 10, 10);
    expect(nav.isWalkable(100, 100)).toBe(false);
    // 20 unités du centre = encore dans l'obstacle + sa marge.
    expect(nav.isWalkable(100, 125)).toBe(false);
    expect(nav.isWalkable(100, 20)).toBe(true);
  });

  it('refuse ce qui sort du niveau', () => {
    const nav = new NavGrid(200, 200, [], 0, 10);
    expect(nav.isWalkable(-5, 100)).toBe(false);
    expect(nav.isWalkable(100, 500)).toBe(false);
  });

  it('recale un point dans un mur sur la case libre la plus proche', () => {
    const nav = new NavGrid(200, 200, [{ x: 100, y: 100, w: 40, h: 40 }], 5, 10);
    const out = { x: 0, y: 0 };
    nav.nearestWalkable(100, 100, out);
    expect(nav.isWalkable(out.x, out.y)).toBe(true);
  });

  it('va tout droit quand la voie est libre', () => {
    const nav = new NavGrid(300, 300, [], 0, 10);
    const path = buffer();
    const length = nav.findPath({ x: 20, y: 20 }, { x: 280, y: 20 }, path);
    // Le lissage doit ramener la ligne droite à un seul point de passage.
    expect(length).toBe(1);
    expect(path[0]).toEqual({ x: 280, y: 20 });
  });

  it('contourne un mur au lieu de le traverser', () => {
    // Cloison horizontale percée à droite : le chemin doit y passer.
    const nav = new NavGrid(300, 300, [{ x: 110, y: 150, w: 220, h: 20 }], 5, 10);
    const path = buffer();
    const length = nav.findPath({ x: 40, y: 40 }, { x: 40, y: 260 }, path);
    expect(length).toBeGreaterThan(1);
    for (let index = 0; index < length; index += 1) {
      expect(nav.isWalkable(path[index].x, path[index].y), `point ${index}`).toBe(true);
    }
    // Il faut bien être passé par la droite, seul trou de la cloison.
    expect(Math.max(...path.slice(0, length).map((point) => point.x))).toBeGreaterThan(220);
  });

  it('renvoie zéro quand aucun chemin n’existe', () => {
    const nav = new NavGrid(300, 300, [{ x: 150, y: 150, w: 300, h: 30 }], 5, 10);
    expect(nav.findPath({ x: 40, y: 40 }, { x: 40, y: 260 }, buffer())).toBe(0);
  });

  it('rouvre le passage quand une porte disparaît', () => {
    const left = { x: 60, y: 150, w: 120, h: 20 };
    const door = { x: 150, y: 150, w: 60, h: 20 };
    const right = { x: 240, y: 150, w: 120, h: 20 };
    const nav = new NavGrid(300, 300, [left, door, right], 5, 10);
    expect(nav.findPath({ x: 150, y: 40 }, { x: 150, y: 260 }, buffer())).toBe(0);
    nav.rebuild([left, right]);
    expect(nav.findPath({ x: 150, y: 40 }, { x: 150, y: 260 }, buffer())).toBeGreaterThan(0);
  });

  it('voit à travers le vide, pas à travers un mur', () => {
    const nav = new NavGrid(300, 300, [{ x: 150, y: 150, w: 60, h: 60 }], 5, 10);
    expect(nav.hasLineOfSight(20, 20, 20, 280)).toBe(true);
    expect(nav.hasLineOfSight(20, 150, 280, 150)).toBe(false);
  });
});

describe('navigabilité des niveaux livrés', () => {
  it.each(LEVELS.map((level) => [level.id, level] as const))(
    '%s : chaque point de ronde est atteignable depuis le départ',
    (_id, level) => {
      // Portes exclues : elles s'ouvrent en cours de partie, et `clearRect`
      // rouvre alors la grille. Ce test vérifie la topologie du niveau, pas
      // l'état d'une serrure.
      const nav = new NavGrid(
        level.size.w,
        level.size.h,
        level.obstacles.filter((obstacle) => obstacle.kind !== 'door')
      );
      const path = buffer();
      const from = { x: 0, y: 0 };
      const to = { x: 0, y: 0 };
      nav.nearestWalkable(level.spawn.x, level.spawn.y, from);

      level.npcs
        .filter((npc) => npc.patrol.length > 1)
        .forEach((npc) => {
          npc.patrol.forEach((point, index) => {
            nav.nearestWalkable(point.x, point.y, to);
            const length = nav.findPath(from, to, path);
            expect(length, `${npc.id} point ${index} (${point.x}, ${point.y})`).toBeGreaterThan(0);
          });
        });
    }
  );

  it.each(LEVELS.map((level) => [level.id, level] as const))(
    '%s : chaque segment de ronde est franchissable en ligne droite',
    (_id, level) => {
      // C'est LA garantie de lisibilité de la V0.10.3 : en ronde, un PNJ va
      // tout droit d'un point au suivant. Un segment barré le ferait basculer
      // sur la grille — il contournerait sans que le joueur comprenne
      // pourquoi, et le circuit cesserait d'être apprenable.
      const nav = new NavGrid(
        level.size.w,
        level.size.h,
        level.obstacles.filter((obstacle) => obstacle.kind !== 'door')
      );
      level.npcs
        .filter((npc) => npc.patrol.length > 1)
        .forEach((npc) => {
          npc.patrol.forEach((point, index) => {
            const next = npc.patrol[(index + 1) % npc.patrol.length];
            expect(
              nav.hasLineOfSight(point.x, point.y, next.x, next.y),
              `${npc.id} : segment ${index} → ${(index + 1) % npc.patrol.length}`
            ).toBe(true);
          });
        });
    }
  );
});
