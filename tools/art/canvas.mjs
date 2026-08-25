/**
 * Canvas pixel minimal + DSL de sprites en ASCII.
 *
 * Le pixel art est AUTORISÉ à être écrit à la main ici : chaque sprite est une
 * grille de caractères lisible et modifiable, associée à une palette. Le
 * générateur les cuit en PNG dans `public/assets/`, que le jeu charge comme
 * n'importe quel asset. Un vrai graphiste peut remplacer le PNG sans toucher
 * une ligne de code.
 */
import { readFileSync } from 'node:fs';
import { encodePngRgba } from './png.mjs';

const PALETTE_PATH = new URL('../../src/game/palette.json', import.meta.url);
const RAW_PALETTE = JSON.parse(readFileSync(PALETTE_PATH, 'utf8'));

/** `#rrggbb` → [r, g, b]. */
export function rgb(name) {
  const hex = RAW_PALETTE[name];
  if (!hex) throw new Error(`Couleur absente de la palette : ${name}`);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

export class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
  }

  /** `color` : nom de palette, ou `null` pour effacer. `alpha` dans [0, 1]. */
  set(x, y, color, alpha = 1) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return this;
    const offset = (py * this.width + px) * 4;
    if (color === null) {
      this.data.fill(0, offset, offset + 4);
      return this;
    }
    const [r, g, b] = rgb(color);
    this.data[offset] = r;
    this.data[offset + 1] = g;
    this.data[offset + 2] = b;
    this.data[offset + 3] = Math.round(alpha * 255);
    return this;
  }

  fill(color, alpha = 1) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) this.set(x, y, color, alpha);
    }
    return this;
  }

  rect(x, y, w, h, color, alpha = 1) {
    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) this.set(x + dx, y + dy, color, alpha);
    }
    return this;
  }

  /** Contour de 1 pixel. */
  stroke(x, y, w, h, color, alpha = 1) {
    for (let dx = 0; dx < w; dx += 1) {
      this.set(x + dx, y, color, alpha);
      this.set(x + dx, y + h - 1, color, alpha);
    }
    for (let dy = 0; dy < h; dy += 1) {
      this.set(x, y + dy, color, alpha);
      this.set(x + w - 1, y + dy, color, alpha);
    }
    return this;
  }

  hLine(x, y, length, color, alpha = 1) {
    for (let dx = 0; dx < length; dx += 1) this.set(x + dx, y, color, alpha);
    return this;
  }

  vLine(x, y, length, color, alpha = 1) {
    for (let dy = 0; dy < length; dy += 1) this.set(x, y + dy, color, alpha);
    return this;
  }

  /** Contour de cercle, en pixels carrés (algorithme du point milieu). */
  circle(cx, cy, radius, color, alpha = 1) {
    let x = radius;
    let y = 0;
    let error = 1 - radius;
    while (x >= y) {
      [
        [x, y],
        [y, x],
        [-x, y],
        [-y, x],
        [-x, -y],
        [-y, -x],
        [x, -y],
        [y, -x]
      ].forEach(([dx, dy]) => this.set(cx + dx, cy + dy, color, alpha));
      y += 1;
      if (error < 0) error += 2 * y + 1;
      else {
        x -= 1;
        error += 2 * (y - x) + 1;
      }
    }
    return this;
  }

  /**
   * Dessine un sprite ASCII.
   * @param {string[]} rows lignes de même longueur
   * @param {Record<string, string|null>} legend caractère → nom de palette (`null` = transparent)
   */
  draw(rows, legend, offsetX = 0, offsetY = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((char, x) => {
        if (!(char in legend)) throw new Error(`Caractère non décrit dans la légende : « ${char} »`);
        const color = legend[char];
        if (color === null) return;
        this.set(offsetX + x, offsetY + y, color);
      });
    });
    return this;
  }

  /**
   * Mélange une couleur dans un pixel DÉJÀ peint, en gardant son opacité.
   * Sert aux reflets : un éclat doit éclaircir l'objet, pas le remplacer.
   */
  blend(x, y, color, alpha) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return this;
    const offset = (py * this.width + px) * 4;
    if (this.data[offset + 3] === 0) return this;
    const [r, g, b] = rgb(color);
    this.data[offset] = Math.round(this.data[offset] * (1 - alpha) + r * alpha);
    this.data[offset + 1] = Math.round(this.data[offset + 1] * (1 - alpha) + g * alpha);
    this.data[offset + 2] = Math.round(this.data[offset + 2] * (1 - alpha) + b * alpha);
    return this;
  }

  /**
   * Assombrit (ou réchauffe) tout ce qui est déjà peint, sans toucher au vide.
   * `fill` remplacerait les pixels : c'est ce qui transforme un diorama en
   * rectangle uni.
   */
  tintAll(color, alpha) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) this.blend(x, y, color, alpha);
    }
    return this;
  }

  /** Bande diagonale de reflet qui balaie l'objet. Base des idles d'objets. */
  sheen(offset, color, alpha, width = 2) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const d = x + y - offset;
        if (d >= 0 && d < width) this.blend(x, y, color, alpha);
      }
    }
    return this;
  }

  /** Copie indépendante, pour dériver une frame sans abîmer l'originale. */
  clone() {
    const copy = new PixelCanvas(this.width, this.height);
    copy.data.set(this.data);
    return copy;
  }

  /** Recopie un autre canvas, en ignorant ses pixels transparents. */
  blit(other, offsetX, offsetY) {
    for (let y = 0; y < other.height; y += 1) {
      for (let x = 0; x < other.width; x += 1) {
        const source = (y * other.width + x) * 4;
        if (other.data[source + 3] === 0) continue;
        const target = ((offsetY + y) * this.width + (offsetX + x)) * 4;
        if (offsetX + x < 0 || offsetX + x >= this.width || offsetY + y < 0 || offsetY + y >= this.height) {
          continue;
        }
        this.data.copyWithin(target, source, source + 4);
        this.data.set(other.data.subarray(source, source + 4), target);
      }
    }
    return this;
  }

  /**
   * Agrandit d'un facteur entier. Indispensable : un pixel d'art doit rester
   * un carré net, jamais un pixel interpolé.
   */
  scale(factor) {
    if (!Number.isInteger(factor) || factor < 1) {
      // Un agrandissement non entier interpolerait les pixels : c'est
      // exactement ce que le pixel art interdit.
      throw new Error(
        `Facteur d'échelle non entier : ${factor}. Le pixel art ne se redimensionne qu'en entiers.`
      );
    }
    const out = new PixelCanvas(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const source = (y * this.width + x) * 4;
        const pixel = this.data.subarray(source, source + 4);
        for (let dy = 0; dy < factor; dy += 1) {
          for (let dx = 0; dx < factor; dx += 1) {
            const target = ((y * factor + dy) * out.width + (x * factor + dx)) * 4;
            out.data.set(pixel, target);
          }
        }
      }
    }
    return out;
  }

  toPng() {
    return encodePngRgba(this.width, this.height, this.data);
  }
}

