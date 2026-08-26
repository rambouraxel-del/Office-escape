import { describe, expect, it } from 'vitest';
import { NpcController, type NpcSense } from '../src/systems/NpcController';
import {
  DETECTION_ALERT_SECONDS,
  DETECTION_INTERCEPT_SECONDS,
  ROAM_PAUSE_SECONDS,
  SEARCH_SECONDS
} from '../src/game/constants';
import { NavGrid } from '../src/systems/NavGrid';
import type { NpcDef } from '../src/game/types';

const patroller: NpcDef = {
  id: 'p',
  label: 'P',
  archetype: 'colleague',
  patrol: [
    { x: 0, y: 0 },
    { x: 0, y: 200 }
  ]
};

const camera: NpcDef = {
  id: 'c',
  label: 'C',
  archetype: 'camera',
  patrol: [{ x: 100, y: 100 }],
  sweep: { from: 0, to: 180, degPerSecond: 180, holdMs: 500 }
};

function sense(overrides: Partial<NpcSense> = {}): NpcSense {
  return {
    position: { x: 0, y: 0 },
    playerVisible: false,
    playerPosition: { x: 50, y: 50 },
    playerRunning: false,
    distraction: null,
    ...overrides
  };
}

describe('jauge de détection', () => {
  it('déclenche l’alerte puis l’interception aux seuils réglés', () => {
    const npc = new NpcController(patroller, 80, 120);
    expect(npc.updateDetection(DETECTION_ALERT_SECONDS - 0.1, true, false)).toBe(false);
    expect(npc.alerted).toBe(false);
    expect(npc.updateDetection(0.2, true, false)).toBe(true); // front montant
    expect(npc.alerted).toBe(true);
    expect(npc.shouldIntercept).toBe(false);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    expect(npc.shouldIntercept).toBe(true);
  });

  it('reste plus rapide à alerter qu’à intercepter', () => {
    // Le contrat du cône : on a le temps de réagir, pas de flâner.
    expect(DETECTION_ALERT_SECONDS).toBeLessThan(DETECTION_INTERCEPT_SECONDS);
  });

  it('ne signale l’alerte qu’une seule fois', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_ALERT_SECONDS + 0.1, true, false);
    expect(npc.updateDetection(0.1, true, false)).toBe(false);
  });

  it('remplit plus vite quand le joueur court', () => {
    const walking = new NpcController(patroller, 80, 120);
    const running = new NpcController(patroller, 80, 120);
    walking.updateDetection(1, true, false);
    running.updateDetection(1, true, true);
    expect(running.detectionSeconds).toBeGreaterThan(walking.detectionSeconds);
  });

  it('plafonne à l’interception et ne dépasse jamais', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(60, true, true);
    expect(npc.detectionSeconds).toBe(DETECTION_INTERCEPT_SECONDS);
    expect(npc.detectionRatio).toBe(1);
  });

  it('redescend et lève l’alerte hors de vue', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    expect(npc.alerted).toBe(true);
    npc.updateDetection(5, false, false);
    expect(npc.detectionSeconds).toBe(0);
    expect(npc.alerted).toBe(false);
  });
});

