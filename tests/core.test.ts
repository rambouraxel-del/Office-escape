import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prng, dailyKey, dailySeed, hashString } from '../src/core/prng';
import { GameClock, formatMinutes } from '../src/core/clock';
import { COLLECTION_BONUS, MAX_TIME_POINTS, STEALTH_BONUS, scoreRun, starsFor } from '../src/core/scoring';
import { LEVEL_01 } from '../src/levels/level01';
import { SettingsStore } from '../src/core/settings';

describe('Prng', () => {
  it('est déterministe à seed égale', () => {
    const a = new Prng(1234);
    const b = new Prng(1234);
    const left = Array.from({ length: 8 }, () => a.next());
    const right = Array.from({ length: 8 }, () => b.next());
    expect(left).toEqual(right);
  });

  it('diverge sur des seeds différentes', () => {
    expect(new Prng(1).next()).not.toBe(new Prng(2).next());
  });

  it('reste dans [0, 1[', () => {
    const prng = new Prng(99);
    for (let index = 0; index < 500; index += 1) {
      const value = prng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gère une seed nulle sans se bloquer', () => {
    const prng = new Prng(0);
    expect(prng.next()).not.toBe(prng.next());
  });

  it('respecte les bornes de int()', () => {
    const prng = new Prng(7);
    for (let index = 0; index < 300; index += 1) {
      const value = prng.int(3, 6);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('chance(0) est toujours faux, chance(1) toujours vrai', () => {
    const prng = new Prng(42);
    for (let index = 0; index < 100; index += 1) {
      expect(prng.chance(0)).toBe(false);
      expect(prng.chance(1)).toBe(true);
    }
  });

  it('approche la probabilité demandée sur un gros échantillon', () => {
    const prng = new Prng(2024);
    let hits = 0;
    for (let index = 0; index < 20000; index += 1) if (prng.chance(0.7)) hits += 1;
    expect(hits / 20000).toBeGreaterThan(0.68);
    expect(hits / 20000).toBeLessThan(0.72);
  });
});

describe('seed quotidienne', () => {
  it('produit une clé calendaire locale stable', () => {
    expect(dailyKey(new Date(2026, 7, 21))).toBe('2026-08-21');
    expect(dailyKey(new Date(2026, 0, 3))).toBe('2026-01-03');
  });

  it('donne la même seed le même jour et une autre le lendemain', () => {
    expect(dailySeed(new Date(2026, 7, 21))).toBe(dailySeed(new Date(2026, 7, 21)));
    expect(dailySeed(new Date(2026, 7, 21))).not.toBe(dailySeed(new Date(2026, 7, 22)));
  });

  it('hashString est stable et non nul', () => {
    expect(hashString('office')).toBe(hashString('office'));
    expect(hashString('office')).not.toBe(hashString('offices'));
  });
});

describe('GameClock', () => {
  let clock: GameClock;
  beforeEach(() => {
    clock = new GameClock(17, 0, 5000);
  });

  it('démarre à l’heure de départ', () => {
    expect(clock.format()).toBe('17:00');
    expect(clock.elapsedMinutes).toBe(0);
  });

  it('convertit le temps réel en minutes de jeu', () => {
    clock.advance(5000 * 7);
    expect(clock.elapsedMinutes).toBe(7);
    expect(clock.format()).toBe('17:07');
  });

  it('ne compte pas une minute entamée', () => {
    clock.advance(4999);
    expect(clock.elapsedMinutes).toBe(0);
    expect(clock.minuteProgress).toBeCloseTo(0.9998, 3);
  });

  it('applique les pénalités', () => {
    clock.advance(5000 * 10);
    clock.addPenaltyMinutes(12);
    expect(clock.elapsedMinutes).toBe(22);
    expect(clock.format()).toBe('17:22');
  });

  it('accepte une pénalité négative (temps gagné)', () => {
    clock.advance(5000 * 10);
    clock.addPenaltyMinutes(-3);
    expect(clock.elapsedMinutes).toBe(7);
  });

  it('passe l’heure et détecte le seuil des heures sup', () => {
    clock.advance(5000 * 65);
    expect(clock.format()).toBe('18:05');
    expect(clock.reachedHour(22)).toBe(false);
    clock.advance(5000 * 60 * 4);
    expect(clock.reachedHour(22)).toBe(true);
  });

  it('se remet à zéro', () => {
    clock.advance(100000);
    clock.addPenaltyMinutes(5);
    clock.reset();
    expect(clock.elapsedMinutes).toBe(0);
  });
});

describe('formatMinutes', () => {
  it('formate sur 24 h avec passage de minuit', () => {
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(9 * 60 + 5)).toBe('09:05');
    expect(formatMinutes(26 * 60)).toBe('02:00');
  });

  it('protège contre les valeurs négatives', () => {
    expect(formatMinutes(-30)).toBe('00:00');
  });
});

describe('scoring', () => {
  it('attribue les étoiles selon les seuils', () => {
    expect(starsFor(20, [20, 30, 45])).toBe(3);
    expect(starsFor(21, [20, 30, 45])).toBe(2);
    expect(starsFor(31, [20, 30, 45])).toBe(1);
    expect(starsFor(46, [20, 30, 45])).toBe(0);
  });

  it('donne le maximum sur une partie parfaite', () => {
    const breakdown = scoreRun(
      { minutes: 20, neverSpotted: true, suspicionEvents: 0, itemsCollected: 1, itemsTotal: 1, usedHidingSpot: false },
      LEVEL_01
    );
    expect(breakdown.timePoints).toBe(MAX_TIME_POINTS);
    expect(breakdown.stealthPoints).toBe(STEALTH_BONUS);
    expect(breakdown.collectionPoints).toBe(COLLECTION_BONUS);
    expect(breakdown.stars).toBe(3);
  });

  it('annule le bonus de discrétion dès qu’on est repéré', () => {
    const breakdown = scoreRun(
      { minutes: 20, neverSpotted: false, suspicionEvents: 0, itemsCollected: 0, itemsTotal: 1, usedHidingSpot: true },
      LEVEL_01
    );
    expect(breakdown.stealthPoints).toBe(0);
    expect(breakdown.labels.stealth).toBe('repéré');
  });

  it('érode le bonus de discrétion à chaque frayeur, sans passer sous zéro', () => {
    const stats = { minutes: 20, neverSpotted: true, itemsCollected: 0, itemsTotal: 1, usedHidingSpot: false };
    expect(scoreRun({ ...stats, suspicionEvents: 2 }, LEVEL_01).stealthPoints).toBe(STEALTH_BONUS - 30);
    expect(scoreRun({ ...stats, suspicionEvents: 99 }, LEVEL_01).stealthPoints).toBe(0);
  });

  it('ne descend jamais sous zéro point de chrono', () => {
    const breakdown = scoreRun(
      { minutes: 500, neverSpotted: false, suspicionEvents: 0, itemsCollected: 0, itemsTotal: 1, usedHidingSpot: false },
      LEVEL_01
    );
    expect(breakdown.timePoints).toBe(0);
    expect(breakdown.total).toBe(0);
  });

  it('récompense la collecte au prorata', () => {
    const breakdown = scoreRun(
      { minutes: 25, neverSpotted: true, suspicionEvents: 0, itemsCollected: 1, itemsTotal: 2, usedHidingSpot: false },
      LEVEL_01
    );
    expect(breakdown.collectionPoints).toBe(COLLECTION_BONUS / 2);
    expect(breakdown.labels.collection).toBe('1/2');
  });

  it('gère un niveau sans objet sans diviser par zéro', () => {
    const breakdown = scoreRun(
      { minutes: 25, neverSpotted: true, suspicionEvents: 0, itemsCollected: 0, itemsTotal: 0, usedHidingSpot: false },
      LEVEL_01
    );
    expect(breakdown.collectionPoints).toBe(0);
    expect(Number.isFinite(breakdown.total)).toBe(true);
  });
});

describe('Save (stockage indisponible)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('ne lève pas quand localStorage est absent', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { Save } = await import('../src/core/save');
    expect(() => Save.migrateLegacy()).not.toThrow();
    expect(Save.getRecord('level-01')).toBeNull();
    expect(() => Save.setRecord('level-01', { minutes: 1, score: 2, stars: 3, at: 'x' })).not.toThrow();
    expect(Save.areTutorialsDone('level-01')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('ne lève pas quand localStorage jette (navigation privée)', async () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('QuotaExceeded');
      },
      removeItem() {
        throw new Error('SecurityError');
      }
    });
    const { Save } = await import('../src/core/save');
    expect(Save.getGhost('level-01')).toBeNull();
    expect(() => Save.setGhost('level-01', [{ x: 1, y: 2 }])).not.toThrow();
    expect(() => Save.resetProgress(['level-01'])).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('Inventory', () => {
  it('accepte deux objets puis refuse le troisième', async () => {
    const { Inventory } = await import('../src/systems/Inventory');
    const inventory = new Inventory();
    expect(inventory.add('donut')).toBe('ok');
    expect(inventory.add('coffee')).toBe('ok');
    expect(inventory.isFull).toBe(true);
    expect(inventory.add('badge')).toBe('full');
    expect(inventory.collected).toBe(2);
  });

  it('refuse un doublon sans consommer de place', async () => {
    const { Inventory } = await import('../src/systems/Inventory');
    const inventory = new Inventory();
    inventory.add('donut');
    expect(inventory.add('donut')).toBe('duplicate');
    expect(inventory.isFull).toBe(false);
  });

  it('libère la place exacte après retrait', async () => {
    const { Inventory } = await import('../src/systems/Inventory');
    const inventory = new Inventory();
    inventory.add('donut');
    inventory.add('coffee');
    expect(inventory.remove('donut')).toBe(true);
    expect(inventory.at(0)).toBeNull();
    expect(inventory.at(1)).toBe('coffee');
    expect(inventory.remove('donut')).toBe(false);
    // La collecte reste acquise pour le score, même si l'objet a été consommé.
    expect(inventory.collected).toBe(2);
  });
});

describe('GhostRecorder / GhostPlayer', () => {
  it('échantillonne à la cadence prévue en arrondissant', async () => {
    const { GhostRecorder } = await import('../src/systems/GhostRecorder');
    const recorder = new GhostRecorder();
    recorder.update(16, 10.4, 20.6);
    expect(recorder.track).toEqual([{ x: 10, y: 21 }]);
    recorder.update(50, 30, 30);
    expect(recorder.track).toHaveLength(1);
    recorder.update(60, 30, 30);
    expect(recorder.track).toHaveLength(2);
  });

  it('interpole entre deux échantillons puis s’arrête', async () => {
    const { GhostPlayer } = await import('../src/systems/GhostRecorder');
    const player = new GhostPlayer([
      { x: 0, y: 0 },
      { x: 100, y: 200 }
    ]);
    expect(player.update(50)).toEqual({ x: 50, y: 100 });
    expect(player.update(60)).toBeNull();
  });

  it('reste inerte sans piste exploitable', async () => {
    const { GhostPlayer } = await import('../src/systems/GhostRecorder');
    const player = new GhostPlayer([{ x: 1, y: 1 }]);
    expect(player.isEmpty).toBe(true);
    expect(player.update(100)).toBeNull();
  });
});

describe('TutorialDirector', () => {
  const context = {
    player: { x: 0, y: 1000 },
    spawn: { x: 0, y: 1000 },
    hasRun: false,
    pendingItems: [] as const,
    heldItems: [] as const
  };

  it('respecte l’ordre imposé par « after »', async () => {
    const { TutorialDirector } = await import('../src/systems/TutorialDirector');
    const director = new TutorialDirector(
      [
        { id: 'a', text: 'A', anchor: 'player', when: {} },
        { id: 'b', text: 'B', anchor: 'player', when: { after: 'a' } }
      ],
      false
    );
    expect(director.pick(context)?.id).toBe('a');
    expect(director.pick(context)).toBeNull(); // une bulle à la fois
    director.dismiss();
    expect(director.pick(context)?.id).toBe('b');
    director.dismiss();
    expect(director.allDismissed).toBe(true);
  });

  it('ne redonne jamais une bulle déjà fermée', async () => {
    const { TutorialDirector } = await import('../src/systems/TutorialDirector');
    const director = new TutorialDirector([{ id: 'a', text: 'A', anchor: 'player', when: {} }], false);
    director.pick(context);
    director.dismiss();
    expect(director.pick(context)).toBeNull();
  });

  it('filtre sur la distance au départ, la proximité et la progression', async () => {
    const { TutorialDirector } = await import('../src/systems/TutorialDirector');
    const director = new TutorialDirector(
      [
        { id: 'far', text: '', anchor: 'player', when: { movedFromSpawn: 100 } },
        { id: 'near', text: '', anchor: 'player', when: { nearPoint: { at: { x: 0, y: 500 }, radius: 60 } } },
        { id: 'up', text: '', anchor: 'player', when: { beyondY: 400 } }
      ],
      false
    );
    expect(director.pick(context)).toBeNull();
    expect(director.pick({ ...context, player: { x: 0, y: 860 } })?.id).toBe('far');
    director.dismiss();
    expect(director.pick({ ...context, player: { x: 0, y: 520 } })?.id).toBe('near');
    director.dismiss();
    expect(director.pick({ ...context, player: { x: 0, y: 390 } })?.id).toBe('up');
  });

  it('reste muet quand les tutoriels du niveau sont déjà acquis', async () => {
    const { TutorialDirector } = await import('../src/systems/TutorialDirector');
    const director = new TutorialDirector([{ id: 'a', text: 'A', anchor: 'player', when: {} }], true);
    expect(director.pick(context)).toBeNull();
  });

  it('dismissIf ne ferme que la bulle visée', async () => {
    const { TutorialDirector } = await import('../src/systems/TutorialDirector');
    const director = new TutorialDirector([{ id: 'a', text: 'A', anchor: 'player', when: {} }], false);
    director.pick(context);
    expect(director.dismissIf('autre')).toBe(false);
    expect(director.dismissIf('a')).toBe(true);
    expect(director.current).toBeNull();
  });
});

describe('réglages', () => {
  it('active les tutoriels et coupe le fantôme par défaut', () => {
    // Les bulles servent au premier essai ; le fantôme, lui, est une option
    // qu'on choisit — il ne doit pas s'inviter dans la partie d'un débutant.
    const settings = SettingsStore.reset();
    expect(settings.tutorials).toBe(true);
    expect(settings.ghost).toBe(false);
  });

  it('bascule les deux nouveaux réglages', () => {
    SettingsStore.reset();
    expect(SettingsStore.toggle('tutorials').tutorials).toBe(false);
    expect(SettingsStore.toggle('ghost').ghost).toBe(true);
    SettingsStore.reset();
  });
});
