import { describe, expect, it } from 'vitest';
import { LEVELS, getLevel, levelIndex, nextLevelId } from '../src/levels';
import { validateLevel } from '../src/game/validateLevel';

/**
 * Le format data-driven déplace les fautes de frappe du compilateur vers le
 * runtime. Ces tests remettent le filet : aucun niveau injouable ne peut être
 * livré.
 */
describe('catalogue de niveaux', () => {
  it('expose des identifiants uniques', () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaîne les niveaux dans l’ordre', () => {
    expect(levelIndex(LEVELS[0].id)).toBe(0);
    expect(nextLevelId(LEVELS[0].id)).toBe(LEVELS[1].id);
    expect(nextLevelId(LEVELS[LEVELS.length - 1].id)).toBeNull();
  });

  it('échoue clairement sur un niveau inconnu', () => {
    expect(() => getLevel('nope')).toThrow(/inconnu/);
  });
});

describe.each(LEVELS.map((level) => [level.id, level] as const))('niveau %s', (_id, level) => {
  const issues = validateLevel(level);

  it('ne produit aucune erreur de validation', () => {
    expect(issues.filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('ne produit aucun avertissement de conception', () => {
    // Notamment : aucun choix de dialogue strictement dominé.
    expect(issues.filter((issue) => issue.severity === 'warning')).toEqual([]);
  });

  it('offre une cachette et au moins un objet', () => {
    expect(level.hidingSpots.length).toBeGreaterThan(0);
    expect(level.items.length).toBeGreaterThan(0);
  });

  it('tient dans les deux emplacements d’inventaire', () => {
    expect(level.items.length).toBeLessThanOrEqual(2);
  });

  it('laisse une marge confortable entre le seuil 1 étoile et les heures sup', () => {
    const budget = (level.clock.failAtHour - level.clock.startHour) * 60 - level.clock.startMinute;
    expect(level.stars[2]).toBeLessThan(budget * 0.75);
  });
});
