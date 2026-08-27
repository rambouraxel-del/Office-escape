/**
 * Contrôle d'affichage mobile : plusieurs tailles d'écran en portrait.
 *
 * Vérifie qu'aucun élément d'interface ne sort du cadre et qu'aucune erreur ne
 * remonte, sur les formats réellement rencontrés — du petit téléphone à la
 * tablette. Le jeu tient dans un canvas de 390 × 844 mis à l'échelle : c'est
 * le CANVAS qu'on mesure, pas le DOM.
 *
 * Usage : npm run build && npm run mobile
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.MOBILE_PORT ?? 4174);
const BASE = `http://localhost:${PORT}/Office-escape/`;
const EXECUTABLE = process.env.CHROMIUM_PATH;

/** Formats portrait couverts. Le plus étroit et le plus large du marché. */
const SCREENS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932 },
  { name: 'iPad mini', width: 744, height: 1133 }
];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore'
});

const failures = [];
let browser;

try {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});

  for (const screen of SCREENS) {
    const page = await browser.newPage({
      viewport: { width: screen.width, height: screen.height },
      hasTouch: true,
      isMobile: true
    });
    page.on('pageerror', (error) => failures.push(`${screen.name} — pageerror : ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`${screen.name} — console : ${message.text()}`);
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2400);

    const box = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight
      };
    });

    if (!box) {
      failures.push(`${screen.name} — aucun canvas`);
      await page.close();
      continue;
    }

    // Le canvas doit tenir ENTIÈREMENT dans la fenêtre : un bord coupé, c'est
    // un bouton qu'on ne peut plus atteindre au pouce.
    const margin = 1;
    if (box.left < -margin || box.top < -margin) {
      failures.push(`${screen.name} — canvas hors cadre en haut/à gauche (${box.left}, ${box.top})`);
    }
    if (box.right > box.clientWidth + margin || box.bottom > box.clientHeight + margin) {
      failures.push(
        `${screen.name} — canvas débordant (${Math.round(box.right)}×${Math.round(box.bottom)} ` +
          `pour ${box.clientWidth}×${box.clientHeight})`
      );
    }
    if (box.scrollWidth > box.clientWidth + margin) {
      failures.push(`${screen.name} — débordement horizontal du document`);
    }
    // Le jeu est dessiné en 390 × 844 : le rapport doit être conservé, sinon
    // les zones tactiles ne tombent plus là où on les voit.
    const ratio = box.width / box.height;
    if (Math.abs(ratio - 390 / 844) > 0.02) {
      failures.push(`${screen.name} — rapport d'image ${ratio.toFixed(3)} au lieu de ${(390 / 844).toFixed(3)}`);
    }

    console.log(
      `  ${screen.name.padEnd(20)} ${screen.width}×${screen.height}` +
        ` → canvas ${Math.round(box.width)}×${Math.round(box.height)}` +
        ` à (${Math.round(box.left)}, ${Math.round(box.top)})`
    );
    await page.close();
  }
} catch (error) {
  failures.push(String(error));
} finally {
  await browser?.close();
  server.kill();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problème(s) d'affichage :`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}
console.log('\nAffichage mobile : aucun débordement, aucune erreur.');
