import { describe, expect, it } from 'vitest';
import { NpcController, type NpcSense } from '../src/systems/NpcController';
import { DETECTION_INTERCEPT_SECONDS, SEARCH_SECONDS } from '../src/game/constants';
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
  sweep: { from: 0, to: 180, periodMs: 1000 }
};

function sense(overrides: Partial<NpcSense> = {}): NpcSense {
  return {
    position: { x: 0, y: 0 },
    playerVisible: false,
    playerPosition: { x: 50, y: 50 },
    playerRunning: false,
    blocked: false,
    distraction: null,
    ...overrides
  };
}

describe('jauge de détection', () => {
  it('déclenche l’alerte à 2 s et l’interception à 4 s', () => {
    const npc = new NpcController(patroller, 80, 120);
    expect(npc.updateDetection(1.9, true, false)).toBe(false);
    expect(npc.alerted).toBe(false);
    expect(npc.updateDetection(0.2, true, false)).toBe(true); // front montant
    expect(npc.alerted).toBe(true);
    expect(npc.shouldIntercept).toBe(false);
    npc.updateDetection(2, true, false);
    expect(npc.shouldIntercept).toBe(true);
  });

  it('ne signale l’alerte qu’une seule fois', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(2.1, true, false);
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
    npc.updateDetection(2.5, true, false);
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
    const second = npc.update(0.016, sense({ position: { x: 0, y: 197 } }));
    expect(second.target).toEqual({ x: 0, y: 0 });
  });

  it('poursuit à la vitesse de course quand elle voit le joueur', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(2.5, true, false);
    const intent = npc.update(0.016, sense({ playerVisible: true, playerPosition: { x: 300, y: 40 } }));
    expect(npc.state).toBe('chase');
    expect(intent.target).toEqual({ x: 300, y: 40 });
    expect(intent.speed).toBe(120);
  });

  it('va fouiller la dernière position connue quand le joueur disparaît', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(2.5, true, false);
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
    npc.updateDetection(2.5, true, false);
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

  it('se décolle d’un mur en poursuite au lieu de rester coincée', () => {
    const npc = new NpcController(patroller, 80, 120);
    npc.updateDetection(2.5, true, false);
    const chasing = sense({ playerVisible: true, playerPosition: { x: 0, y: 400 }, blocked: true });
    const straight = { ...npc.update(0.016, chasing).target };
    expect(straight).toEqual({ x: 0, y: 400 });

    npc.update(0.4, chasing); // au-delà de STUCK_SECONDS
    const strafing = { ...npc.update(0.016, chasing).target };
    expect(strafing).not.toEqual({ x: 0, y: 400 });
    expect(Math.abs(strafing.x)).toBeGreaterThan(50); // poussée latérale
  });

  it('ne se débloque pas en ronde tranquille', () => {
    const npc = new NpcController(patroller, 80, 120);
    const intent = npc.update(1, sense({ blocked: true }));
    expect(intent.target).toEqual({ x: 0, y: 200 });
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
    npc.updateDetection(2.5, true, false);
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
});
