import Phaser from 'phaser';
import { DIGITS, NINE_SLICE_CORNER, OUTLINE, TEXT } from '../game/artTheme';
import { SettingsStore } from '../core/settings';
import { PALETTE } from '../game/palette';

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
    color: options.color ?? TEXT.onLight,
    align: options.align ?? 'left'
  };
  if (options.bold) style.fontStyle = 'bold';
  if (options.lineSpacing !== undefined) style.lineSpacing = options.lineSpacing;
  if (options.letterSpacing !== undefined) style.letterSpacing = options.letterSpacing;
  if (options.backgroundColor) style.backgroundColor = options.backgroundColor;
  if (options.padding) style.padding = options.padding;
  // La largeur d'habillage est une largeur de PANNEAU, en pixels d'écran : elle
  // ne suit pas l'échelle du texte. La faire grandir avec la police faisait
  // déborder les bulles du cadre dès qu'on augmentait la taille des textes.
  if (options.wrap) style.wordWrap = { width: options.wrap };

  return scene.add.text(x, y, content, style);
}

/** Bandeau modal semi-opaque couvrant toute la vue. */
export function makeShade(scene: Phaser.Scene, width: number, height: number, alpha = 0.82) {
  return scene.add.rectangle(width / 2, height / 2, width, height, PALETTE.hudInset, alpha);
}

// ───────────────────────── habillage pixel art (V0.9) ─────────────────────

/**
 * Panneau en 9 tranches : les coins gardent leur taille, seul le centre
 * s'étire. C'est ce qui permet d'avoir des panneaux de n'importe quelle
 * dimension sans déformer un seul pixel d'art.
 */
export type PanelSkin =
  'ui-panel' | 'ui-panel-dark' | 'ui-panel-inset' | 'ui-button' | 'ui-button-warm' | 'ui-button-muted';

export function makePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  texture: PanelSkin = 'ui-panel'
): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(
    x,
    y,
    texture,
    undefined,
    width,
    height,
    NINE_SLICE_CORNER,
    NINE_SLICE_CORNER,
    NINE_SLICE_CORNER,
    NINE_SLICE_CORNER
  );
}

export type PixelButtonSkin = Extract<PanelSkin, `ui-button${string}`>;

export interface PixelButton {
  background: Phaser.GameObjects.NineSlice;
  label: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
  setEnabled(enabled: boolean): void;
}

/**
 * Bouton pixel art : habillage en 9 tranches et enfoncement au toucher.
 * C'est la SEULE forme de bouton du jeu depuis la V0.9.
 */
export function makePixelButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  options: {
    width: number;
    height: number;
    skin?: PixelButtonSkin;
    size?: number;
    color?: string;
    enabled?: boolean;
  },
  onPress: () => void
): PixelButton {
  const skin = options.skin ?? 'ui-button';
  const background = makePanel(scene, x, y, options.width, options.height, skin);
  const text = makeText(scene, x, y, label, {
    size: options.size ?? 15,
    bold: true,
    color: options.color ?? TEXT.onDark,
    align: 'center',
    wrap: options.width - 20
  }).setOrigin(0.5);

  const setEnabled = (enabled: boolean) => {
    background.setAlpha(enabled ? 1 : 0.45);
    text.setAlpha(enabled ? 1 : 0.5);
    if (enabled) background.setInteractive({ useHandCursor: true });
    else background.disableInteractive();
  };

  // Retour tactile : le bouton s'enfonce d'un pixel d'art.
  background.on('pointerdown', () => {
    background.setY(y + OUTLINE);
    text.setY(y + OUTLINE);
    onPress();
  });
  const release = () => {
    background.setY(y);
    text.setY(y);
  };
  background.on('pointerup', release);
  background.on('pointerout', release);

  setEnabled(options.enabled ?? true);
  return { background, label: text, objects: [background, text], setEnabled };
}

/**
 * Le deux-points est plus étroit que les chiffres : on resserre son avance
 * pour que l'horloge ne paraisse pas trouée.
 */
function glyphAdvance(char: string): number {
  return char === ':' ? DIGITS.frameWidth - 6 : DIGITS.frameWidth + 1;
}

export interface ClockOptions {
  /** Agrandissement entier. L'écran de fin s'en sert pour dominer la page. */
  scale?: number;
  /** `right` cale la dernière glyphe sur `anchor`, `center` centre dessus. */
  align?: 'right' | 'center';
}

/**
 * Horloge en chiffres dessinés.
 *
 * L'heure est l'information la plus regardée du jeu : c'est le seul élément
 * qui justifie sa propre police. Le reste de l'interface garde la police
 * système, plus lisible sur mobile qu'une fonte pixel à petite taille.
 */
export class PixelClock {
  private readonly glyphs: Phaser.GameObjects.Image[] = [];
  private readonly scale: number;
  private readonly align: 'right' | 'center';
  private last = '';

  constructor(
    scene: Phaser.Scene,
    private readonly anchor: number,
    private readonly top: number,
    depth: number,
    tint: number,
    options: ClockOptions = {}
  ) {
    this.scale = options.scale ?? 1;
    this.align = options.align ?? 'right';
    // « HH:MM » : cinq glyphes, jamais réalloués.
    for (let index = 0; index < 5; index += 1) {
      this.glyphs.push(
        scene.add
          .image(0, top, DIGITS.key, 0)
          .setOrigin(0, 0)
          .setScale(this.scale)
          .setDepth(depth)
          .setTint(tint)
          .setVisible(false)
      );
    }
  }

  setText(value: string): void {
    if (value === this.last) return;
    this.last = value;

    const chars = [...value].slice(0, 5);
    const total = chars.reduce((sum, char) => sum + glyphAdvance(char), 0) * this.scale;

    let x = this.align === 'center' ? this.anchor - total / 2 : this.anchor - total;
    chars.forEach((char, index) => {
      const glyph = this.glyphs[index];
      const frame = char === ':' ? DIGITS.colonFrame : Number(char);
      glyph.setFrame(Number.isNaN(frame) ? DIGITS.colonFrame : frame);
      glyph.setPosition(x, this.top).setVisible(true);
      x += glyphAdvance(char) * this.scale;
    });
    for (let index = chars.length; index < this.glyphs.length; index += 1) {
      this.glyphs[index].setVisible(false);
    }
  }

  setTint(tint: number): void {
    this.glyphs.forEach((glyph) => glyph.setTint(tint));
  }

  /** Les glyphes, pour animer leur arrivée. */
  get objects(): readonly Phaser.GameObjects.Image[] {
    return this.glyphs;
  }
}
