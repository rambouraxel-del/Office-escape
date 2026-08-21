/**
 * Génère les icônes PNG de la PWA sans aucune dépendance.
 *
 * Encodeur PNG minimal (zlib + CRC32) : le projet dessine déjà tous ses
 * visuels par le code, les icônes suivent la même règle — rien à installer,
 * rien de binaire à maintenir à la main.
 *
 * Usage : npm run icons
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const NAVY = [17, 29, 53];
const TEAL = [20, 156, 150];
const CREAM = [255, 247, 232];

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgb) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // profondeur
  header[9] = 2; // truecolor RGB
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filtre "None"
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 3;
      const target = rowStart + 1 + x * 3;
      raw[target] = rgb[source];
      raw[target + 1] = rgb[source + 1];
      raw[target + 2] = rgb[source + 2];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** Porte entrouverte + flèche de sortie, en supersampling 3x pour l'antialiasing. */
function shadeAt(u, v) {
  const inDoor = u > 0.2 && u < 0.62 && v > 0.16 && v < 0.86;
  if (inDoor) {
    const inner = u > 0.24 && u < 0.58 && v > 0.2 && v < 0.82;
    if (!inner) return CREAM;
    return TEAL;
  }

  // Flèche vers la droite, sortant de la porte.
  const shaftY = Math.abs(v - 0.51) < 0.075;
  const inShaft = shaftY && u > 0.6 && u < 0.83;
  const headSpan = 0.17 * (1 - (u - 0.72) / 0.17);
  const inHead = u >= 0.72 && u < 0.89 && Math.abs(v - 0.51) < headSpan;
  if (inShaft || inHead) return CREAM;

  return null;
}

function render(size) {
  const samples = 3;
  const rgb = Buffer.alloc(size * size * 3);
  const radius = size * 0.22;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const u = px / size;
          const v = py / size;

          // Coins arrondis : hors du masque, on reste sur le fond crème.
          const cx = Math.min(px, size - px);
          const cy = Math.min(py, size - py);
          const outside = cx < radius && cy < radius && Math.hypot(radius - cx, radius - cy) > radius;

          const color = outside ? CREAM : (shadeAt(u, v) ?? NAVY);
          r += color[0];
          g += color[1];
          b += color[2];
        }
      }
      const total = samples * samples;
      const offset = (y * size + x) * 3;
      rgb[offset] = Math.round(r / total);
      rgb[offset + 1] = Math.round(g / total);
      rgb[offset + 2] = Math.round(b / total);
    }
  }

  return encodePng(size, size, rgb);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [180, 192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, render(size));
  console.log(`icône générée : ${file}`);
}
