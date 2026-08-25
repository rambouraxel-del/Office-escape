import Phaser from 'phaser';
import {
  COFFEE_DURATION_MS,
  COFFEE_RUN_MULTIPLIER,
  COFFEE_WALK_MULTIPLIER,
  COLORS,
  DEPTH,
  DEFAULT_CHASE_SPEED,
  DEFAULT_PATROL_SPEED,
  DISTRACTION_RADIUS,
  DISTRACTION_SECONDS,
  INTERACTION_RADIUS,
  MANUAL_PAUSE_PENALTY_MINUTES,
  PLAYER_RADIUS,
  POCKET_SLOT_STEP,
  POCKET_SLOT_X,
  POCKET_SLOT_Y,
  REACT_MS,
  RUN_SPEED,
  RUN_VISION_MULTIPLIER,
  WALK_SPEED,
  EXIT_FLOURISH_MS,
  INTERCEPT_FLOURISH_MS
} from '../game/constants';
import { Audio, vibrate } from '../core/audio';
import { GameClock } from '../core/clock';
import { Prng } from '../core/prng';
import { Save } from '../core/save';
import { SettingsStore } from '../core/settings';
import { FR } from '../core/strings';
import { GhostPlayer, GhostRecorder } from '../systems/GhostRecorder';
import { Inventory } from '../systems/Inventory';
import { NpcController } from '../systems/NpcController';
import { TutorialDirector } from '../systems/TutorialDirector';
import { REGISTRY_KEYS, type InputState, type RunRequest, type RunResult } from '../game/session';
import { getLevel } from '../levels';
import { ITEM_TEXTURES, PLAYER_TEXTURE, WORLD_TEXT } from '../game/artTheme';
import type { CharacterState } from '../game/animations';
import { playCharacter } from './animate';
import { LevelView, type NpcVisual } from './LevelView';
import { rectContains } from '../game/geometry';
import type { ItemId, LevelDef, ObstacleDef, TriggerDef } from '../game/types';
import { makeText } from '../ui/theme';
import { enterScene } from '../ui/transition';

export type LevelState = 'playing' | 'paused' | 'dialogue' | 'finished';

interface ItemInstance {
  id: ItemId;
  sprite: Phaser.GameObjects.Sprite;
  /** Étiquette au sol : elle part avec l'objet, sinon elle reste orpheline. */
  label: Phaser.GameObjects.Text;
  collected: boolean;
  x: number;
  y: number;
}

/**
 * Interpréteur de `LevelDef` : ne connaît aucun niveau en particulier.
 *
 * Le dessin est délégué à `LevelView`, l'IA à `NpcController`, le HUD à
 * `UiScene`. Cette scène ne garde que l'orchestration et les règles.
 */
export class LevelScene extends Phaser.Scene {
  level!: LevelDef;
  state: LevelState = 'playing';
  clock!: GameClock;
  inventory = new Inventory();
  coffeeUntil = 0;

  private request!: RunRequest;
  private prng!: Prng;
  private view!: LevelView;
  private inputState!: InputState;

  private player!: Phaser.GameObjects.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private npcs: NpcVisual[] = [];
  private items: ItemInstance[] = [];
  private doors = new Map<string, Phaser.GameObjects.Rectangle>();
  private ghost?: Phaser.GameObjects.Sprite;
  private ghostPlayer?: GhostPlayer;
  private recorder = new GhostRecorder();

  private tutorials!: TutorialDirector;
  private tutorialBubble?: Phaser.GameObjects.Container;

  private hiddenIn: string | null = null;
  private isRunning = false;
  private hasRun = false;
  private resolvedDialogues = new Set<string>();
  private firedTriggers = new Set<string>();
  private distraction: { x: number; y: number; until: number } | null = null;

  private neverSpotted = true;
  private suspicionEvents = 0;
  private suspicionActive = new Set<string>();
  private usedHidingSpot = false;

  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private lastTickMinute = -1;

  constructor() {
    super('Level');
  }

