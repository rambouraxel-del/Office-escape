import Phaser from 'phaser';
import { ARCHETYPE_COLORS, COLORS } from '../game/constants';
import { Audio } from '../core/audio';
import { Save } from '../core/save';
import { SettingsStore } from '../core/settings';
import { REGISTRY_KEYS, createInputState } from '../game/session';

/**
 * Génère une fois pour toutes les textures procédurales et l'état partagé.
 *
 * En V0.7 ce travail était refait à chaque `scene.restart()` ; ici il n'a lieu
 * qu'au lancement.
 */
function unlockAudio(): void {
  Audio.unlock();
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('office-menu-bg', 'assets/office-menu-bg.webp');
  }

  create() {
    SettingsStore.load();
    Save.migrateLegacy();
    this.registry.set(REGISTRY_KEYS.input, createInputState());

    // Le contexte audio ne peut naître que d'un geste utilisateur (iOS).
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    this.createCharacterTextures();
    this.createItemTextures();
    this.createCameraTexture();

    this.scene.start('Menu');
  }

  private createCharacterTextures() {
    const character = (key: string, suit: number, hair: number, tie: number, big = false) => {
      if (this.textures.exists(key)) return;
      const g = this.add.graphics().setVisible(false);
      g.fillStyle(0x172238, 0.18).fillEllipse(32, 55, big ? 42 : 34, 10);
      g.lineStyle(3, COLORS.ink, 1);
      g.fillStyle(suit, 1).fillRoundedRect(big ? 12 : 15, 29, big ? 40 : 34, big ? 27 : 25, 11);
      g.strokeRoundedRect(big ? 12 : 15, 29, big ? 40 : 34, big ? 27 : 25, 11);
      g.fillStyle(0xf0b287, 1).fillCircle(32, 22, big ? 16 : 15);
      g.strokeCircle(32, 22, big ? 16 : 15);
      g.fillStyle(hair, 1).fillEllipse(32, big ? 10 : 11, big ? 31 : 29, big ? 13 : 15);
      g.fillStyle(0xffffff, 0.95).fillTriangle(25, 31, 39, 31, 32, 41);
      g.fillStyle(tie, 1).fillTriangle(29, 33, 35, 33, 32, 46);
      g.fillStyle(COLORS.ink, 1).fillCircle(27, 22, 1.5).fillCircle(37, 22, 1.5);
      if (big) {
        g.lineStyle(2, 0x4c2b23, 1).lineBetween(24, 28, 31, 26).lineBetween(33, 26, 40, 28);
        g.fillStyle(0x4c2b23, 1).fillRoundedRect(24, 27, 16, 4, 2);
      } else {
        g.lineStyle(1.5, 0x8c4c3d, 1).lineBetween(28, 28, 36, 28);
      }
      g.generateTexture(key, 64, 64);
      g.destroy();
    };

    character('char-player', COLORS.player, 0x3b2b27, 0xf0d06b);
    character('char-colleague', ARCHETYPE_COLORS.colleague, 0xb9572e, 0x29445d);
    character('char-boss', ARCHETYPE_COLORS.boss, 0x3a2726, 0xe6b94d, true);
    character('char-intern', ARCHETYPE_COLORS.intern, 0x5c4a33, 0xd7b25e);
    character('char-guard', ARCHETYPE_COLORS.guard, 0x2b2320, 0x9aa7b3, true);
    character('char-talker', 0xd98152, 0x71452d, 0x31566b);
  }

  private createItemTextures() {
    const canvasSize = 64;
    const center = canvasSize / 2;

    if (!this.textures.exists('item-donut')) {
      const g = this.add.graphics().setVisible(false);
      g.fillStyle(0xc88756, 1).fillCircle(center, center, 21);
      g.lineStyle(2, 0x895a38, 0.85).strokeCircle(center, center, 21);
      g.fillStyle(0xe58e9d, 0.96).fillCircle(center, center, 16);
      g.fillStyle(0xefe7d7, 1).fillCircle(center, center, 7);
      g.lineStyle(2, 0x9e6742, 0.8).strokeCircle(center, center, 7);
      g.fillStyle(0xffd9df, 0.9).fillCircle(center - 6, center - 7, 3);
      g.generateTexture('item-donut', canvasSize, canvasSize);
      g.destroy();
    }

    if (!this.textures.exists('item-coffee')) {
      const g = this.add.graphics().setVisible(false);
      g.fillStyle(0xf4efe4, 1).fillRoundedRect(20, 20, 24, 28, 4);
      g.lineStyle(3, COLORS.ink, 0.9).strokeRoundedRect(20, 20, 24, 28, 4);
      g.fillStyle(0x7a5a44, 1).fillRect(22, 24, 20, 7);
      g.lineStyle(3, COLORS.ink, 0.9).strokeCircle(48, 32, 6);
      g.generateTexture('item-coffee', canvasSize, canvasSize);
      g.destroy();
    }

    if (!this.textures.exists('item-badge')) {
      const g = this.add.graphics().setVisible(false);
      g.fillStyle(0xdfe7ee, 1).fillRoundedRect(20, 18, 24, 32, 4);
      g.lineStyle(3, COLORS.ink, 0.9).strokeRoundedRect(20, 18, 24, 32, 4);
      g.fillStyle(0x4f7f96, 1).fillRect(24, 24, 16, 9);
      g.fillStyle(0x8ea3b2, 1).fillRect(24, 37, 16, 3).fillRect(24, 42, 11, 3);
      g.lineStyle(2, COLORS.ink, 0.7).lineBetween(32, 18, 32, 10);
      g.generateTexture('item-badge', canvasSize, canvasSize);
      g.destroy();
    }

    if (!this.textures.exists('item-report')) {
      const g = this.add.graphics().setVisible(false);
      g.fillStyle(0xf6f2e6, 1).fillRect(20, 16, 26, 34);
      g.lineStyle(3, COLORS.ink, 0.9).strokeRect(20, 16, 26, 34);
      g.fillStyle(0x8b93a0, 1);
      [22, 28, 34, 40].forEach((y) => g.fillRect(24, y, 18, 3));
      g.fillStyle(COLORS.coral, 1).fillTriangle(40, 16, 46, 16, 46, 24);
      g.generateTexture('item-report', canvasSize, canvasSize);
      g.destroy();
    }
  }

  private createCameraTexture() {
    if (this.textures.exists('device-camera')) return;
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(COLORS.ink, 0.22).fillEllipse(32, 50, 30, 8);
    g.fillStyle(ARCHETYPE_COLORS.camera, 1).fillRoundedRect(16, 24, 34, 18, 6);
    g.lineStyle(3, COLORS.ink, 1).strokeRoundedRect(16, 24, 34, 18, 6);
    g.fillStyle(0x1c2530, 1).fillCircle(48, 33, 6);
    g.fillStyle(0xe85d4f, 1).fillCircle(22, 29, 3);
    g.fillStyle(ARCHETYPE_COLORS.camera, 1).fillRect(30, 14, 6, 12);
    g.generateTexture('device-camera', 64, 64);
    g.destroy();
  }
}
