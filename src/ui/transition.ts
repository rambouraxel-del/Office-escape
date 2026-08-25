import type Phaser from 'phaser';
import { SettingsStore } from '../core/settings';
import { PALETTE } from '../game/palette';

/**
 * Transitions entre scènes.
 *
 * Très courtes — 150 à 200 ms. Sur mobile, un fondu plus long se ressent comme
 * une latence, pas comme une intention. Et en mouvement réduit, on coupe : le
 * réglage promet l'absence d'animation, pas une animation plus lente.
 */
const FADE_IN_MS = 190;
const FADE_OUT_MS = 150;

function channels(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

/** Ouverture d'une scène. À appeler en fin de `create()`. */
export function enterScene(scene: Phaser.Scene): void {
  if (SettingsStore.get().reducedMotion) return;
  scene.cameras.main.fadeIn(FADE_IN_MS, ...channels(PALETTE.hudInset));
}

/**
 * Fermeture d'une scène, puis bascule. `run` part de toute façon : une
 * transition ne doit jamais pouvoir bloquer un changement d'écran.
 */
export function leaveScene(scene: Phaser.Scene, run: () => void): void {
  if (SettingsStore.get().reducedMotion) {
    run();
    return;
  }
  const camera = scene.cameras.main;
  camera.once('camerafadeoutcomplete', run);
  camera.fadeOut(FADE_OUT_MS, ...channels(PALETTE.hudInset));
}