  create() {
    this.request = this.registry.get(REGISTRY_KEYS.request) as RunRequest;
    this.level = getLevel(this.request.levelId);
    this.prng = new Prng(this.request.seed);
    this.inputState = this.registry.get(REGISTRY_KEYS.input) as InputState;

    this.resetRunState();

    this.physics.world.setBounds(0, 0, this.level.size.w, this.level.size.h);
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.view = new LevelView(this, this.level);
    this.view.drawFloor();
    this.doors = this.view.drawObstacles();
    this.view.drawDecor();
    this.view.drawInteractionHints();

    this.spawnItems();
    this.spawnPlayer();
    this.spawnNpcs();
    this.spawnGhost();
    this.view.drawAmbient();

    this.cameras.main.setBounds(0, 0, this.level.size.w, this.level.size.h);
    this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
    this.cameras.main.setDeadzone(72, 150);
    this.cameras.main.roundPixels = true;

    this.setupKeyboard();
    this.setupLifecycle();

    this.tutorials = new TutorialDirector(this.level.tutorials, Save.areTutorialsDone(this.level.id));
    this.scene.launch('Ui');
    Audio.startAmbient();
    enterScene(this);
  }

  private resetRunState() {
    this.state = 'playing';
    this.clock = new GameClock(
      this.level.clock.startHour,
      this.level.clock.startMinute,
      this.level.clock.msPerMinute
    );
    this.inventory = new Inventory();
    this.npcs = [];
    this.items = [];
    this.hiddenIn = null;
    this.isRunning = false;
    this.hasRun = false;
    this.coffeeUntil = 0;
    this.resolvedDialogues.clear();
    this.firedTriggers.clear();
    this.suspicionActive.clear();
    this.distraction = null;
    this.neverSpotted = true;
    this.suspicionEvents = 0;
    this.usedHidingSpot = false;
    this.lastTickMinute = -1;
    this.recorder.reset();
    // Phaser réutilise l'instance de scène : ces références pointeraient sinon
    // vers des objets détruits par la partie précédente.
    this.doors = new Map();
    this.tutorialBubble = undefined;
    this.ghost = undefined;
    this.ghostPlayer = undefined;
  }

  // ─────────────────────────────── mise en place ───────────────────────────

  private spawnPlayer() {
    this.player = this.add
      .sprite(this.level.spawn.x, this.level.spawn.y, PLAYER_TEXTURE)
      .setDepth(DEPTH.player);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCircle(PLAYER_RADIUS);
    this.playerBody.setCollideWorldBounds(true);
    this.view.solids.forEach((solid) => this.physics.add.collider(this.player, solid));
  }

  private spawnNpcs() {
    this.level.npcs.forEach((def, index) => {
      const controller = new NpcController(
        def,
        def.patrolSpeed ?? DEFAULT_PATROL_SPEED,
        def.chaseSpeed ?? DEFAULT_CHASE_SPEED,
        // La seed décale les phases : le Défi du jour ne rejoue pas la même
        // ouverture que la partie libre.
        this.request.daily ? this.prng.next() : 0
      );
      const visual = this.view.createNpc(def, controller, index);

      if (!controller.isCamera) {
        this.view.solids.forEach((solid) => this.physics.add.collider(visual.sprite, solid));
        this.physics.add.overlap(this.player, visual.sprite, () => {
          if (this.hiddenIn === null && this.state === 'playing') {
            this.punchIntercept();
            this.finish(
              'intercepted',
              FR.result.caughtByContact(def.label, this.clock.format()),
              INTERCEPT_FLOURISH_MS
            );
          }
        });
      }

      this.npcs.push(visual);
    });
  }