/**
 * Complète les lignes à droite jusqu'à `width`.
 * Écrire les points de fin à la main est la première source d'erreur : seuls
 * les points de GAUCHE portent une information de position.
 */
export function padRows(rows, width) {
  return rows.map((line, index) => {
    if (line.length > width) {
      throw new Error(`Ligne ${index} trop longue (${line.length} > ${width}) : « ${line} »`);
    }
    return line.padEnd(width, '.');
  });
}

/**
 * Assemble des frames de même taille en une bande horizontale.
 * C'est le format de planche du projet : une ligne de frames, lue par
 * `load.spritesheet` côté jeu.
 */
export function strip(frames) {
  const { width, height } = frames[0];
  const sheet = new PixelCanvas(width * frames.length, height);
  frames.forEach((frame, index) => {
    if (frame.width !== width || frame.height !== height) {
      throw new Error(`Frame ${index} de ${frame.width}×${frame.height} au lieu de ${width}×${height}.`);
    }
    sheet.blit(frame, index * width, 0);
  });
  return sheet;
}

/** Fabrique un canvas à partir d'un sprite ASCII, taillé à ses dimensions. */
export function fromRows(rows, legend) {
  const width = rows[0]?.length ?? 0;
  const ragged = rows.findIndex((row) => row.length !== width);
  if (ragged >= 0) {
    throw new Error(
      `Sprite irrégulier : la ligne ${ragged} fait ${rows[ragged].length} au lieu de ${width}.`
    );
  }
  const canvas = new PixelCanvas(width, rows.length);
  canvas.draw(rows, legend);
  return canvas;
}
