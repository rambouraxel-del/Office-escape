import Phaser from 'phaser';
import {
  BASE_VISION_RANGE,
  BOSS_CHASE_SPEED,
  BOSS_PATROL_SPEED,
  BOSS_VISION_HALF_ANGLE,
  BOSS_VISION_RANGE,
  COLORS,
  DETECTION_ALERT_SECONDS,
  DETECTION_DECAY_PER_SECOND,
  DETECTION_INTERCEPT_SECONDS,
  GAME_HEIGHT,
  GAME_WIDTH,
  JOYSTICK_RADIUS,
  JOYSTICK_X,
  JOYSTICK_Y,
  NPC_CHASE_SPEED,
  NPC_PATROL_SPEED,
  NPC_RADIUS,
  PLAYER_RADIUS,
  REAL_MS_PER_GAME_MINUTE,
  RUN_DETECTION_MULTIPLIER,
  RUN_SPEED,
  RUN_VISION_MULTIPLIER,
  START_HOUR,
  START_MINUTE,
  VISION_HALF_ANGLE,
  WALK_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from '../game/constants';
import { buildVisionPolygon, isPointVisible } from '../game/geometry';

type GameState = 'playing' | 'intercepted' | 'completed';
type TutorialAnchor = 'player' | 'restroom' | 'pillar';

interface NpcAgent {
  id: string;
  label: string;
  actor: Phaser.GameObjects.Arc;
  body: Phaser.Physics.Arcade.Body;
  nameText: Phaser.GameObjects.Text;
  visionGraphics: Phaser.GameObjects.Graphics;
  directionGraphics: Phaser.GameObjects.Graphics;
  detectionBackground: Phaser.GameObjects.Rectangle;
  detectionFill: Phaser.GameObjects.Rectangle;
  detectionLabel: Phaser.GameObjects.Text;
  direction: Phaser.Math.Vector2;
  patrolPoints: Phaser.Math.Vector2[];
  patrolTargetIndex: number;
  patrolSpeed: number;
  chaseSpeed: number;
  visionRange: number;
  visionHalfAngle: number;
  alerted: boolean;
  detectionSeconds: number;
}

interface TutorialBubble {
  id: string;
  anchor: TutorialAnchor;
  container: Phaser.GameObjects.Container;
}

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private npcs: NpcAgent[] = [];

  private blockers: Phaser.Geom.Rectangle[] = [];
  private staticObstacles: Phaser.GameObjects.Rectangle[] = [];
  private moveVector = new Phaser.Math.Vector2();

  private joystickPointerId: number | null = null;
  private runPointerId: number | null = null;
  private runHeld = false;
  private isActuallyRunning = false;
  private isHidden = false;
  private elapsedRealMs = 0;
  private gameState: GameState = 'playing';

  private joystickKnob!: Phaser.GameObjects.Arc;
  private runButton!: Phaser.GameObjects.Arc;
  private runLabel!: Phaser.GameObjects.Text;
  private interactionButton!: Phaser.GameObjects.Arc;
  private interactionLabel!: Phaser.GameObjects.Text;
  private clockText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private hiddenText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;

  private keyboardKeys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private currentTutorial?: TutorialBubble;
  private dismissedTutorials = new Set<string>();
  private tutorialsCompleted = false;
  private hasMoved = false;
  private hasRun = false;
  private readonly spawnPoint = new Phaser.Math.Vector2(250, 2050);
  private readonly restroomDoor = new Phaser.Math.Vector2(138, 1580);
  private readonly restroomExit = new Phaser.Math.Vector2(168, 1580);
  private readonly pillarCenter = new Phaser.Math.Vector2(250, 860);

  constructor() {
    super('PrototypeScene');
  }

  create() {
    this.resetRuntimeState();
    this.input.addPointer(2);
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawFloor();
    this.createMap();
    this.createPlayer();
    this.createColleague();
    this.createBoss();
    this.createCamera();
    this.createHud();
    this.createJoystick();
    this.createRunButton();
    this.createInteractionButton();
    this.createKeyboardFallback();

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    if (!this.tutorialsCompleted) {
      this.showTutorial('move', 'Utilise le joystick pour avancer.', 'player');
    }
  }

  update(_time: number, delta: number) {
    if (this.gameState !== 'playing') return;

    this.elapsedRealMs += delta;
    this.updateClock();
    this.updatePlayer();
    this.updateNpcs();
    this.updateDetection(delta / 1000);
    this.updateInteraction();
    this.updateTutorials();
    this.updateTutorialPosition();
    this.drawNpcVision();

    if (!this.isHidden && this.player.y <= 430) {
      this.completeTest();
    }
  }

  private resetRuntimeState() {
    this.blockers = [];
    this.staticObstacles = [];
    this.npcs = [];
    this.moveVector.set(0, 0);
    this.joystickPointerId = null;
    this.runPointerId = null;
    this.runHeld = false;
    this.isActuallyRunning = false;
    this.isHidden = false;
    this.elapsedRealMs = 0;
    this.gameState = 'playing';
    this.dismissedTutorials.clear();
    this.currentTutorial = undefined;
    this.hasMoved = false;
    this.hasRun = false;

    try {
      this.tutorialsCompleted = localStorage.getItem('office-escape-tutorial-v03') === 'done';
    } catch {
      this.tutorialsCompleted = false;
    }
  }

  private drawFloor() {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.floor, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    graphics.lineStyle(1, COLORS.floorLine, 0.45);

    for (let y = 0; y <= WORLD_HEIGHT; y += 80) graphics.lineBetween(0, y, WORLD_WIDTH, y);
    for (let x = 0; x <= WORLD_WIDTH; x += 80) graphics.lineBetween(x, 0, x, WORLD_HEIGHT);

    this.add.rectangle(250, 2075, 310, 120, 0xcad8c4, 0.72).setDepth(0);
    this.add.text(250, 2075, 'TON BUREAU · DÉPART', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#52614e'
    }).setOrigin(0.5).setDepth(1);

    this.add.rectangle(250, 360, 310, 120, COLORS.green, 0.35).setDepth(0);
    this.add.text(250, 360, 'ZONE VALIDÉE · V0.3', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#31533a'
    }).setOrigin(0.5).setDepth(1);

    this.add.text(250, 1870, '↑  RENTRE CHEZ TOI  ↑', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#7c6d5e'
    }).setOrigin(0.5).setDepth(1);
  }

  private createMap() {
    const wall = (x: number, y: number, width: number, height: number, color: number = COLORS.wall) => {
      const object = this.add.rectangle(x, y, width, height, color).setDepth(8);
      this.physics.add.existing(object, true);
      this.staticObstacles.push(object);
      this.blockers.push(new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height));
      return object;
    };

    wall(21, WORLD_HEIGHT / 2, 42, WORLD_HEIGHT);
    wall(WORLD_WIDTH - 21, WORLD_HEIGHT / 2, 42, WORLD_HEIGHT);
    wall(WORLD_WIDTH / 2, 20, WORLD_WIDTH, 40);
    wall(WORLD_WIDTH / 2, WORLD_HEIGHT - 20, WORLD_WIDTH, 40);

    // Le bureau de départ possède une ouverture centrale vers le couloir.
    wall(106, 1900, 170, 35);
    wall(394, 1900, 170, 35);
    wall(85, 2030, 90, 105, COLORS.desk);
    wall(415, 2030, 90, 105, COLORS.desk);

    // Bloc WC : le joueur disparaît dans la porte, sans changement de scène.
    wall(77, 1580, 105, 230, 0x7791a0);
    this.add.rectangle(this.restroomDoor.x, this.restroomDoor.y, 16, 62, COLORS.door)
      .setStrokeStyle(3, 0xe8f1f5, 0.85)
      .setDepth(10);
    this.add.text(76, 1580, 'WC', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f5fbff'
    }).setOrigin(0.5).setDepth(11);

    // Quelques meubles structurent le couloir et coupent réellement la vision.
    wall(420, 1500, 90, 110, COLORS.desk);
    wall(80, 1245, 110, 75, COLORS.desk);

    // Deuxième défi : un pilier central autour duquel le boss effectue sa ronde.
    wall(this.pillarCenter.x, this.pillarCenter.y, 150, 190, 0x75695d);
    this.add.text(this.pillarCenter.x, this.pillarCenter.y, 'PILIER', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#eee6d8'
    }).setOrigin(0.5).setDepth(11);

    wall(77, 560, 110, 80, COLORS.desk);
    wall(423, 560, 110, 80, COLORS.desk);

    this.add.text(250, 1840, 'COULOIR PRINCIPAL', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9b8b78'
    }).setOrigin(0.5).setDepth(1);

    this.add.text(250, 1160, 'ZONE DU BOSS', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#806f83'
    }).setOrigin(0.5).setDepth(1);
  }

  private createPlayer() {
    this.player = this.add.circle(this.spawnPoint.x, this.spawnPoint.y, PLAYER_RADIUS, COLORS.player)
      .setStrokeStyle(3, 0xffffff, 0.8)
      .setDepth(30);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCircle(PLAYER_RADIUS);
    this.playerBody.setCollideWorldBounds(true);

    this.staticObstacles.forEach((obstacle) => this.physics.add.collider(this.player, obstacle));
  }

  private createColleague() {
    this.createNpc({
      id: 'colleague',
      label: 'COLLÈGUE',
      color: COLORS.colleague,
      labelColor: '#713a30',
      patrolPoints: [
        new Phaser.Math.Vector2(250, 1320),
        new Phaser.Math.Vector2(250, 1790)
      ],
      patrolSpeed: NPC_PATROL_SPEED,
      chaseSpeed: NPC_CHASE_SPEED,
      visionRange: BASE_VISION_RANGE,
      visionHalfAngle: VISION_HALF_ANGLE
    });
  }

  private createBoss() {
    this.createNpc({
      id: 'boss',
      label: 'BOSS',
      color: COLORS.boss,
      labelColor: '#563c62',
      patrolPoints: [
        new Phaser.Math.Vector2(105, 680),
        new Phaser.Math.Vector2(395, 680),
        new Phaser.Math.Vector2(395, 1040),
        new Phaser.Math.Vector2(105, 1040)
      ],
      patrolSpeed: BOSS_PATROL_SPEED,
      chaseSpeed: BOSS_CHASE_SPEED,
      visionRange: BOSS_VISION_RANGE,
      visionHalfAngle: BOSS_VISION_HALF_ANGLE
    });
  }

  private createNpc(config: {
    id: string;
    label: string;
    color: number;
    labelColor: string;
    patrolPoints: Phaser.Math.Vector2[];
    patrolSpeed: number;
    chaseSpeed: number;
    visionRange: number;
    visionHalfAngle: number;
  }) {
    const spawn = config.patrolPoints[0];
    const actor = this.add.circle(spawn.x, spawn.y, NPC_RADIUS, config.color)
      .setStrokeStyle(3, 0xffffff, 0.85)
      .setDepth(25);
    this.physics.add.existing(actor);
    const body = actor.body as Phaser.Physics.Arcade.Body;
    body.setCircle(NPC_RADIUS);
    body.setCollideWorldBounds(true);

    const nameText = this.add.text(actor.x, actor.y - 25, config.label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: config.labelColor
    }).setOrigin(0.5).setDepth(27);

    const detectionBackground = this.add.rectangle(actor.x - 34, actor.y - 45, 68, 8, 0x2d3942, 0.85)
      .setOrigin(0, 0.5)
      .setDepth(40)
      .setVisible(false);
    const detectionFill = this.add.rectangle(actor.x - 32, actor.y - 45, 64, 5, 0xf0c75e, 1)
      .setOrigin(0, 0.5)
      .setDepth(41)
      .setVisible(false);
    const detectionLabel = this.add.text(actor.x, actor.y - 58, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#5c382d'
    }).setOrigin(0.5).setDepth(42).setVisible(false);

    const agent: NpcAgent = {
      id: config.id,
      label: config.label,
      actor,
      body,
      nameText,
      visionGraphics: this.add.graphics().setDepth(4),
      directionGraphics: this.add.graphics().setDepth(26),
      detectionBackground,
      detectionFill,
      detectionLabel,
      direction: new Phaser.Math.Vector2(0, 1),
      patrolPoints: config.patrolPoints,
      patrolTargetIndex: 1,
      patrolSpeed: config.patrolSpeed,
      chaseSpeed: config.chaseSpeed,
      visionRange: config.visionRange,
      visionHalfAngle: config.visionHalfAngle,
      alerted: false,
      detectionSeconds: 0
    };

    this.staticObstacles.forEach((obstacle) => this.physics.add.collider(actor, obstacle));
    this.physics.add.overlap(this.player, actor, () => {
      if (!this.isHidden && this.gameState === 'playing') {
        this.interceptPlayer('contact', agent.label);
      }
    });
    this.npcs.push(agent);
  }

  private createCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 175);
    this.cameras.main.roundPixels = true;
  }

  private createHud() {
    this.add.rectangle(GAME_WIDTH / 2, 48, 370, 76, COLORS.hud, 0.94)
      .setStrokeStyle(1, 0xffffff, 0.16)
      .setScrollFactor(0)
      .setDepth(300);

    this.add.text(24, 30, 'OFFICE ESCAPE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(301);

    this.add.text(24, 52, 'V0.3 · Le boss rôde', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#c9d5dd'
    }).setScrollFactor(0).setDepth(301);

    this.clockText = this.add.text(350, 29, '17:00', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(301);

    this.stateText = this.add.text(350, 55, 'DISCRET', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#9fd4ad'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(301);

    this.hiddenText = this.add.text(GAME_WIDTH / 2, 105, 'CACHÉ · LE TEMPS CONTINUE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#365b6d',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(310).setVisible(false);

    this.toastText = this.add.text(GAME_WIDTH / 2, 615, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#18232de6',
      align: 'center',
      padding: { x: 13, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(350).setVisible(false);
  }

  private createJoystick() {
    this.add.circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS + 13, 0x17212a, 0.34)
      .setStrokeStyle(2, 0xffffff, 0.28)
      .setScrollFactor(0)
      .setDepth(320);

    this.add.circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS, 0xffffff, 0.14)
      .setScrollFactor(0)
      .setDepth(321);

    this.joystickKnob = this.add.circle(JOYSTICK_X, JOYSTICK_Y, 25, 0xffffff, 0.78)
      .setScrollFactor(0)
      .setDepth(322);

    const zone = this.add.zone(JOYSTICK_X, JOYSTICK_Y, 165, 165)
      .setScrollFactor(0)
      .setDepth(323)
      .setInteractive();

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== null || this.isHidden || this.gameState !== 'playing') return;
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
    });
  }

  private createRunButton() {
    this.runButton = this.add.circle(334, 750, 43, 0x8a4e3a, 0.82)
      .setStrokeStyle(2, 0xffffff, 0.34)
      .setScrollFactor(0)
      .setDepth(320)
      .setInteractive();

    this.runLabel = this.add.text(334, 750, 'COURIR', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(321);

    this.runButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isHidden || this.gameState !== 'playing') return;
      this.runPointerId = pointer.id;
      this.setRunHeld(true);
    });
  }

  private createInteractionButton() {
    this.interactionButton = this.add.circle(326, 640, 47, COLORS.door, 0.92)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setScrollFactor(0)
      .setDepth(330)
      .setInteractive()
      .setVisible(false);

    this.interactionLabel = this.add.text(326, 640, 'ENTRER', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(331).setVisible(false);

    this.interactionButton.on('pointerdown', () => {
      if (this.gameState !== 'playing') return;
      if (this.isHidden) this.leaveRestroom();
      else this.enterRestroom();
    });
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
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.keyboardKeys.space.on('down', () => {
      if (this.isHidden) this.leaveRestroom();
      else if (this.isNearRestroom()) this.enterRestroom();
    });
  }

  private updatePlayer() {
    if (this.isHidden) {
      this.isActuallyRunning = false;
      this.playerBody.setVelocity(0, 0);
      return;
    }

    const keyboardVector = this.readKeyboardVector();
    const touchActive = this.moveVector.lengthSq() > 0.001;
    const direction = touchActive ? this.moveVector.clone() : keyboardVector;
    if (direction.lengthSq() > 1) direction.normalize();

    const keyboardRunning = this.keyboardKeys.shift?.isDown ?? false;
    this.isActuallyRunning = (this.runHeld || keyboardRunning) && direction.lengthSq() > 0.01;
    const speed = this.isActuallyRunning ? RUN_SPEED : WALK_SPEED;
    this.playerBody.setVelocity(direction.x * speed, direction.y * speed);

    if (direction.lengthSq() > 0.01) {
      this.hasMoved ||= Phaser.Math.Distance.Between(
        this.spawnPoint.x,
        this.spawnPoint.y,
        this.player.x,
        this.player.y
      ) > 50;
      if (this.isActuallyRunning) this.hasRun = true;
    }
  }

  private updateNpcs() {
    for (const npc of this.npcs) {
      let target: Phaser.Math.Vector2;
      let speed: number;

      if (npc.alerted && !this.isHidden) {
        target = new Phaser.Math.Vector2(this.player.x, this.player.y);
        speed = npc.chaseSpeed;
      } else {
        target = npc.patrolPoints[npc.patrolTargetIndex];
        speed = npc.patrolSpeed;

        if (Phaser.Math.Distance.Between(npc.actor.x, npc.actor.y, target.x, target.y) < 12) {
          npc.patrolTargetIndex = (npc.patrolTargetIndex + 1) % npc.patrolPoints.length;
          target = npc.patrolPoints[npc.patrolTargetIndex];
        }
      }

      npc.direction.set(target.x - npc.actor.x, target.y - npc.actor.y);
      if (npc.direction.lengthSq() > 0.001) npc.direction.normalize();
      npc.body.setVelocity(npc.direction.x * speed, npc.direction.y * speed);
      npc.nameText.setPosition(npc.actor.x, npc.actor.y - 25);
    }
  }

  private updateDetection(deltaSeconds: number) {
    let anyoneVisible = false;
    let anyoneAlerted = false;

    for (const npc of this.npcs) {
      const directionAngle = Math.atan2(npc.direction.y, npc.direction.x);
      const range = npc.visionRange * (this.isActuallyRunning ? RUN_VISION_MULTIPLIER : 1);
      const visible = !this.isHidden && isPointVisible(
        this.player,
        npc.actor,
        directionAngle,
        npc.visionHalfAngle,
        range,
        this.blockers
      );

      if (visible) {
        const multiplier = this.isActuallyRunning ? RUN_DETECTION_MULTIPLIER : 1;
        npc.detectionSeconds = Math.min(
          DETECTION_INTERCEPT_SECONDS,
          npc.detectionSeconds + deltaSeconds * multiplier
        );
      } else {
        npc.detectionSeconds = Math.max(
          0,
          npc.detectionSeconds - deltaSeconds * DETECTION_DECAY_PER_SECOND
        );
      }

      if (npc.detectionSeconds >= DETECTION_ALERT_SECONDS) npc.alerted = true;
      else if (npc.detectionSeconds < 0.35) npc.alerted = false;

      if (npc.detectionSeconds >= DETECTION_INTERCEPT_SECONDS) {
        this.interceptPlayer('vision', npc.label);
        return;
      }

      anyoneVisible ||= visible;
      anyoneAlerted ||= npc.alerted;
      this.updateDetectionDisplay(npc);
    }

    if (this.isHidden) {
      this.stateText.setText('CACHÉ').setColor('#9dd6ef');
    } else if (anyoneAlerted) {
      this.stateText.setText('POURSUITE').setColor('#ff8a78');
    } else if (anyoneVisible) {
      this.stateText.setText('REPÉRAGE…').setColor('#ffd270');
    } else {
      this.stateText.setText('DISCRET').setColor('#9fd4ad');
    }
  }

  private updateDetectionDisplay(npc: NpcAgent) {
    const active = npc.detectionSeconds > 0.02;
    const ratio = Phaser.Math.Clamp(npc.detectionSeconds / DETECTION_INTERCEPT_SECONDS, 0, 1);
    const color = npc.alerted ? COLORS.coneAlert : COLORS.coneCalm;

    npc.detectionBackground.setPosition(npc.actor.x - 34, npc.actor.y - 45).setVisible(active);
    npc.detectionFill
      .setPosition(npc.actor.x - 32, npc.actor.y - 45)
      .setDisplaySize(Math.max(1, 64 * ratio), 5)
      .setFillStyle(color, 1)
      .setVisible(active);
    npc.detectionLabel
      .setPosition(npc.actor.x, npc.actor.y - 58)
      .setText(npc.alerted ? 'ALERTE !' : 'SUSPICION')
      .setColor(npc.alerted ? '#b13f35' : '#7b5c22')
      .setVisible(active);
  }

  private drawNpcVision() {
    for (const npc of this.npcs) {
      const angle = Math.atan2(npc.direction.y, npc.direction.x);
      const range = npc.visionRange * (this.isActuallyRunning ? RUN_VISION_MULTIPLIER : 1);
      const points = buildVisionPolygon(
        npc.actor,
        angle,
        npc.visionHalfAngle,
        range,
        this.blockers
      );
      const color = npc.alerted ? COLORS.coneAlert : COLORS.coneCalm;

      npc.visionGraphics.clear();
      npc.visionGraphics.fillStyle(color, npc.alerted ? 0.34 : 0.25);
      npc.visionGraphics.fillPoints(points, true);
      npc.visionGraphics.lineStyle(2, color, 0.42);
      npc.visionGraphics.strokePoints(points, true);

      const noseX = npc.actor.x + npc.direction.x * 24;
      const noseY = npc.actor.y + npc.direction.y * 24;
      npc.directionGraphics.clear();
      npc.directionGraphics.lineStyle(4, 0xffffff, 0.9);
      npc.directionGraphics.lineBetween(npc.actor.x, npc.actor.y, noseX, noseY);
    }
  }

  private updateInteraction() {
    const visible = this.isHidden || this.isNearRestroom();
    this.interactionButton.setVisible(visible);
    this.interactionLabel.setVisible(visible).setText(this.isHidden ? 'SORTIR' : 'ENTRER');
    this.hiddenText.setVisible(this.isHidden);
  }

  private isNearRestroom() {
    return Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.restroomDoor.x,
      this.restroomDoor.y
    ) <= 78;
  }

  private enterRestroom() {
    if (!this.isNearRestroom() || this.isHidden) return;
    this.isHidden = true;
    this.player.setVisible(false);
    this.playerBody.setVelocity(0, 0);
    this.playerBody.enable = false;
    this.resetJoystick();
    this.setRunHeld(false);
    this.showToast('Tu es caché. Le temps continue.');
  }

  private leaveRestroom() {
    if (!this.isHidden) return;

    const exitBlocked = this.npcs.some((npc) => Phaser.Math.Distance.Between(
      npc.actor.x,
      npc.actor.y,
      this.restroomExit.x,
      this.restroomExit.y
    ) < 58);
    if (exitBlocked) {
      this.showToast('Attends : le passage est bloqué !');
      return;
    }

    this.isHidden = false;
    this.player.setVisible(true).setPosition(this.restroomExit.x, this.restroomExit.y);
    this.playerBody.enable = true;
    this.playerBody.reset(this.restroomExit.x, this.restroomExit.y);
    this.showToast('La voie est libre.');
  }

  private updateClock() {
    this.clockText.setText(this.formatCurrentTime());
  }

  private formatCurrentTime() {
    const elapsedMinutes = Math.floor(this.elapsedRealMs / REAL_MS_PER_GAME_MINUTE);
    const totalMinutes = START_HOUR * 60 + START_MINUTE + elapsedMinutes;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private updateTutorials() {
    if (this.tutorialsCompleted || this.currentTutorial) return;

    if (this.dismissedTutorials.has('move') && this.hasMoved && !this.dismissedTutorials.has('run')) {
      this.showTutorial('run', 'Maintiens COURIR avec un second doigt.', 'player');
      return;
    }

    if (this.dismissedTutorials.has('run') && this.hasRun && !this.dismissedTutorials.has('visibility')) {
      this.showTutorial('visibility', 'Courir te rend plus visible.', 'player');
      return;
    }

    if (
      this.dismissedTutorials.has('visibility') &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.restroomDoor.x, this.restroomDoor.y) < 150 &&
      !this.dismissedTutorials.has('hide')
    ) {
      this.showTutorial('hide', 'Approche-toi puis entre pour te cacher.', 'restroom');
      return;
    }

    if (
      this.dismissedTutorials.has('hide') &&
      this.player.y < 1250 &&
      !this.dismissedTutorials.has('pillar')
    ) {
      this.showTutorial('pillar', 'Contourne le pilier pour couper la vue du boss.', 'pillar');
    }
  }

  private showTutorial(id: string, message: string, anchor: TutorialAnchor) {
    if (this.tutorialsCompleted || this.currentTutorial) return;

    const background = this.add.rectangle(0, 0, 252, 72, 0x14212b, 0.96)
      .setStrokeStyle(2, 0xffffff, 0.45);
    const text = this.add.text(0, -9, message, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 224 }
    }).setOrigin(0.5);
    const hint = this.add.text(0, 22, 'Touchez la bulle pour fermer', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#b9cbd6'
    }).setOrigin(0.5);

    const container = this.add.container(0, 0, [background, text, hint])
      .setSize(252, 72)
      .setDepth(250)
      .setInteractive(new Phaser.Geom.Rectangle(-126, -36, 252, 72), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => this.dismissTutorial());
    this.currentTutorial = { id, anchor, container };
    this.updateTutorialPosition();
  }

  private updateTutorialPosition() {
    if (!this.currentTutorial) return;

    if (this.currentTutorial.anchor === 'player') {
      this.currentTutorial.container.setPosition(this.player.x, this.player.y - 85);
    } else if (this.currentTutorial.anchor === 'restroom') {
      this.currentTutorial.container.setPosition(205, 1470);
    } else {
      this.currentTutorial.container.setPosition(this.pillarCenter.x, this.pillarCenter.y - 150);
    }
  }

  private dismissTutorial() {
    if (!this.currentTutorial) return;
    const id = this.currentTutorial.id;
    this.currentTutorial.container.destroy(true);
    this.currentTutorial = undefined;
    this.dismissedTutorials.add(id);

    if (id === 'pillar') {
      this.tutorialsCompleted = true;
      try {
        localStorage.setItem('office-escape-tutorial-v03', 'done');
      } catch {
        // Le jeu reste fonctionnel si le stockage privé du navigateur est bloqué.
      }
    }
  }

  private showToast(message: string) {
    this.toastTimer?.remove(false);
    this.toastText.setText(message).setVisible(true).setAlpha(1);
    this.toastTimer = this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: this.toastText,
        alpha: 0,
        duration: 220,
        onComplete: () => this.toastText.setVisible(false)
      });
    });
  }

  private interceptPlayer(reason: 'vision' | 'contact', npcLabel: string) {
    if (this.gameState !== 'playing') return;
    this.gameState = 'intercepted';
    this.stopActors();
    const explanation = reason === 'contact'
      ? `Tu as touché ${npcLabel} à ${this.formatCurrentTime()}.`
      : `${npcLabel} t'a repéré à ${this.formatCurrentTime()}.`;
    this.showEndOverlay('INTERCEPTÉ !', explanation, 0xb8493f, 'RECOMMENCER');
  }

  private completeTest() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'completed';
    this.stopActors();
    this.showEndOverlay(
      'ZONE VALIDÉE',
      `Tu as passé le collègue et le boss à ${this.formatCurrentTime()}.`,
      0x4f8b61,
      'REJOUER'
    );
  }

  private stopActors() {
    this.playerBody.setVelocity(0, 0);
    this.npcs.forEach((npc) => npc.body.setVelocity(0, 0));
    this.resetJoystick();
    this.setRunHeld(false);
    this.interactionButton.setVisible(false);
    this.interactionLabel.setVisible(false);
  }

  private showEndOverlay(title: string, message: string, color: number, buttonLabel: string) {
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x081017, 0.78)
      .setScrollFactor(0)
      .setDepth(600);
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 330, 245, 0xf8f4ea, 1)
      .setStrokeStyle(5, color, 1)
      .setScrollFactor(0)
      .setDepth(601);
    const heading = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, title, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(color).rgba
    }).setOrigin(0.5).setScrollFactor(0).setDepth(602);
    const body = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, message, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: '#33414b',
      align: 'center',
      wordWrap: { width: 270 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(602);
    const button = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 210, 54, color, 1)
      .setScrollFactor(0)
      .setDepth(602)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, buttonLabel, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(603);

    button.on('pointerdown', () => this.scene.restart());
    void shade;
    void panel;
    void heading;
    void body;
    void buttonText;
  }

  private setRunHeld(active: boolean) {
    this.runHeld = active;
    this.runButton.setFillStyle(active ? 0xb76142 : 0x8a4e3a, active ? 0.98 : 0.82);
    this.runButton.setScale(active ? 1.06 : 1);
    this.runLabel.setScale(active ? 1.06 : 1);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointerId) this.updateJoystick(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointerId) {
      this.joystickPointerId = null;
      this.resetJoystick();
    }

    if (pointer.id === this.runPointerId) {
      this.runPointerId = null;
      this.setRunHeld(false);
    }
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    const dx = pointer.x - JOYSTICK_X;
    const dy = pointer.y - JOYSTICK_Y;
    const distance = Math.hypot(dx, dy);
    const cappedDistance = Math.min(distance, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);

    this.joystickKnob.setPosition(
      JOYSTICK_X + Math.cos(angle) * cappedDistance,
      JOYSTICK_Y + Math.sin(angle) * cappedDistance
    );

    if (distance < 7) {
      this.moveVector.set(0, 0);
      return;
    }

    const strength = Math.min(distance / JOYSTICK_RADIUS, 1);
    this.moveVector.set(Math.cos(angle) * strength, Math.sin(angle) * strength);
  }

  private resetJoystick() {
    this.moveVector.set(0, 0);
    this.joystickKnob?.setPosition(JOYSTICK_X, JOYSTICK_Y);
  }

  private readKeyboardVector() {
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
