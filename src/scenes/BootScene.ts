import Phaser from 'phaser';
import { ASSET_MANIFEST, DIGITS, MENU_BACKGROUND } from '../game/artTheme';
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

    (Object.keys(ASSET_MANIFEST) as (keyof typeof ASSET_MANIFEST)[]).forEach((group) => {
      ASSET_MANIFEST[group].forEach((key) => this.load.image(key, `${group}/${key}.png`));
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

    SettingsStore.load();
    Save.migrateLegacy();
    this.registry.set(REGISTRY_KEYS.input, createInputState());

    // Le contexte audio ne peut naître que d'un geste utilisateur (iOS).
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    this.scene.start('Menu');
  }
}
