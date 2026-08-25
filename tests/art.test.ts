import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ART_SCALE,
  CHARACTER_SHEETS,
  CHARACTER_TEXTURES,
  DESK_PROPS,
  DIGITS,
  DOOR_TEXTURE,
  FX_TEXTURES,
  IMAGE_MANIFEST,
  ITEM_TEXTURES,
  MATERIALS,
  MENU_BACKGROUND,
  PLAYER_TEXTURE,
  PROP_TEXTURES,
  TALKER_TEXTURE,
  UI_TEXTURES,
  ZONE_EDGES,
  ZONE_TILES
} from '../src/game/artTheme';
import {
  ANIMATIONS,
  CHARACTER_FRAME,
  CHARACTER_STATES,
  CHARACTER_VIEWS,
  FACING_FLIP,
  FACING_VIEW,
  SHEET_MANIFEST,
  characterAnimKey,
  facingFromVector,
  itemAnimKey
} from '../src/game/animations';
import { PALETTE, color, hex } from '../src/game/palette';
import { LEVELS } from '../src/levels';
import paletteJson from '../src/game/palette.json';

const ASSETS = join(process.cwd(), 'public', 'assets');

/** Dimensions PNG lues dans l'en-tête IHDR, sans décoder l'image. */
function pngSize(path: string): { width: number; height: number } {
  const buffer = readFileSync(path);
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const images = Object.entries(IMAGE_MANIFEST).flatMap(([group, keys]) =>
  (keys as readonly string[]).map((key) => [group, key] as const)
);

/** Tout ce que `BootScene` charge : images fixes ET planches. */
const declared = new Set([...images.map(([, key]) => key), ...SHEET_MANIFEST.map((sheet) => sheet.key)]);

describe('images fixes', () => {
  it.each(images)('%s/%s.png existe', (group, key) => {
    expect(existsSync(join(ASSETS, group, `${key}.png`))).toBe(true);
  });

  it('le fond de menu et la planche de chiffres existent', () => {
    expect(existsSync(join(ASSETS, 'tiles', `${MENU_BACKGROUND}.png`))).toBe(true);
    expect(existsSync(join(ASSETS, 'ui', `${DIGITS.key}.png`))).toBe(true);
  });

  it('la planche de chiffres contient bien 11 glyphes de la taille annoncée', () => {
    const { width, height } = pngSize(join(ASSETS, 'ui', `${DIGITS.key}.png`));
    expect(height).toBe(DIGITS.frameHeight);
    expect(width / DIGITS.frameWidth).toBe(11);
    expect(DIGITS.colonFrame).toBe(10);
  });
});

describe('planches d’animation', () => {
  const sheets = SHEET_MANIFEST.map((sheet) => [sheet.key, sheet] as const);

  it.each(sheets)('%s : le PNG livré a exactement les frames déclarées', (_key, sheet) => {
    const path = join(ASSETS, sheet.group, `${sheet.key}.png`);
    expect(existsSync(path), path).toBe(true);
    const { width, height } = pngSize(path);
    // Une planche est une grille : largeur × hauteur doivent tomber juste sur
    // le gabarit de frame, sinon Phaser découpe à côté sans rien signaler.
    expect(width % sheet.frameWidth).toBe(0);
    expect(height % sheet.frameHeight).toBe(0);
    expect((width / sheet.frameWidth) * (height / sheet.frameHeight)).toBe(sheet.frames);
  });

  it('aucune planche n’est déclarée deux fois', () => {
    const keys = SHEET_MANIFEST.map((sheet) => sheet.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('aucune planche n’est aussi déclarée comme image fixe', () => {
    const fixed = new Set(images.map(([, key]) => key));
    SHEET_MANIFEST.forEach((sheet) => expect(fixed.has(sheet.key), sheet.key).toBe(false));
  });
});

describe('gabarit des personnages', () => {
  // Contrainte physique : `Body.setCircle()` conserve l'offset (0,0) du corps,
  // donc la taille de la FRAME positionne le cercle de collision. Changer ce
  // gabarit déplacerait toutes les collisions du jeu.
  it.each(CHARACTER_SHEETS.map((key) => [key]))('%s a des frames de 64×64', (key) => {
    const sheet = SHEET_MANIFEST.find((candidate) => candidate.key === key);
    expect(sheet).toBeDefined();
    expect(sheet?.frameWidth).toBe(CHARACTER_FRAME);
    expect(sheet?.frameHeight).toBe(CHARACTER_FRAME);
  });

  it('le joueur et l’interlocuteur sont des planches de personnage', () => {
    expect(CHARACTER_SHEETS).toContain(PLAYER_TEXTURE);
    expect(CHARACTER_SHEETS).toContain(TALKER_TEXTURE);
  });
});

describe('motifs de matière', () => {
  it.each(IMAGE_MANIFEST.tiles.map((key) => [key]))('%s est carré et à l’échelle d’art', (key) => {
    const { width, height } = pngSize(join(ASSETS, 'tiles', `${key}.png`));
    expect(width).toBe(height);
    // 16 pixels d'art × ART_SCALE : la règle d'échelle du projet.
    expect(width).toBe(16 * ART_SCALE);
  });
});

describe('couverture du thème', () => {
  it('chaque matière d’obstacle pointe vers un motif livré', () => {
    Object.values(MATERIALS).forEach((material) => {
      expect(declared.has(material.tile), material.tile).toBe(true);
    });
  });

  it('chaque matière de zone pointe vers un motif livré', () => {
    Object.values(ZONE_TILES).forEach((tile) => expect(declared.has(tile), tile).toBe(true));
  });

  it('chaque rôle de PNJ a une texture livrée', () => {
    Object.values(CHARACTER_TEXTURES).forEach((key) => expect(declared.has(key), key).toBe(true));
  });

  it('chaque objet ramassable a une planche livrée', () => {
    Object.values(ITEM_TEXTURES).forEach((key) => expect(declared.has(key), key).toBe(true));
  });

  it('chaque accessoire, effet et habillage d’interface est livré', () => {
    [
      ...Object.values(PROP_TEXTURES),
      ...Object.values(DESK_PROPS),
      ...Object.values(FX_TEXTURES),
      ...Object.values(UI_TEXTURES),
      DOOR_TEXTURE
    ].forEach((key) => expect(declared.has(key), key).toBe(true));
  });

  it('toutes les couleurs du thème existent dans la palette', () => {
    Object.values(MATERIALS).forEach((material) => {
      expect(PALETTE[material.edge]).toBeDefined();
      expect(PALETTE[material.crest]).toBeDefined();
      expect(PALETTE[material.base]).toBeDefined();
    });
    Object.values(ZONE_EDGES).forEach((key) => expect(PALETTE[key]).toBeDefined());
  });
});

describe('animations déclarées', () => {
  const byKey = new Map(SHEET_MANIFEST.map((sheet) => [sheet.key, sheet]));

  it('chaque animation vise une planche livrée, sans frame hors bornes', () => {
    ANIMATIONS.forEach((animation) => {
      const sheet = byKey.get(animation.sheet);
      expect(sheet, `${animation.key} → ${animation.sheet}`).toBeDefined();
      expect(animation.frames.length).toBeGreaterThan(0);
      animation.frames.forEach((frame) => {
        expect(frame, animation.key).toBeGreaterThanOrEqual(0);
        expect(frame, animation.key).toBeLessThan(sheet?.frames ?? 0);
      });
      expect(animation.frameRate, animation.key).toBeGreaterThan(0);
    });
  });

  it('aucune clé d’animation en double', () => {
    const keys = ANIMATIONS.map((animation) => animation.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('chaque personnage a ses quatre états dans ses trois orientations', () => {
    const keys = new Set(ANIMATIONS.map((animation) => animation.key));
    CHARACTER_SHEETS.forEach((sheet) => {
      CHARACTER_VIEWS.forEach((view) => {
        CHARACTER_STATES.forEach((state) => {
          expect(keys.has(characterAnimKey(sheet, state, view)), `${sheet}/${state}/${view}`).toBe(true);
        });
      });
    });
  });

  it('chaque objet ramassable a son animation de repos', () => {
    const keys = new Set(ANIMATIONS.map((animation) => animation.key));
    Object.values(ITEM_TEXTURES).forEach((texture) => {
      expect(keys.has(itemAnimKey(texture)), texture).toBe(true);
    });
  });
});

describe('orientations', () => {
  it('déduit l’axe dominant du déplacement', () => {
    expect(facingFromVector(100, 10, 'down')).toBe('right');
    expect(facingFromVector(-100, 10, 'down')).toBe('left');
    expect(facingFromVector(10, 100, 'right')).toBe('down');
    expect(facingFromVector(10, -100, 'right')).toBe('up');
  });

  it('conserve l’orientation à l’arrêt', () => {
    // Un PNJ immobile qui se retournerait tout seul donnerait une information
    // de gameplay fausse : son cône, lui, ne bouge pas.
    expect(facingFromVector(0, 0, 'left')).toBe('left');
    expect(facingFromVector(1, 1, 'up')).toBe('up');
  });

  it('ne dessine qu’un profil, retourné pour la gauche', () => {
    expect(FACING_VIEW.left).toBe('side');
    expect(FACING_VIEW.right).toBe('side');
    expect(FACING_FLIP.left).toBe(true);
    expect(FACING_FLIP.right).toBe(false);
    expect(FACING_FLIP.down).toBe(false);
    expect(FACING_FLIP.up).toBe(false);
  });
});

describe('palette', () => {
  it('n’expose que des couleurs #rrggbb valides', () => {
    Object.entries(paletteJson as Record<string, string>)
      .filter(([key]) => key !== '$comment')
      .forEach(([key, value]) => {
        expect(value, key).toMatch(/^#[0-9a-f]{6}$/);
      });
  });

  it('convertit en entier et en hexadécimal de façon cohérente', () => {
    expect(color('ink')).toBe(Number.parseInt(hex('ink').slice(1), 16));
    expect(PALETTE.teal).toBe(color('teal'));
  });

  it('ne contient aucun doublon de couleur', () => {
    const values = Object.entries(paletteJson as Record<string, string>)
      .filter(([key]) => key !== '$comment')
      .map(([, value]) => value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('données de niveau et matières', () => {
  it.each(LEVELS.map((level) => [level.id, level] as const))(
    '%s : toute zone déclare une matière connue',
    (_id, level) => {
      level.decor
        .filter((decor) => decor.kind === 'zone')
        .forEach((decor) => {
          expect(decor.material, `zone en (${decor.x}, ${decor.y})`).toBeDefined();
          expect(Object.keys(ZONE_TILES)).toContain(decor.material);
        });
    }
  );

  it.each(LEVELS.map((level) => [level.id, level] as const))(
    '%s : tout accessoire déclare un type connu',
    (_id, level) => {
      level.decor
        .filter((decor) => decor.kind === 'prop')
        .forEach((decor) => {
          expect(decor.prop, `accessoire en (${decor.x}, ${decor.y})`).toBeDefined();
          expect(Object.keys(PROP_TEXTURES)).toContain(decor.prop);
        });
    }
  );
});
