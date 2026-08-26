import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ART_SCALE,
  CHARACTER_SHEETS,
  FLOOR_TILES,
  LEVEL_THUMBS,
  STATE_TEXT,
  TEXT,
  TEXT_TONES,
  CHARACTER_TEXTURES,
  DESK_PROPS,
  DIGITS,
  DOOR_TEXTURE,
  FX_TEXTURES,
  IMAGE_MANIFEST,
  ITEM_TEXTURES,
  MATERIALS,
  MENU_ROOM,
  MENU_SHEETS,
  MENU_STAGE,
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
  MENU_ANIMATED,
  MENU_FRAMES,
  menuAnimKey,
  LIVING_SHEETS,
  livingAnimKey,
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
import { VIEW_HEIGHT, VIEW_WIDTH } from '../src/game/constants';

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

  it('la planche de chiffres existe', () => {
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

/** Un repère de l'accueil doit tomber dans le cadre, sinon on ne le voit pas. */
function inside(x: number, y: number, label: string) {
  expect(x, label).toBeGreaterThanOrEqual(0);
  expect(x, label).toBeLessThanOrEqual(VIEW_WIDTH);
  expect(y, label).toBeGreaterThanOrEqual(0);
  expect(y, label).toBeLessThanOrEqual(VIEW_HEIGHT);
}

describe('accueil animé', () => {
  it('le décor de l’accueil est livré, et il fait exactement l’écran', () => {
    const path = join(ASSETS, 'ui', `${MENU_ROOM}.png`);
    expect(existsSync(path)).toBe(true);
    // L'accueil n'est pas un motif raccordable : il est cadré une fois pour
    // toutes sur le format portrait. Un décalage d'un pixel se verrait.
    expect(pngSize(path)).toEqual({ width: VIEW_WIDTH, height: VIEW_HEIGHT });
  });

  it('chaque planche de l’accueil est déclarée et animée', () => {
    const keys = new Set(ANIMATIONS.map((animation) => animation.key));
    const sheets = new Map(SHEET_MANIFEST.map((sheet) => [sheet.key, sheet]));
    Object.values(MENU_SHEETS).forEach((key) => {
      const sheet = sheets.get(key);
      expect(sheet, key).toBeDefined();
      expect(sheet?.group, key).toBe('ui');
      expect(sheet?.frames, key).toBe(MENU_FRAMES);
      expect(keys.has(menuAnimKey(key)), key).toBe(true);
    });
    expect(MENU_ANIMATED.length).toBe(Object.values(MENU_SHEETS).length);
  });

  it('la cadence de l’accueil reste calme', () => {
    // Un menu doit être vivant, pas agité : au-delà de six images par seconde,
    // une boucle de repos devient un clignotement et vole l'attention.
    MENU_ANIMATED.forEach((entry) => {
      expect(entry.frameRate, entry.key).toBeGreaterThan(0);
      expect(entry.frameRate, entry.key).toBeLessThanOrEqual(6);
    });
  });

  it('chaque habitant de l’accueil vise une planche livrée, dans le cadre', () => {
    const sheets = new Set(Object.values(MENU_SHEETS) as string[]);
    MENU_STAGE.actors.forEach((actor, index) => {
      expect(sheets.has(actor.sheet), `acteur ${index}`).toBe(true);
      expect(actor.x, `acteur ${index}`).toBeGreaterThan(0);
      expect(actor.x, `acteur ${index}`).toBeLessThan(VIEW_WIDTH);
      expect(actor.y, `acteur ${index}`).toBeGreaterThan(0);
      expect(actor.y, `acteur ${index}`).toBeLessThan(VIEW_HEIGHT);
    });
  });

  it('les repères de l’accueil restent dans l’écran', () => {
    inside(MENU_STAGE.clock.x, MENU_STAGE.clock.y, 'horloge');
    inside(MENU_STAGE.steam.x, MENU_STAGE.steam.y, 'vapeur');
    inside(MENU_STAGE.glow.x, MENU_STAGE.glow.y, 'flaque');
    MENU_STAGE.neons.forEach((neon, index) => inside(neon.x, neon.y, `néon ${index}`));
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
  it('chaque matière d’obstacle de chaque thème pointe vers un motif livré', () => {
    Object.values(MATERIALS).forEach((theme) => {
      Object.values(theme).forEach((material) => {
        expect(declared.has(material.tile), material.tile).toBe(true);
      });
    });
  });

  it('chaque thème de niveau a son sol et sa vignette', () => {
    Object.values(FLOOR_TILES).forEach((tile) => expect(declared.has(tile), tile).toBe(true));
    Object.values(LEVEL_THUMBS).forEach((thumb) => expect(declared.has(thumb), thumb).toBe(true));
  });

  it('chaque thème utilisé par un niveau livré est déclaré', () => {
    LEVELS.forEach((level) => {
      const theme = level.theme ?? 'office';
      expect(Object.keys(MATERIALS), level.id).toContain(theme);
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
    Object.values(MATERIALS).forEach((theme) => {
      Object.values(theme).forEach((material) => {
        expect(PALETTE[material.edge]).toBeDefined();
        expect(PALETTE[material.crest]).toBeDefined();
        expect(PALETTE[material.base]).toBeDefined();
      });
    });
    Object.values(ZONE_EDGES).forEach((key) => expect(PALETTE[key]).toBeDefined());
    Object.values(TEXT_TONES).forEach((key) => expect(PALETTE[key]).toBeDefined());
  });

  it('les tons de texte sont tous des couleurs CSS valides et distinctes', () => {
    const tones = [...Object.values(TEXT), ...Object.values(STATE_TEXT)];
    tones.forEach((tone) => expect(tone).toMatch(/^#[0-9a-f]{6}$/));
    // Deux rôles qui tomberaient sur la même teinte ne seraient pas une
    // hiérarchie : ce serait deux noms pour un seul niveau de lecture.
    expect(new Set(Object.values(TEXT)).size).toBe(Object.values(TEXT).length);
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

  it('chaque décor vivant a sa planche et son animation', () => {
    const keys = new Set(ANIMATIONS.map((animation) => animation.key));
    const sheets = new Set(SHEET_MANIFEST.map((sheet) => sheet.key));
    Object.keys(LIVING_SHEETS).forEach((texture) => {
      expect(sheets.has(texture), texture).toBe(true);
      expect(keys.has(livingAnimKey(texture)), texture).toBe(true);
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

/** Sources d'un dossier de `src/`, lues telles quelles. */
function sourcesOf(dir: string) {
  return readdirSync(join(process.cwd(), 'src', dir))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => [`${dir}/${file}`, readFileSync(join(process.cwd(), 'src', dir, file), 'utf8')] as const);
}

describe('hygiène du rendu', () => {
  const rendering = [...sourcesOf('scenes'), ...sourcesOf('ui')];

  it('aucune couleur en dur dans une scène ni dans l’interface', () => {
    // Tout passe par `palette.json`, via `PALETTE` ou les tons d'`artTheme`.
    // Une valeur écrite ici échapperait à tout changement de palette.
    rendering.forEach(([name, code]) => {
      const stripped = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      expect(stripped.match(/'#[0-9a-fA-F]{3,8}'/g) ?? [], name).toEqual([]);
      expect(stripped.match(/0x[0-9a-fA-F]{6}\b/g) ?? [], name).toEqual([]);
    });
  });

  it('aucun nom d’asset écrit dans une scène', () => {
    // On compare aux clés RÉELLEMENT livrées, pas à un motif : « item-collected »
    // est un nom d'événement, pas une texture. Seuls les habillages `ui-*` sont
    // tolérés — ce sont des valeurs du type `PanelSkin`, donc vérifiées par le
    // compilateur.
    const forbidden = [...declared, DIGITS.key].filter((key) => !key.startsWith('ui-'));
    rendering.forEach(([name, code]) => {
      forbidden.forEach((key) => {
        expect(code.includes(`'${key}'`), `${name} cite ${key}`).toBe(false);
      });
    });
  });

  it('aucun PNG orphelin dans public/assets', () => {
    const known = new Set([...declared, DIGITS.key]);
    const groups = readdirSync(ASSETS);
    const orphans: string[] = [];
    groups.forEach((group) => {
      readdirSync(join(ASSETS, group))
        .filter((file) => file.endsWith('.png'))
        .forEach((file) => {
          const key = file.replace(/\.png$/, '');
          if (!known.has(key)) orphans.push(`${group}/${file}`);
        });
    });
    expect(orphans).toEqual([]);
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
