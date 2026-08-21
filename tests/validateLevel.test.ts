import { describe, expect, it } from 'vitest';
import { assertLevelValid, validateLevel } from '../src/game/validateLevel';
import { LEVEL_01 } from '../src/levels/level01';
import type { LevelDef } from '../src/game/types';

function clone(): LevelDef {
  return structuredClone(LEVEL_01) as LevelDef;
}

const errors = (level: LevelDef) =>
  validateLevel(level)
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.message);

const warnings = (level: LevelDef) =>
  validateLevel(level)
    .filter((issue) => issue.severity === 'warning')
    .map((issue) => issue.message);

describe('validateLevel', () => {
  it('accepte un niveau livré', () => {
    expect(() => assertLevelValid(LEVEL_01)).not.toThrow();
  });

  it('détecte un départ dans un mur', () => {
    const level = clone();
    level.spawn = { x: 21, y: 1100 };
    expect(errors(level).some((message) => message.includes('dans un obstacle'))).toBe(true);
  });

  it('détecte un départ hors limites', () => {
    const level = clone();
    level.spawn = { x: -10, y: 1100 };
    expect(errors(level).some((message) => message.includes('hors des limites'))).toBe(true);
  });

  it('détecte un point de ronde coincé dans un meuble', () => {
    const level = clone();
    level.npcs[0].patrol[0] = { x: 250, y: 860 }; // au cœur du pilier ARCHIVES
    expect(errors(level).some((message) => message.includes('coincé dans un obstacle'))).toBe(true);
  });

  it('détecte un objet inatteignable', () => {
    const level = clone();
    level.items[0].at = { x: 250, y: 860 };
    expect(errors(level).some((message) => message.includes('inatteignable'))).toBe(true);
  });

  it('détecte une porte verrouillée par une clé absente du niveau', () => {
    const level = clone();
    level.obstacles.push({ x: 250, y: 1450, w: 100, h: 30, kind: 'door', lock: 'badge' });
    expect(errors(level).some((message) => message.includes('Porte verrouillée'))).toBe(true);
  });

  it('détecte des seuils d’étoiles non croissants', () => {
    const level = clone();
    level.stars = [30, 20, 45];
    expect(errors(level).some((message) => message.includes('non croissants'))).toBe(true);
  });

  it('détecte un seuil hors du temps disponible', () => {
    const level = clone();
    level.stars = [20, 30, 400];
    expect(errors(level).some((message) => message.includes('temps disponible'))).toBe(true);
  });

  it('détecte l’absence de sortie', () => {
    const level = clone();
    level.triggers = level.triggers.filter((trigger) => trigger.kind !== 'exit');
    expect(errors(level).some((message) => message.includes('infinissable'))).toBe(true);
  });

  it('détecte un dialogue fantôme', () => {
    const level = clone();
    level.triggers[0].payload = 'inconnu';
    expect(errors(level).some((message) => message.includes('dialogue inconnu'))).toBe(true);
  });

  it('détecte une impasse : tous les choix exigent un objet', () => {
    const level = clone();
    level.dialogues[0].choices = level.dialogues[0].choices.filter((choice) => choice.requiresItem);
    expect(errors(level).some((message) => message.includes('impasse'))).toBe(true);
  });

  it('détecte un tutoriel dépendant d’un tutoriel inexistant', () => {
    const level = clone();
    level.tutorials[1].when.after = 'fantome';
    expect(errors(level).some((message) => message.includes('tutoriel inconnu'))).toBe(true);
  });

  it('signale un choix de dialogue strictement dominé', () => {
    const level = clone();
    // Un pari sans aucun gain possible et au coût moyen supérieur : jamais pris.
    level.dialogues[0].choices[2].rewardMinutes = 0;
    level.dialogues[0].choices[2].successChance = 0.3;
    level.dialogues[0].choices[2].penaltyMinutes = 30;
    expect(warnings(level).some((message) => message.includes('dominé'))).toBe(true);
  });

  it('assertLevelValid lève sur un niveau cassé', () => {
    const level = clone();
    level.triggers = [];
    expect(() => assertLevelValid(level)).toThrow(/invalide/);
  });
});
