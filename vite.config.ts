import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig({
  base: '/Office-escape/',
  define: {
    // Source de vérité unique de la version : package.json.
    __APP_VERSION__: JSON.stringify(version)
  },
  build: {
    // Le découpage ci-dessous est volontaire : l'avertissement de taille ne
    // vise que le chunk Phaser, isolé exprès pour rester en cache.
    chunkSizeWarningLimit: 1500,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Le moteur change rarement, le jeu souvent : les séparer permet au
        // navigateur de garder Phaser en cache entre deux déploiements.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          return undefined;
        }
      }
    }
  }
});
