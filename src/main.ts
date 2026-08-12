import Phaser from 'phaser';
import './style.css';

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;
const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 2200;

const WALK_SPEED = 175;
const RUN_SPEED = 290;
const JOYSTICK_RADIUS = 58;
const JOYSTICK_X = 190;
const JOYSTICK_Y = 758;

class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private moveVector = new Phaser.Math.Vector2(0, 0);
  private joystickPointerId: number | null = null;
  private runPointerId: number | null = null;
  private isRunning = false;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private runButton!: Phaser.GameObjects.Arc;
  private runLabel!: Phaser.GameObjects.Text;
  private keyboardKeys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor() {
    super('PrototypeScene');
  }

  create() {
    this.input.addPointer(2);
    this.cameras.main.setBackgroundColor('#efe7d7');
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawFloor();
    this.createPlayer();
    this.createWallsAndObstacles();
    this.createCamera();
    this.createHud();
    this.createJoystick();
    this.createRunButton();
    this.createKeyboardFallback();

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
  }

  update() {
    const keyboardVector = this.readKeyboardVector();
    const touchActive = this.moveVector.lengthSq() > 0.001;
    const direction = touchActive ? this.moveVector.clone() : keyboardVector;

    if (direction.lengthSq() > 1) {
      direction.normalize();
    }

    const shiftRunning = this.keyboardKeys.shift?.isDown ?? false;
    const speed = (this.isRunning || shiftRunning) ? RUN_SPEED : WALK_SPEED;

    this.playerBody.setVelocity(direction.x * speed, direction.y * speed);

    if (direction.lengthSq() > 0.01) {
      this.player.rotation = Math.atan2(direction.y, direction.x) + Math.PI / 2;
    }
  }

  private drawFloor() {
    const g = this.add.graphics();
    g.fillStyle(0xeee4d1, 1);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    g.lineStyle(1, 0xd7cbb5, 0.45);
    for (let y = 0; y <= WORLD_HEIGHT; y += 80) {
      g.lineBetween(0, y, WORLD_WIDTH, y);
    }
    for (let x = 0; x <= WORLD_WIDTH; x += 80) {
      g.lineBetween(x, 0, x, WORLD_HEIGHT);
    }

    this.add.rectangle(250, 2110, 310, 100, 0xcad8c4, 0.7).setDepth(0);
    this.add.text(250, 2110, 'DÉPART', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#52614e'
    }).setOrigin(0.5).setDepth(1);

    this.add.rectangle(250, 90, 310, 110, 0xbad7c2, 0.8).setDepth(0);
    this.add.text(250, 90, 'HAUT DE LA ZONE TEST', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#31533a'
    }).setOrigin(0.5).setDepth(1);
  }

  private createPlayer() {
    this.player = this.add.circle(250, 2040, 18, 0x3f6f8f).setDepth(20);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCircle(18);
    this.playerBody.setCollideWorldBounds(true);
  }

  private createWallsAndObstacles() {
    const walls: Phaser.GameObjects.Rectangle[] = [];

    const wall = (x: number, y: number, width: number, height: number, color = 0x665b50) => {
      const object = this.add.rectangle(x, y, width, height, color).setDepth(8);
      this.physics.add.existing(object, true);
      walls.push(object);
      return object;
    };

    wall(35, WORLD_HEIGHT / 2, 42, WORLD_HEIGHT);
    wall(WORLD_WIDTH - 35, WORLD_HEIGHT / 2, 42, WORLD_HEIGHT);
    wall(WORLD_WIDTH / 2, 20, WORLD_WIDTH, 40);
    wall(WORLD_WIDTH / 2, WORLD_HEIGHT - 20, WORLD_WIDTH, 40);

    wall(150, 1810, 150, 70, 0x9f8064);
    wall(365, 1640, 120, 75, 0x9f8064);
    wall(155, 1450, 120, 180, 0x8b725e);
    wall(350, 1250, 150, 70, 0x9f8064);
    wall(250, 1010, 80, 220, 0x74685c);
    wall(130, 760, 120, 70, 0x9f8064);
    wall(365, 600, 120, 180, 0x8b725e);
    wall(205, 360, 190, 70, 0x9f8064);

    walls.forEach((object) => this.physics.add.collider(this.player, object));
  }

  private createCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 180);
    this.cameras.main.roundPixels = true;
  }

  private createHud() {
    this.add.rectangle(GAME_WIDTH / 2, 43, 350, 58, 0x18232d, 0.9)
      .setScrollFactor(0)
      .setDepth(100);

    this.add.text(GAME_WIDTH / 2, 32, 'OFFICE ESCAPE  ·  V0.1', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(GAME_WIDTH / 2, 53, 'Test déplacement — monte vers le haut', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#d7e0e7'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  private createJoystick() {
    this.add.circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS + 13, 0x17212a, 0.28)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setScrollFactor(0)
      .setDepth(100);

    this.add.circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS, 0xffffff, 0.13)
      .setScrollFactor(0)
      .setDepth(101);

    this.joystickKnob = this.add.circle(JOYSTICK_X, JOYSTICK_Y, 25, 0xffffff, 0.72)
      .setScrollFactor(0)
      .setDepth(102);

    const zone = this.add.zone(JOYSTICK_X, JOYSTICK_Y, 160, 160)
      .setScrollFactor(0)
      .setDepth(103)
      .setInteractive();

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== null) return;
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
    });
  }

  private createRunButton() {
    this.runButton = this.add.circle(334, 750, 43, 0x8a4e3a, 0.78)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();

    this.runLabel = this.add.text(334, 750, 'COURIR', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.runButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.runPointerId = pointer.id;
      this.setRunning(true);
    });
  }

  private setRunning(active: boolean) {
    this.isRunning = active;
    this.runButton.setFillStyle(active ? 0xb76142 : 0x8a4e3a, active ? 0.98 : 0.78);
    this.runButton.setScale(active ? 1.06 : 1);
    this.runLabel.setScale(active ? 1.06 : 1);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointerId) {
      this.updateJoystick(pointer);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointerId) {
      this.joystickPointerId = null;
      this.moveVector.set(0, 0);
      this.joystickKnob.setPosition(JOYSTICK_X, JOYSTICK_Y);
    }

    if (pointer.id === this.runPointerId) {
      this.runPointerId = null;
      this.setRunning(false);
    }
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    const dx = pointer.x - JOYSTICK_X;
    const dy = pointer.y - JOYSTICK_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const cappedDistance = Math.min(distance, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);

    const knobX = JOYSTICK_X + Math.cos(angle) * cappedDistance;
    const knobY = JOYSTICK_Y + Math.sin(angle) * cappedDistance;
    this.joystickKnob.setPosition(knobX, knobY);

    if (distance < 7) {
      this.moveVector.set(0, 0);
      return;
    }

    const strength = Math.min(distance / JOYSTICK_RADIUS, 1);
    this.moveVector.set(Math.cos(angle) * strength, Math.sin(angle) * strength);
  }

  private createKeyboardFallback() {
    if (!this.input.keyboard) return;

    this.keyboardKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private readKeyboardVector() {
    if (!this.input.keyboard) return new Phaser.Math.Vector2(0, 0);

    const left = this.keyboardKeys.left?.isDown || this.keyboardKeys.a?.isDown || this.keyboardKeys.q?.isDown;
    const right = this.keyboardKeys.right?.isDown || this.keyboardKeys.d?.isDown;
    const up = this.keyboardKeys.up?.isDown || this.keyboardKeys.w?.isDown || this.keyboardKeys.z?.isDown;
    const down = this.keyboardKeys.down?.isDown || this.keyboardKeys.s?.isDown;

    return new Phaser.Math.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0)
    );
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#efe7d7',
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