  private spawnItems() {
    this.level.items.forEach((spawn) => {
      const sprite = this.add.sprite(spawn.at.x, spawn.at.y, ITEM_TEXTURES[spawn.id]).setDepth(DEPTH.item);
      this.view.playItemIdle(sprite, ITEM_TEXTURES[spawn.id]);
      this.tweens.add({
        targets: sprite,
        y: spawn.at.y - 5,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
      const label = makeText(this, spawn.at.x, spawn.at.y + 30, FR.items[spawn.id].name.toUpperCase(), {
        size: 10,
        bold: true,
        color: WORLD_TEXT.floor
      })
        .setOrigin(0.5)
        .setDepth(DEPTH.item);
      this.items.push({ id: spawn.id, sprite, label, collected: false, x: spawn.at.x, y: spawn.at.y });
    });
  }

  private spawnGhost() {
    const track = Save.getGhost(this.level.id);
    if (!track || track.length < 2 || this.request.daily) return;
    this.ghostPlayer = new GhostPlayer(track);
    this.ghost = this.add
      .sprite(track[0].x, track[0].y, PLAYER_TEXTURE)
      .setDepth(DEPTH.ghost)
      .setAlpha(0.32)
      .setTint(COLORS.ghost);
  }

  private setupKeyboard() {
    // Les entrées tactiles viennent de `UiScene` via le registre ; le clavier
    // reste branché ici comme secours bureau.
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.keys = keyboard.addKeys({
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
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.keys.space.on('down', () => this.handleInteraction());
    this.keys.escape.on('down', () => this.requestPause(false));
    this.keys.one.on('down', () => this.useSlot(0));
    this.keys.two.on('down', () => this.useSlot(1));
  }

  private setupLifecycle() {
    const pauseForBackground = () => this.requestPause(true);
    this.game.events.on(Phaser.Core.Events.BLUR, pauseForBackground);
    this.game.events.on(Phaser.Core.Events.HIDDEN, pauseForBackground);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, pauseForBackground);
      this.game.events.off(Phaser.Core.Events.HIDDEN, pauseForBackground);
      Audio.stopAmbient();
      this.scene.stop('Ui');
    });
  }

  // ──────────────────────────────── boucle ────────────────────────────────

  update(time: number, delta: number) {
    this.consumeOneShotInputs();
    if (this.state !== 'playing') return;

    this.clock.advance(delta);
    this.tickClockSound();

    if (this.clock.reachedHour(this.level.clock.failAtHour)) {
      this.finish('overtime');
      return;
    }

    this.updatePlayer();
    this.view.updateLight(this.player.x, this.player.y);
    this.updateGhost(delta);
    this.updateDistraction(time);
    this.updateNpcs(delta / 1000);
    this.updateTutorials();
    this.updateTriggers();
    this.recorder.update(delta, this.player.x, this.player.y);
  }

  private consumeOneShotInputs() {
    if (this.inputState.pausePressed) {
      this.inputState.pausePressed = false;
      this.requestPause(false);
    }
    if (this.inputState.interactPressed) {
      this.inputState.interactPressed = false;
      this.handleInteraction();
    }
    if (this.inputState.useSlot !== null) {
      const slot = this.inputState.useSlot;
      this.inputState.useSlot = null;
      this.useSlot(slot);
    }
  }

  private tickClockSound() {
    const minute = this.clock.elapsedMinutes;
    if (minute === this.lastTickMinute) return;
    this.lastTickMinute = minute;
    const remaining =
      (this.level.clock.failAtHour - this.level.clock.startHour) * 60 - this.level.clock.startMinute - minute;
    if (remaining <= 5 && remaining >= 0) Audio.play('tick');
  }

  private updatePlayer() {
    if (this.hiddenIn !== null) {
      this.isRunning = false;
      this.playerBody.setVelocity(0, 0);
      return;
    }

    const keyboard = this.readKeyboardVector();
    const touchLength = Math.hypot(this.inputState.moveX, this.inputState.moveY);
    const useTouch = touchLength > 0.001;
    let dx = useTouch ? this.inputState.moveX : keyboard.x;
    let dy = useTouch ? this.inputState.moveY : keyboard.y;

    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    const moving = length > 0.01;
    const runHeld = this.inputState.runHeld || (this.keys.shift?.isDown ?? false);
    this.isRunning = runHeld && moving;

    const boosted = this.time.now < this.coffeeUntil;
    const speed = this.isRunning
      ? RUN_SPEED * (boosted ? COFFEE_RUN_MULTIPLIER : 1)
      : WALK_SPEED * (boosted ? COFFEE_WALK_MULTIPLIER : 1);
    this.playerBody.setVelocity(dx * speed, dy * speed);

    if (moving) {
      Audio.play('step');
      if (this.isRunning) this.hasRun = true;
    }

    const state: CharacterState = moving ? (this.isRunning ? 'run' : 'walk') : 'idle';
    // On passe la VITESSE, pas le vecteur normalisé : l'animateur raisonne en
    // unités de monde par seconde, comme pour les PNJ.
    playCharacter(this.player, PLAYER_TEXTURE, state, dx * speed, dy * speed);
  }

  private updateGhost(delta: number) {
    if (!this.ghost || !this.ghostPlayer) return;
    const sample = this.ghostPlayer.update(delta);
    if (!sample) {
      this.ghost.setVisible(false);
      return;
    }
    const dx = sample.x - this.ghost.x;
    const dy = sample.y - this.ghost.y;
    this.ghost.setPosition(sample.x, sample.y);
    // Le fantôme rejoue des positions, pas des vitesses : on redérive son
    // orientation du déplacement, ramené à une seconde.
    const scale = 1000 / Math.max(delta, 1);
    playCharacter(
      this.ghost,
      PLAYER_TEXTURE,
      Math.hypot(dx, dy) > 0.4 ? 'walk' : 'idle',
      dx * scale,
      dy * scale
    );
  }

  private updateDistraction(time: number) {
    if (this.distraction && time > this.distraction.until) this.distraction = null;
  }

  private updateNpcs(deltaSeconds: number) {
    const runVisionMultiplier = this.isRunning ? RUN_VISION_MULTIPLIER : 1;

    for (const npc of this.npcs) {
      const range = npc.visionRange * runVisionMultiplier;
      const visible =
        this.hiddenIn === null && this.view.canSee(npc, this.player, range, npc.visionHalfAngle);

      const justAlerted = npc.controller.updateDetection(deltaSeconds, visible, this.isRunning);
      this.trackSuspicion(npc, justAlerted);

      if (npc.controller.shouldIntercept) {
        this.punchIntercept();
        this.finish(
          'intercepted',
          FR.result.caughtByVision(npc.def.label, this.clock.format()),
          INTERCEPT_FLOURISH_MS
        );
        return;
      }

      const distractionInRange =
        this.distraction &&
        Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, this.distraction.x, this.distraction.y) <
          DISTRACTION_RADIUS
          ? { x: this.distraction.x, y: this.distraction.y }
          : null;

      const intent = npc.controller.update(deltaSeconds, {
        position: npc.sprite,
        playerVisible: visible,
        playerPosition: this.player,
        playerRunning: this.isRunning,
        blocked: !npc.body?.blocked.none,
        distraction: distractionInRange
      });

      if (npc.body) {
        const dx = intent.target.x - npc.sprite.x;
        const dy = intent.target.y - npc.sprite.y;
        const distance = Math.hypot(dx, dy) || 1;
        npc.body.setVelocity((dx / distance) * intent.speed, (dy / distance) * intent.speed);
      }

      this.view.updateNpc(npc, intent.facing, range);
    }
  }

