/**
 * Test de fumée : lance le build dans un vrai Chromium et parcourt le jeu.
 *
 * Les tests unitaires ne voient pas les pièges du moteur. Celui-ci a déjà
 * attrapé deux bugs réels : un glyphe manquant, et surtout des références vers
 * des objets détruits — Phaser réutilise l'INSTANCE de scène d'une partie à
 * l'autre, donc les initialiseurs de champs ne rejouent pas.
 *
 * Usage : npm run build && npm run smoke
 * Prérequis : Chromium de Playwright (PLAYWRIGHT_BROWSERS_PATH ou installé).
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const BASE = `http://localhost:${PORT}/Office-escape/`;
const EXECUTABLE = process.env.CHROMIUM_PATH;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false
});

async function waitForServer(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Le serveur de prévisualisation n'a pas démarré sur ${BASE}`);
}

const failures = [];
let browser;

try {
  await waitForServer();
  browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });

  const click = async (x, y, wait = 700) => {
    await page.mouse.click(x, y);
    await page.waitForTimeout(wait);
  };
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() =>
    ['level-01', 'level-02', 'level-03'].forEach((id) =>
      localStorage.setItem(`office-escape:v1:cleared:${id}`, '1')
    )
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const canvas = await page.$('canvas');
  if (!canvas) throw new Error('Aucun canvas : le jeu ne démarre pas.');

  // Chaque niveau : entrée, déplacement, pause, reprise, abandon, retour menu.
  for (const [index, y] of [
    [1, 210],
    [2, 368],
    [3, 526]
  ]) {
    await click(195, 452);
    await click(195, y, 1500);
    await hold('ArrowUp', 900);
    await click(276, 46);
    await click(195, 476);
    await hold('ArrowLeft', 500);
    await click(276, 46);
    await click(195, 540, 1400);
    await click(195, 596, 1200);
    console.log(`  niveau ${index} : parcouru`);
  }

  // Réglages : chaque bascule, y compris la taille de texte qui relance la scène.
  await click(195, 606);
  for (let row = 0; row < 6; row += 1) await click(305, 200 + row * 78, 500);
  console.log('  réglages : 6 bascules');
} catch (error) {
  failures.push(String(error));
} finally {
  await browser?.close();
  server.kill();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problème(s) détecté(s) :`);
  failures.forEach((failure) => console.error(`  - ${failure.slice(0, 1200)}`));
  process.exit(1);
}
console.log('\nTest de fumée : aucune erreur.');
