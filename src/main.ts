import Phaser from 'phaser';
import './style.css';
import { VIEW_HEIGHT, VIEW_WIDTH } from './game/constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelScene } from './scenes/LevelScene';
import { UiScene } from './scenes/UiScene';
import { ResultScene } from './scenes/ResultScene';

declare const __APP_VERSION__: string;

document.title = `Office Escape — v${__APP_VERSION__}`;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  backgroundColor: '#efe7d7',
  // `pixelArt` coupe le lissage et cale le rendu sur des pixels entiers :
  // sans lui, chaque sprite serait interpolé et le pixel art disparaîtrait.
  render: { pixelArt: true, roundPixels: true },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT
  },
  // Joystick + course + interaction peuvent être pressés simultanément.
  input: { activePointers: 4 },
  scene: [BootScene, MenuScene, LevelScene, UiScene, ResultScene]
};

export const game = new Phaser.Game(config);

// Le service worker n'a de sens qu'en production servie en HTTPS.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  globalThis.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* hors ligne indisponible : le jeu fonctionne quand même */
    });
  });
}