  private trackSuspicion(npc: NpcVisual, justAlerted: boolean) {
    const id = npc.def.id;
    if (npc.controller.detectionSeconds > 0.05) {
      if (!this.suspicionActive.has(id)) {
        this.suspicionActive.add(id);
        this.suspicionEvents += 1;
        Audio.play('suspicion');
      }
    } else {
      this.suspicionActive.delete(id);
    }

    if (justAlerted) {
      npc.reactUntil = this.time.now + REACT_MS;
      this.neverSpotted = false;
      Audio.play('alert');
      vibrate(45);
      if (!SettingsStore.get().reducedMotion) {
        // Flash court + secousse minuscule : l'impact doit se voir sans gêner
        // la lecture du terrain une demi-seconde plus tard.
        this.cameras.main.flash(110, 232, 84, 63, false);
        this.cameras.main.shake(140, 0.004);
        this.tweens.add({ targets: npc.sprite, scale: 1.28, duration: 120, yoyo: true, repeat: 1 });
      }
    }
  }

  // ────────────────────────────── interactions ─────────────────────────────

  /** Cible d'interaction courante, lue par le HUD pour libeller son bouton. */
  get interactionLabel(): string | null {
    if (this.state !== 'playing') return null;
    if (this.hiddenIn !== null) return FR.controls.leave;
    if (this.nearestHidingSpot()) return FR.controls.enter;
    if (this.nearestItem()) return FR.controls.pick;
    if (this.nearestDoor()) return FR.controls.open;
    return null;
  }

