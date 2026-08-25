import Phaser from 'phaser';
import { DIGITS, IMAGE_MANIFEST, MENU_BACKGROUND } from '../game/artTheme';
import { ANIMATIONS, SHEET_MANIFEST } from '../game/animations';
import { Audio } from '../core/audio';
import { Save } from '../core/save';
import { SettingsStore } from '../core/settings';
import { REGISTRY_KEYS, createInputState } from '../game/session';

function unlockAudio(): void {
  Audio.unlock();
}

/**
 * Charge les assets une fois pour toutes et prépare l'état partagé.
 *
 * Depuis la V0.9, les visuels ne sont plus générés au démarrage : ce sont de
 * vrais PNG pixel art, produits hors ligne par `npm run art` et rangés dans
 * `public/assets/`. Un graphiste peut en remplacer n'importe lequel sans
 * toucher au code.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath(`${import.meta.env.BASE_URL}assets`);

    (Object.keys(IMAGE_MANIFEST) as (keyof typeof IMAGE_MANIFEST)[]).forEach((group) => {
      IMAGE_MANIFEST[group].forEach((key) => this.load.image(key, `${group}/${key}.png`));
    });

    // Planches : personnages, objets, porte, effets. Le découpage vient
    // toujours de `animations.ts`, jamais d'une valeur écrite dans une scène.
    SHEET_MANIFEST.forEach((sheet) => {
      this.load.spritesheet(sheet.key, `${sheet.group}/${sheet.key}.png`, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight
      });
    });

    this.load.image(MENU_BACKGROUND, `tiles/${MENU_BACKGROUND}.png`);
    this.load.spritesheet(DIGITS.key, `ui/${DIGITS.key}.png`, {
      frameWidth: DIGITS.frameWidth,
      frameHeight: DIGITS.frameHeight
    });
  }

  create() {
    // Sans filtrage NEAREST, chaque pixel d'art serait interpolé et tout le
    // travail de pixel art partirait en bouillie dès le moindre changement
    // d'échelle.
    this.textures.each((texture: Phaser.Textures.Texture) => {
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }, this);

    this.registerAnimations();

    SettingsStore.load();
    Save.migrateLegacy();
    this.registry.set(REGISTRY_KEYS.input, createInputState());

    // Le contexte audio ne peut naître que d'un geste utilisateur (iOS).
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    this.scene.start('Menu');
  }

  /**
   * Enregistre toutes les animations une fois pour toutes, dans le gestionnaire
   * global de Phaser. Aucune scène n'en crée : elles se contentent de jouer une
   * clé déclarée dans `animations.ts`.
   */
  private registerAnimations() {
    ANIMATIONS.forEach((animation) => {
      if (this.anims.exists(animation.key)) return;
      this.anims.create({
        key: animation.key,
        frames: this.anims.generateFrameNumbers(animation.sheet, { frames: animation.frames }),
        frameRate: animation.frameRate,
        repeat: animation.repeat
      });
    });
  }
}
