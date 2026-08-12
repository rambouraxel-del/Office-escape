import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { PrototypeScene } from './scenes/PrototypeScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#efe7d7',
  render: {
    antialias: true,
    roundPixels: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  input: {
    activePointers: 3
  },
  scene: [PrototypeScene]
};

new Phaser.Game(config);
