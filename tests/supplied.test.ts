import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import IMPORTED from '../assets-source/imported.json';
import SUPPLIED_MANIFEST from '../assets-source/v011/manifest.json';
import { CHARACTER_SHEETS, IMAGE_MANIFEST } from '../src/game/artTheme';
import { CHARACTER_FRAME, SHEET_MANIFEST } from '../src/game/animations';

const ROOT = process.cwd();
const SOURCE = join(ROOT, 'assets-source', 'v011');
const ASSETS = join(ROOT, 'public', 'assets');

/**
 * Ces tests gardent UNE règle : un asset fourni n'est jamais redessiné.
 *
 * Le seul traitement autorisé est une décimation d'un facteur entier — on
 * prend un pixel sur deux. On le vérifie donc littéralement : chaque pixel du
 * fichier livré doit se retrouver, identique, dans le fichier source.
 */

/** Décodeur PNG minimal, suffisant pour comparer des pixels. */
function decode(path: string): { width: number; height: number; px: Buffer } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { inflateSync } = require('node:zlib') as typeof import('node:zlib');
  const file = readFileSync(path);
  const parts: Buffer[] = [];
  let pos = 8;
  let width = 0;
  let height = 0;
  let colour = 0;
  while (pos < file.length) {
    const length = file.readUInt32BE(pos);
    const type = file.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = file.readUInt32BE(pos + 8);
      height = file.readUInt32BE(pos + 12);
      colour = file[pos + 17];
    } else if (type === 'IDAT') parts.push(file.subarray(pos + 8, pos + 8 + length));
    pos += 12 + length;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colour as 0 | 2 | 4 | 6]!;
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const rows = Buffer.alloc(height * stride);
  let previous = Buffer.alloc(stride);
  let cursor = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor];
    cursor += 1;
    const line = Buffer.from(raw.subarray(cursor, cursor + stride));
    cursor += stride;
    for (let index = 0; index < stride; index += 1) {
      const a = index >= channels ? line[index - channels] : 0;
      const b = previous[index];
      const c = index >= channels ? previous[index - channels] : 0;
      if (filter === 1) line[index] = (line[index] + a) & 255;
      else if (filter === 2) line[index] = (line[index] + b) & 255;
      else if (filter === 3) line[index] = (line[index] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        line[index] = (line[index] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    line.copy(rows, y * stride);
    previous = line;
  }
  const px = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const from = index * channels;
    const to = index * 4;
    if (channels >= 3) {
      px[to] = rows[from];
      px[to + 1] = rows[from + 1];
      px[to + 2] = rows[from + 2];
      px[to + 3] = channels === 4 ? rows[from + 3] : 255;
    } else {
      px[to] = px[to + 1] = px[to + 2] = rows[from];
      px[to + 3] = channels === 2 ? rows[from + 1] : 255;
    }
  }
  return { width, height, px };
}

describe('assets fournis — intégrité', () => {
  it('chaque fichier source est celui que l’expéditeur a validé', () => {
    // L'empreinte vient du manifeste livré avec le lot : si un fichier source
    // avait été retouché, même d'un pixel, elle ne tomberait plus juste.
    SUPPLIED_MANIFEST.included.forEach((entry) => {
      const path = join(SOURCE, entry.file);
      expect(existsSync(path), entry.file).toBe(true);
      const digest = createHash('sha256').update(readFileSync(path)).digest('hex');
      expect(digest, entry.file).toBe(entry.sha256);
    });
  });

  it('tout asset transporté vient d’un fichier fourni', () => {
    IMPORTED.assets.forEach((asset) => {
      expect(existsSync(join(SOURCE, asset.source)), asset.source).toBe(true);
      expect(existsSync(join(ASSETS, asset.group, `${asset.key}.png`)), asset.key).toBe(true);
    });
    expect(IMPORTED.assets.length).toBe(23);
  });

  it('les motifs de sol livrés sont EXACTEMENT la source, un pixel sur deux', () => {
    const factor = IMPORTED.shrink;
    IMPORTED.assets
      .filter((asset) => asset.group === 'tiles')
      .forEach((asset) => {
        const source = decode(join(SOURCE, asset.source));
        const shipped = decode(join(ASSETS, asset.group, `${asset.key}.png`));
        expect(shipped.width * factor, asset.key).toBe(source.width);

        // Comparaison pixel à pixel : aucune couleur nouvelle, aucun contour
        // adouci, aucun détail ajouté. C'est la garantie qu'on n'a rien
        // redessiné — pas une promesse dans un commentaire, une mesure.
        let checked = 0;
        for (let y = 0; y < shipped.height; y += 1) {
          for (let x = 0; x < shipped.width; x += 1) {
            const to = (y * shipped.width + x) * 4;
            const from = (y * factor * source.width + x * factor) * 4;
            for (let channel = 0; channel < 4; channel += 1) {
              if (shipped.px[to + channel] !== source.px[from + channel]) {
                throw new Error(
                  `${asset.key} : pixel (${x}, ${y}) canal ${channel} — ` +
                    `${shipped.px[to + channel]} au lieu de ${source.px[from + channel]}`
                );
              }
            }
            checked += 1;
          }
        }
        expect(checked, asset.key).toBe(shipped.width * shipped.height);
      });
  });

  it('les planches de personnages gardent le gabarit du moteur', () => {
    // La recomposition 6×3 → 8×3 est un rangement, pas un redimensionnement :
    // la frame reste celle que `Body.setCircle()` impose.
    IMPORTED.assets
      .filter((asset) => asset.group === 'characters')
      .forEach((asset) => {
        expect(asset.size[0], asset.key).toBe(CHARACTER_FRAME * 8);
        expect(asset.size[1], asset.key).toBe(CHARACTER_FRAME * 3);
        expect(CHARACTER_SHEETS as readonly string[], asset.key).toContain(asset.key);
      });
  });

  it('toute planche de personnage déclarée est fournie, aucune n’est générée', () => {
    const imported = new Set(IMPORTED.assets.map((asset) => asset.key));
    CHARACTER_SHEETS.forEach((key) => expect(imported.has(key), key).toBe(true));
    SHEET_MANIFEST.filter((sheet) => sheet.group === 'characters').forEach((sheet) => {
      expect(imported.has(sheet.key), sheet.key).toBe(true);
    });
  });

  it('tout accessoire fourni est déclaré au manifeste d’images', () => {
    const props = IMAGE_MANIFEST.props as readonly string[];
    IMPORTED.assets
      .filter((asset) => asset.group === 'props')
      .forEach((asset) => expect(props, asset.key).toContain(asset.key));
  });
});