  private nearestHidingSpot() {
    return this.level.hidingSpots.find(
      (spot) =>
        Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.door.x, spot.door.y) <=
        INTERACTION_RADIUS
    );
  }

  private nearestItem() {
    return this.items.find(
      (item) =>
        !item.collected &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) <= INTERACTION_RADIUS
    );
  }

  private nearestDoor(): ObstacleDef | undefined {
    return this.level.obstacles.find(
      (obstacle) =>
        obstacle.kind === 'door' &&
        obstacle.lock !== undefined &&
        this.doors.has(obstacle.id ?? '') &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, obstacle.x, obstacle.y) <=
          INTERACTION_RADIUS + Math.max(obstacle.w, obstacle.h) / 2
    );
  }

  private handleInteraction() {
    if (this.state !== 'playing') return;

    if (this.hiddenIn !== null) {
      this.leaveHidingSpot();
      return;
    }

    const spot = this.nearestHidingSpot();
    if (spot) {
      this.enterHidingSpot(spot.id);
      return;
    }

    const item = this.nearestItem();
    if (item) {
      this.collectItem(item);
      return;
    }

    const door = this.nearestDoor();
    if (door) this.openDoor(door);
  }

  private collectItem(item: ItemInstance) {
    const result = this.inventory.add(item.id);
    if (result === 'full') {
      this.toast(FR.toasts.inventoryFull);
      return;
    }
    item.collected = true;
    const slot = this.inventory.items.indexOf(item.id);
    this.view.collectItem(item.sprite, {
      x: POCKET_SLOT_X + Math.max(0, slot) * POCKET_SLOT_STEP,
      y: POCKET_SLOT_Y
    });
    this.tweens.add({ targets: item.label, alpha: 0, duration: 200, onComplete: () => item.label.destroy() });
    this.events.emit('item-collected', slot);
    this.tutorials.dismissIf(item.id);
    this.dismissTutorialBubble(item.id);
    Audio.play('pickup');
    vibrate(30);
    this.toast(
      FR.itemFeedback.picked(FR.items[item.id].name, this.inventory.collected, this.level.items.length)
    );
    if (!SettingsStore.get().reducedMotion) {
      this.tweens.add({ targets: this.player, scale: 1.25, duration: 110, yoyo: true });
    }
  }

  private openDoor(door: ObstacleDef) {
    if (!door.lock || !this.inventory.has(door.lock)) {
      this.toast(FR.toasts.doorLocked);
      return;
    }
    const rectangle = this.doors.get(door.id ?? '');
    if (!rectangle) return;
    this.view.openDoor(rectangle);
    this.doors.delete(door.id ?? '');
    Audio.play('door');
    vibrate(25);
    this.toast(FR.toasts.doorOpened);
    // Le badge n'est pas consommé : il rouvrira d'autres portes.
    this.tutorials.dismissIf('door');
    this.dismissTutorialBubble('door');
  }

  private useSlot(slot: number) {
    if (this.state !== 'playing') return;
    const item = this.inventory.at(slot);
    if (!item) return;

    if (item === 'coffee') {
      this.inventory.remove(item);
      this.coffeeUntil = this.time.now + COFFEE_DURATION_MS;
      Audio.play('pickup');
      this.toast(FR.itemFeedback.coffee);
      return;
    }

    if (item === 'report') {
      this.inventory.remove(item);
      this.distraction = {
        x: this.player.x,
        y: this.player.y,
        until: this.time.now + DISTRACTION_SECONDS * 1000
      };
      this.view.showDistraction(this.player.x, this.player.y, DISTRACTION_SECONDS * 1000);
      Audio.play('door');
      this.toast(FR.itemFeedback.report);
      this.tutorials.dismissIf('use');
      this.dismissTutorialBubble('use');
      return;
    }

    if (item === 'badge') {
      this.toast(FR.itemFeedback.badgeKept);
      return;
    }

    // Le donut ne se consomme qu'en dialogue : le gaspiller serait une impasse.
    this.toast(FR.items[item].use);
  }

  private enterHidingSpot(id: string) {
    this.hiddenIn = id;
    this.usedHidingSpot = true;
    this.player.setVisible(false);
    this.playerBody.setVelocity(0, 0);
    this.playerBody.enable = false;
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
    Audio.play('door');
    this.toast(FR.toasts.hiddenOn);
  }

  private leaveHidingSpot() {
    const spot = this.level.hidingSpots.find((candidate) => candidate.id === this.hiddenIn);
    if (!spot) return;

    const blocked = this.npcs.some(
      (npc) =>
        !npc.controller.isCamera &&
        Phaser.Math.Distance.Between(npc.sprite.x, npc.sprite.y, spot.exit.x, spot.exit.y) < 58
    );
    if (blocked) {
      this.toast(FR.toasts.hiddenBlocked);
      return;
    }

    this.hiddenIn = null;
    this.player.setVisible(true);
    this.playerBody.enable = true;
    this.playerBody.reset(spot.exit.x, spot.exit.y);
    Audio.play('door');
    this.toast(FR.toasts.hiddenOff);
  }

  // ─────────────────────────────── tutoriels ──────────────────────────────

  private updateTutorials() {
    if (this.tutorialBubble) {
      const anchor = this.tutorialBubble.getData('anchor') as { x: number; y: number } | 'player';
      if (anchor === 'player') this.tutorialBubble.setPosition(this.player.x, this.player.y - 85);
      return;
    }

    const next = this.tutorials.pick({
      player: this.player,
      spawn: this.level.spawn,
      hasRun: this.hasRun,
      pendingItems: this.items.filter((item) => !item.collected).map((item) => item.id),
      heldItems: this.inventory.items.filter((item): item is ItemId => item !== null)
    });
    if (!next) return;

    this.tutorialBubble = this.view.createTutorialBubble(next, () => {
      const id = this.tutorials.dismiss();
      this.tutorialBubble?.destroy(true);
      this.tutorialBubble = undefined;
      if (id && this.tutorials.allDismissed) Save.markTutorialsDone(this.level.id);
    });
  }

  private dismissTutorialBubble(id: string) {
    if (!this.tutorialBubble || this.tutorialBubble.getData('id') !== id) return;
    this.tutorialBubble.destroy(true);
    this.tutorialBubble = undefined;
    if (this.tutorials.allDismissed) Save.markTutorialsDone(this.level.id);
  }

  // ──────────────────────────────── triggers ──────────────────────────────

  private updateTriggers() {
    if (this.hiddenIn !== null) return;

    for (const trigger of this.level.triggers) {
      if (this.firedTriggers.has(trigger.id)) continue;
      if (!rectContains(trigger.zone, this.player)) continue;
      if (trigger.requiresDialoguesResolved && !this.allDialoguesResolved()) continue;

      if (trigger.kind === 'dialogue') {
        this.firedTriggers.add(trigger.id);
        this.openDialogue(trigger);
        return;
      }

      this.firedTriggers.add(trigger.id);
      this.view.celebrateExit(this.player.x, this.player.y);
      if (!SettingsStore.get().reducedMotion) this.cameras.main.flash(220, 122, 196, 79, false);
      this.finish('escaped', undefined, EXIT_FLOURISH_MS);
      return;
    }
  }

  private allDialoguesResolved(): boolean {
    return this.level.dialogues.every((dialogue) => this.resolvedDialogues.has(dialogue.id));
  }

  private openDialogue(trigger: TriggerDef) {
    const dialogue = this.level.dialogues.find((candidate) => candidate.id === trigger.payload);
    if (!dialogue) return;

    this.state = 'dialogue';
    this.stopActors();
    this.events.emit('dialogue-open', dialogue, (choiceId: string) => {
      const choice = dialogue.choices.find((candidate) => candidate.id === choiceId);
      if (!choice) return null;

      if (choice.requiresItem) this.inventory.remove(choice.requiresItem);
      const success = this.prng.chance(choice.successChance);
      const minutes = success ? choice.rewardMinutes : choice.penaltyMinutes;
      this.clock.addPenaltyMinutes(minutes);
      vibrate(success ? 35 : [70, 45, 90]);
      Audio.play(success ? 'pickup' : 'fail');
      return { success, minutes, text: success ? choice.successText : choice.failureText };
    });
    this.events.once('dialogue-closed', () => {
      this.resolvedDialogues.add(dialogue.id);
      this.state = 'playing';
      this.view.markTalkerDone(dialogue.id);
      this.toast(FR.toasts.exitOpen);
    });
  }

  // ────────────────────────────── pause & fin ─────────────────────────────

  requestPause(automatic: boolean) {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.stopActors();
    // Anti-exploit : geler l'horloge à volonté fausserait le seul score qui
    // compte. La pause reste possible, mais elle se paie.
    if (!automatic) this.clock.addPenaltyMinutes(MANUAL_PAUSE_PENALTY_MINUTES);
    this.events.emit('paused', automatic);
  }

  resumeFromPause() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    if (!SettingsStore.get().muted) Audio.play('ui');
  }

  abandonRun() {
    this.finish('intercepted', FR.result.abandoned);
  }

  private stopActors() {
    this.playerBody.setVelocity(0, 0);
    this.npcs.forEach((npc) => npc.body?.setVelocity(0, 0));
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
    this.inputState.runHeld = false;
  }

  /**
   * Fin de partie.
   *
   * `flourishMs` ne retarde QUE le changement d'écran. L'état passe à
   * « finished » tout de suite, donc `update()` s'arrête et l'horloge se fige :
   * le score est calculé avant le moindre effet, jamais après.
   */
  private finish(outcome: RunResult['outcome'], reason?: string, flourishMs = 0) {
    if (this.state === 'finished') return;
    this.state = 'finished';
    this.stopActors();
    Audio.stopAmbient();
    Audio.play(outcome === 'escaped' ? 'win' : 'fail');
    vibrate(outcome === 'escaped' ? 35 : [80, 50, 120]);

    const result: RunResult = {
      request: this.request,
      outcome,
      finishedAt: this.clock.format(),
      reason,
      stats: {
        minutes: this.clock.elapsedMinutes,
        neverSpotted: this.neverSpotted,
        suspicionEvents: this.suspicionEvents,
        itemsCollected: this.inventory.collected,
        itemsTotal: this.level.items.length,
        usedHidingSpot: this.usedHidingSpot
      }
    };

    if (outcome === 'escaped') this.persistRun(result);
    this.registry.set(REGISTRY_KEYS.result, result);
    // `Ui` est arrêtée par le SHUTDOWN ci-dessous, jamais ici : un double arrêt
    // suivi d'un `launch` immédiat détruisait des objets encore mis à jour.
    const reduced = SettingsStore.get().reducedMotion;
    if (flourishMs > 0 && !reduced) this.time.delayedCall(flourishMs, () => this.scene.start('Result'));
    else this.scene.start('Result');
  }

  private persistRun(result: RunResult) {
    Save.markCleared(this.level.id);

    const previous = this.request.daily
      ? Save.getDailyRecord(this.request.dayKey ?? '')
      : Save.getRecord(this.level.id);
    const isBetter = previous === null || result.stats.minutes < previous.minutes;
    if (!isBetter) return;

    const record = {
      minutes: result.stats.minutes,
      score: 0,
      stars: 0,
      at: new Date().toISOString()
    };
    if (this.request.daily) Save.setDailyRecord(this.request.dayKey ?? '', record);
    else {
      Save.setRecord(this.level.id, record);
      Save.setGhost(this.level.id, this.recorder.track);
    }
  }

  /** Impact d'interception : franc, très court, et coupé en mouvement réduit. */
  private punchIntercept() {
    if (SettingsStore.get().reducedMotion) return;
    this.cameras.main.flash(180, 176, 52, 36, false);
    this.cameras.main.shake(220, 0.011);
  }

  private toast(message: string) {
    this.events.emit('toast', message);
  }

  private readKeyboardVector() {
    const left = this.keys.left?.isDown || this.keys.a?.isDown || this.keys.q?.isDown;
    const right = this.keys.right?.isDown || this.keys.d?.isDown;
    const up = this.keys.up?.isDown || this.keys.w?.isDown || this.keys.z?.isDown;
    const down = this.keys.down?.isDown || this.keys.s?.isDown;
    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0)
    };
  }

  /** Données lues par le HUD chaque frame. */
  get hudSnapshot() {
    const alerted = this.npcs.some((npc) => npc.controller.alerted);
    const searching = this.npcs.some((npc) => npc.controller.isSearching);
    const seen = this.npcs.some((npc) => npc.controller.detectionSeconds > 0.05);
    return {
      time: this.clock.format(),
      hidden: this.hiddenIn !== null,
      alerted,
      searching,
      seen,
      coffeeRemaining: Math.max(0, this.coffeeUntil - this.time.now),
      inventory: this.inventory.items,
      interaction: this.interactionLabel,
      levelName: this.level.name
    };
  }
}
