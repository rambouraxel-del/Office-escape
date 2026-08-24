import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ART_SCALE,
  ASSET_MANIFEST,
  CHARACTER_TEXTURES,
  DIGITS,
  ITEM_TEXTURES,
  MATERIALS,
  MENU_BACKGROUND,
  PROP_TEXTURES,
  ZONE_EDGES,
  ZONE_TILES
} from '../src/game/artTheme';
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

const allDeclared = Object.entries(ASSET_MANIFEST).flatMap(([group, keys]) =>
  (keys as readonly string[]).map((key) => [group, key] as const)
);

describe('assets déclarés', () => {
  it.each(allDeclared)('%s/%s.png existe', (group, key) => {
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

describe('gabarit des personnages', () => {
  // Contrainte physique : `Body.setCircle()` conserve l'offset (0,0) du corps,
  // donc la taille de la texture positionne le cercle de collision. Changer ce
  // gabarit déplacerait toutes les collisions du jeu.
  it.each(ASSET_MANIFEST.characters)('%s fait exactement 64×64', (key) => {
    expect(pngSize(join(ASSETS, 'characters', `${key}.png`))).toEqual({ width: 64, height: 64 });
  });
});

describe('motifs de matière', () => {
  it.each(ASSET_MANIFEST.tiles)('%s est carré et à l’échelle d’art', (key) => {
    const { width, height } = pngSize(join(ASSETS, 'tiles', `${key}.png`));
    expect(width).toBe(height);
    // 16 pixels d'art × ART_SCALE : la règle d'échelle du projet.
    expect(width).toBe(16 * ART_SCALE);
  });
});

describe('couverture du thème', () => {
  const declared = new Set(allDeclared.map(([, key]) => key));

  it('chaque matière d’obstacle pointe vers un motif livré', () => {
    Object.values(MATERIALS).forEach((material) => {
      expect(declared.has(material.tile)).toBe(true);
    });
  });

  it('chaque matière de zone pointe vers un motif livré', () => {
    Object.values(ZONE_TILES).forEach((tile) => expect(declared.has(tile)).toBe(true));
  });

  it('chaque rôle de PNJ a une texture livrée', () => {
    Object.values(CHARACTER_TEXTURES).forEach((key) => expect(declared.has(key)).toBe(true));
  });

  it('chaque objet ramassable a une texture livrée', () => {
    Object.values(ITEM_TEXTURES).forEach((key) => expect(declared.has(key)).toBe(true));
  });

  it('chaque accessoire a une texture livrée', () => {
    Object.values(PROP_TEXTURES).forEach((key) => expect(declared.has(key)).toBe(true));
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
