/**
 * Lecture et écriture de PNG RGBA, sans dépendance.
 *
 * Sert UNIQUEMENT à transporter les assets fournis : décoder, découper,
 * recomposer, réduire d'un facteur entier, ré-encoder. Aucune opération de
 * dessin — les assets fournis ne sont jamais retouchés.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** Image décodée : RGBA 8 bits, une ligne après l'autre. */
export class Bitmap {
  constructor(width, height, data) {
    this.width = width;
    this.height = height;
    this.data = data ?? Buffer.alloc(width * height * 4);
  }

  static read(path) {
    const file = readFileSync(path);
    const parts = [];
    let pos = 8;
    let width = 0;
    let height = 0;
    let depth = 0;
    let colour = 0;
    while (pos < file.length) {
      const length = file.readUInt32BE(pos);
      const type = file.toString('ascii', pos + 4, pos + 8);
      if (type === 'IHDR') {
        width = file.readUInt32BE(pos + 8);
        height = file.readUInt32BE(pos + 12);
        depth = file[pos + 16];
        colour = file[pos + 17];
        if (file[pos + 20] !== 0) throw new Error(`PNG entrelacé non géré : ${path}`);
      } else if (type === 'IDAT') parts.push(file.subarray(pos + 8, pos + 8 + length));
      pos += 12 + length;
    }
    if (depth !== 8) throw new Error(`PNG ${depth} bits non géré : ${path}`);
    const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colour];
    if (!channels) throw new Error(`PNG de type ${colour} non géré (palette ?) : ${path}`);

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
      unfilter(line, previous, filter, channels);
      line.copy(rows, y * stride);
      previous = line;
    }

    // Tout est ramené en RGBA : le reste de l'outil n'a qu'un seul cas à gérer.
    const image = new Bitmap(width, height);
    for (let index = 0; index < width * height; index += 1) {
      const from = index * channels;
      const to = index * 4;
      if (channels >= 3) {
        image.data[to] = rows[from];
        image.data[to + 1] = rows[from + 1];
        image.data[to + 2] = rows[from + 2];
        image.data[to + 3] = channels === 4 ? rows[from + 3] : 255;
      } else {
        image.data[to] = rows[from];
        image.data[to + 1] = rows[from];
        image.data[to + 2] = rows[from];
        image.data[to + 3] = channels === 2 ? rows[from + 1] : 255;
      }
    }
    return image;
  }

  write(path) {
    const stride = this.width * 4;
    const raw = Buffer.alloc(this.height * (stride + 1));
    for (let y = 0; y < this.height; y += 1) {
      raw[y * (stride + 1)] = 0;
      this.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.width, 0);
    header.writeUInt32BE(this.height, 4);
    header[8] = 8;
    header[9] = 6;
    writeFileSync(
      path,
      Buffer.concat([
        SIGNATURE,
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0))
      ])
    );
  }

  /** Sous-image, sans recopie de pixel superflue. */
  crop(x, y, width, height) {
    const out = new Bitmap(width, height);
    for (let row = 0; row < height; row += 1) {
      const from = ((y + row) * this.width + x) * 4;
      this.data.copy(out.data, row * width * 4, from, from + width * 4);
    }
    return out;
  }

  blit(other, x, y) {
    for (let row = 0; row < other.height; row += 1) {
      const to = ((y + row) * this.width + x) * 4;
      other.data.copy(this.data, to, row * other.width * 4, (row + 1) * other.width * 4);
    }
    return this;
  }

  /**
   * Réduction d'un facteur ENTIER par échantillonnage au plus proche.
   *
   * On prend un pixel sur `factor`, sans moyenne : c'est une décimation, pas
   * un rééchantillonnage. Aucune couleur nouvelle n'apparaît, aucun contour
   * ne devient flou — le dessin reste exactement celui qui a été fourni,
   * simplement moins dense. C'est la seule transformation que l'on s'autorise
   * sur un asset livré.
   */
  shrink(factor) {
    if (!Number.isInteger(factor) || factor < 1) throw new Error(`facteur non entier : ${factor}`);
    if (factor === 1) return this;
    if (this.width % factor || this.height % factor) {
      throw new Error(`${this.width}×${this.height} n'est pas divisible par ${factor}`);
    }
    const out = new Bitmap(this.width / factor, this.height / factor);
    for (let y = 0; y < out.height; y += 1) {
      for (let x = 0; x < out.width; x += 1) {
        const from = (y * factor * this.width + x * factor) * 4;
        this.data.copy(out.data, (y * out.width + x) * 4, from, from + 4);
      }
    }
    return out;
  }

  /** Rectangle englobant les pixels non transparents, ou `null`. */
  bounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.data[(y * this.width + x) * 4 + 3] === 0) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }
}

function unfilter(line, previous, filter, channels) {
  for (let index = 0; index < line.length; index += 1) {
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
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  let crc = ~0;
  for (let index = 4; index < 8 + data.length; index += 1) {
    crc ^= out[index];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  out.writeInt32BE(~crc, 8 + data.length);
  return out;
}