describe('machine à états', () => {
  it('avance de point en point en ronde', () => {
    const npc = new NpcController(patroller, 80, 120);
    const first = npc.update(0.016, sense({ position: { x: 0, y: 0 } }));
    expect(first.target).toEqual({ x: 0, y: 200 });
    expect(first.speed).toBe(80);
    // Arrivée : le PNJ marque une pause avant de repartir vers l'autre point.
    npc.update(0.016, sense({ position: { x: 0, y: 197 } }));
    const second = npc.update(ROAM_PAUSE_SECONDS + 0.1, sense({ position: { x: 0, y: 197 } }));
    expect(second.target).toEqual({ x: 0, y: 0 });
  });

  it('poursuit à la vitesse de course quand elle voit le joueur', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    const intent = npc.update(0.016, sense({ playerVisible: true, playerPosition: { x: 300, y: 40 } }));
    expect(npc.state).toBe('chase');
    expect(intent.target).toEqual({ x: 300, y: 40 });
    expect(intent.speed).toBe(120);
  });

  it('va fouiller la dernière position connue quand le joueur disparaît', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    npc.update(0.016, sense({ playerVisible: true, playerPosition: { x: 300, y: 40 } }));

    // Le joueur entre aux WC : plus visible, mais le PNJ ne rentre pas en ronde.
    npc.update(0.016, sense({ playerVisible: false }));
    expect(npc.state).toBe('search');
    const intent = npc.update(0.016, sense({ playerVisible: false }));
    expect(intent.target).toEqual({ x: 300, y: 40 });
    expect(npc.isSearching).toBe(true);
  });

  it('abandonne la fouille après le délai et reprend sa ronde', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    npc.update(0.016, sense({ playerVisible: true, playerPosition: { x: 300, y: 40 } }));
    npc.update(0.016, sense({ playerVisible: false }));
    npc.updateDetection(10, false, false);
    npc.update(SEARCH_SECONDS + 1, sense({ playerVisible: false }));
    expect(npc.state).toBe('patrol');
  });

  it('se laisse détourner par une diversion', () => {
    const npc = new NpcController(patroller, 80, 120);
    const intent = npc.update(0.016, sense({ distraction: { x: 400, y: 400 } }));
    expect(npc.state).toBe('distracted');
    expect(intent.target).toEqual({ x: 400, y: 400 });
    npc.update(0.016, sense({ distraction: null }));
    expect(npc.state).toBe('patrol');
  });

  it('reprend proprement sa ronde après une fouille', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    npc.update(0.016, sense({ playerVisible: true, playerPosition: { x: 300, y: 40 } }));
    npc.update(0.016, sense({ playerVisible: false }));
    npc.updateDetection(10, false, false);
    npc.update(SEARCH_SECONDS + 1, sense({ playerVisible: false }));
    const back = npc.update(0.016, sense({ position: { x: 0, y: 0 } }));
    expect(npc.state).toBe('patrol');
    expect(back.target).toEqual({ x: 0, y: 200 });
  });
});

/** Un couloir barré : le seul passage oblige à contourner le bloc central. */
function corridor() {
  return new NavGrid(400, 400, [{ x: 200, y: 200, w: 200, h: 40 }], 10, 20);
}

/** Un rôdeur seedé, reconstruit à l'identique pour comparer deux parties. */
function roamer() {
  let seed = 0;
  return new NpcController(
    {
      id: 'n',
      label: 'N',
      archetype: 'guard',
      patrol: [
        { x: 200, y: 160 },
        { x: 200, y: 240 }
      ],
      roam: { x: 200, y: 200, w: 160, h: 160 }
    },
    80,
    120,
    0,
    new NavGrid(400, 400, [], 10, 20),
    () => {
      seed = (seed + 0.41) % 1;
      return seed;
    }
  );
}

describe('rondes et navigation', () => {
  it('contourne un obstacle au lieu de foncer dedans', () => {
    const nav = corridor();
    const npc = new NpcController(
      { id: 'n', label: 'N', archetype: 'guard', patrol: [{ x: 200, y: 40 }, { x: 200, y: 360 }] },
      80,
      120,
      0,
      nav
    );
    const first = npc.update(0.016, sense({ position: { x: 200, y: 40 } }));
    // La cible immédiate n'est PAS le point de ronde : c'est un point de
    // passage qui évite le bloc.
    expect(first.target).not.toEqual({ x: 200, y: 360 });
    expect(nav.isWalkable(first.target.x, first.target.y)).toBe(true);
  });

  it('vise directement quand la voie est libre', () => {
    const nav = new NavGrid(400, 400, [], 10, 20);
    const npc = new NpcController(
      { id: 'n', label: 'N', archetype: 'guard', patrol: [{ x: 40, y: 40 }, { x: 360, y: 40 }] },
      80,
      120,
      0,
      nav
    );
    const intent = npc.update(0.016, sense({ position: { x: 40, y: 40 } }));
    expect(intent.target).toEqual({ x: 360, y: 40 });
  });

  it('décale ses points de ronde dans sa zone, jamais au-delà', () => {
    const nav = new NavGrid(400, 400, [], 10, 20);
    const zone = { x: 200, y: 200, w: 120, h: 120 };
    let seed = 0;
    const npc = new NpcController(
      {
        id: 'n',
        label: 'N',
        archetype: 'guard',
        patrol: [{ x: 200, y: 160 }, { x: 200, y: 240 }],
        roam: zone
      },
      80,
      120,
      0,
      nav,
      () => {
        seed = (seed + 0.37) % 1;
        return seed;
      }
    );
    for (let step = 0; step < 40; step += 1) {
      const intent = npc.update(0.2, sense({ position: { x: 200, y: 200 } }));
      expect(intent.target.x).toBeGreaterThanOrEqual(zone.x - zone.w / 2 - 1);
      expect(intent.target.x).toBeLessThanOrEqual(zone.x + zone.w / 2 + 1);
      expect(intent.target.y).toBeGreaterThanOrEqual(zone.y - zone.h / 2 - 1);
      expect(intent.target.y).toBeLessThanOrEqual(zone.y + zone.h / 2 + 1);
    }
  });

  it('rejoue exactement la même ronde à tirage identique', () => {
    // Contrat du Défi du jour : même seed, même partie.
    const a = roamer();
    const b = roamer();
    for (let step = 0; step < 25; step += 1) {
      const left = { ...a.update(0.2, sense({ position: { x: 200, y: 200 } })).target };
      const right = { ...b.update(0.2, sense({ position: { x: 200, y: 200 } })).target };
      expect(left).toEqual(right);
    }
  });
});

