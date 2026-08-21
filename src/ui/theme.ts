import Phaser from 'phaser';
import { SettingsStore } from '../core/settings';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export interface TextOptions {
  size?: number;
  color?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  lineSpacing?: number;
  letterSpacing?: number;
  backgroundColor?: string;
  padding?: { x: number; y: number };
}

/**
 * Fabrique unique de textes.
 *
 * Passe par ici pour que le réglage d'accessibilité « taille du texte »
 * s'applique partout sans avoir à toucher chaque appel.
 */
export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  options: TextOptions = {}
): Phaser.GameObjects.Text {
  const scale = SettingsStore.get().textScale;
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT,
    fontSize: `${Math.round((options.size ?? 14) * scale)}px`,
    color: options.color ?? '#172238',
    align: options.align ?? 'left'
  };
  if (options.bold) style.fontStyle = 'bold';
  if (options.lineSpacing !== undefined) style.lineSpacing = options.lineSpacing;
  if (options.letterSpacing !== undefined) style.letterSpacing = options.letterSpacing;
  if (options.backgroundColor) style.backgroundColor = options.backgroundColor;
  if (options.padding) style.padding = options.padding;
  if (options.wrap) style.wordWrap = { width: options.wrap * scale };

  return scene.add.text(x, y, content, style);
}

export interface ButtonOptions {
  width: number;
  height: number;
  color: number;
  textColor?: string;
  size?: number;
  enabled?: boolean;
}

export interface Button {
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
  setEnabled(enabled: boolean): void;
}

/** Bouton rectangulaire : la seule forme de bouton du jeu. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  options: ButtonOptions,
  onPress: () => void
): Button {
  const enabled = options.enabled ?? true;
  const background = scene.add
    .rectangle(x, y, options.width, options.height, options.color, enabled ? 1 : 0.5)
    .setStrokeStyle(2, 0xffffff, 0.45);
  const text = makeText(scene, x, y, label, {
    size: options.size ?? 15,
    bold: true,
    color: options.textColor ?? '#ffffff',
    align: 'center',
    wrap: options.width - 24
  }).setOrigin(0.5);

  const setEnabled = (next: boolean) => {
    background.setFillStyle(options.color, next ? 1 : 0.45);
    text.setAlpha(next ? 1 : 0.6);
    if (next) background.setInteractive({ useHandCursor: true });
    else background.disableInteractive();
  };

  background.on('pointerdown', onPress);
  setEnabled(enabled);

  return { background, label: text, objects: [background, text], setEnabled };
}

/** Bandeau modal semi-opaque couvrant toute la vue. */
export function makeShade(scene: Phaser.Scene, width: number, height: number, alpha = 0.82) {
  return scene.add.rectangle(width / 2, height / 2, width, height, 0x081017, alpha);
}