describe('caméras', () => {
  it('ne se déplace pas et balaie son angle', () => {
    const npc = new NpcController(camera, 80, 120);
    expect(npc.isCamera).toBe(true);
    // L'intention est un objet réutilisé : on copie la valeur avant de comparer.
    const start = npc.update(0.001, sense({ position: { x: 100, y: 100 } }));
    expect(start.speed).toBe(0);
    const startFacing = start.facing;
    const laterFacing = npc.update(0.25, sense({ position: { x: 100, y: 100 } })).facing;
    expect(laterFacing).not.toBeCloseTo(startFacing);
  });

  it('reste dans les bornes du balayage', () => {
    const npc = new NpcController(camera, 80, 120);
    for (let step = 0; step < 60; step += 1) {
      const intent = npc.update(0.05, sense({ position: { x: 100, y: 100 } }));
      expect(intent.facing).toBeGreaterThanOrEqual(-0.001);
      expect(intent.facing).toBeLessThanOrEqual(Math.PI + 0.001);
    }
  });

  it('cesse de balayer pour fixer le joueur une fois alertée', () => {
    const npc = new NpcController(camera, 80, 120);
    npc.updateDetection(DETECTION_INTERCEPT_SECONDS, true, false);
    const intent = npc.update(
      0.05,
      sense({ position: { x: 0, y: 0 }, playerVisible: true, playerPosition: { x: 100, y: 0 } })
    );
    expect(intent.facing).toBeCloseTo(0);
  });

  it('deux seeds différentes donnent des phases de balayage différentes', () => {
    const a = new NpcController(camera, 80, 120, 0);
    const b = new NpcController(camera, 80, 120, 0.5);
    const senseAt = sense({ position: { x: 100, y: 100 } });
    const facingA = a.update(0.016, senseAt).facing;
    const facingB = b.update(0.016, senseAt).facing;
    expect(facingA).not.toBeCloseTo(facingB);
  });

  it('marque un arrêt en bout de course avant de repartir', () => {
    const npc = new NpcController(camera, 80, 120, 0);
    const at = sense({ position: { x: 100, y: 100 } });
    // 180°/s sur 180° : la butée est atteinte en une seconde.
    npc.update(1.2, at);
    const parked = npc.update(0.05, at).facing;
    expect(parked).toBeCloseTo(Math.PI, 3);
    // Pendant l'arrêt (500 ms), l'angle ne bouge pas d'un radian.
    expect(npc.update(0.2, at).facing).toBeCloseTo(parked, 5);
    expect(npc.update(0.2, at).facing).toBeCloseTo(parked, 5);
    // Puis le balayage repart dans l'autre sens.
    npc.update(0.3, at);
    expect(npc.update(0.2, at).facing).toBeLessThan(parked);
  });
});
