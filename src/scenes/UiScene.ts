import Phaser from 'phaser';
import {
  COLORS,
  CONTROL_MARGIN_X,
  INVENTORY_SLOTS,
  JOYSTICK_MARGIN_X,
  JOYSTICK_RADIUS,
  JOYSTICK_Y,
  RUN_BUTTON_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH
} from '../game/constants';
import { Audio } from '../core/audio';
import { SettingsStore } from '../core/settings';
import { FR } from '../core/strings';
import { REGISTRY_KEYS, type InputState } from '../game/session';
import type { DialogueDef, ItemId } from '../game/types';
import { makeButton, makeShade, makeText } from '../ui/theme';
import type { LevelScene } from './LevelScene';

interface DialogueOutcome {
  success: boolean;
  minutes: number;
  text: string;
}

type ChoiceResolver = (choiceId: string) => DialogueOutcome | null;

/**
 * Scène d'interface, superposée à la scène de jeu.
 *
 * Sortir le HUD de la scène de jeu supprime la centaine de `setScrollFactor(0)`
 * de la V0.7 et rend les deux couches indépendantes.
 */
export class UiScene extends Phaser.Scene {
  private level!: LevelScene;
  private inputState!: InputState;

  private clockText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private hiddenText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private boostText!: Phaser.GameObjects.Text;
  private slotIcons: Phaser.GameObjects.Text[] = [];

  private joystickKnob!: Phaser.GameObjects.Arc;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickRing!: Phaser.GameObjects.Arc;
  private joystickZone!: Phaser.GameObjects.Zone;
  private joystickOrigin = new Phaser.Math.Vector2();
  private joystickPointer: number | null = null;
  private runButton!: Phaser.GameObjects.Arc;
  private runLabel!: Phaser.GameObjects.Text;
  private runPointer: number | null = null;
  private interactionButton!: Phaser.GameObjects.Arc;
  private interactionLabel!: Phaser.GameObjects.Text;

  private overlay: Phaser.GameObjects.GameObject[] = [];
  /** Passe à faux dès le SHUTDOWN : plus aucun accès aux objets d'affichage. */
  private live = false;

  constructor() {
    super('Ui');
  }

  create() {
    // Phaser réutilise l'INSTANCE de scène d'une partie à l'autre : les
    // initialiseurs de champs ne rejouent pas. Tout état par partie doit être
    // remis à zéro ici, sinon on garde des références vers des objets détruits.
    this.slotIcons = [];
    this.overlay = [];
    this.joystickPointer = null;
    this.runPointer = null;
    this.toastTimer = undefined;

    this.level = this.scene.get('Level') as LevelScene;
    this.inputState = this.registry.get(REGISTRY_KEYS.input) as InputState;

    this.buildHud();
    this.buildControls();
    this.live = true;

    this.level.events.on('toast', this.showToast, this);
    this.level.events.on('paused', this.showPausePanel, this);
    this.level.events.on('dialogue-open', this.showDialogue, this);

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.live = false;
      this.toastTimer?.remove(false);
      this.toastTimer = undefined;
      this.tweens.killAll();
      this.clearOverlay();
      this.level.events.off('toast', this.showToast, this);
      this.level.events.off('paused', this.showPausePanel, this);
      this.level.events.off('dialogue-open', this.showDialogue, this);
    });
  }

  update() {
    // La scène de jeu peut s'éteindre entre deux frames (fin de partie) :
    // lire son état ensuite provoquerait un accès à des objets détruits.
    if (!this.live || !this.scene.isActive('Level')) return;

    const snapshot = this.level.hudSnapshot;
    this.clockText.setText(snapshot.time);

    if (snapshot.hidden) this.stateText.setText(FR.hud.hidden).setColor('#9dd6ef');
    else if (this.level.state === 'paused') this.stateText.setText(FR.hud.paused).setColor('#cbd5db');
    else if (this.level.state === 'dialogue') this.stateText.setText(FR.hud.dialogue).setColor('#ffd270');
    else if (snapshot.alerted) this.stateText.setText(FR.hud.chase).setColor('#ff8a78');
    else if (snapshot.searching) this.stateText.setText(FR.hud.search).setColor('#ffbe70');
    else if (snapshot.seen) this.stateText.setText(FR.hud.scanning).setColor('#ffd270');
    else this.stateText.setText(FR.hud.discreet).setColor('#9fd4ad');

    this.hiddenText.setVisible(snapshot.hidden);
    this.boostText
      .setVisible(snapshot.coffeeRemaining > 0)
      .setText(`☕ ${Math.ceil(snapshot.coffeeRemaining / 1000)} s`);

    snapshot.inventory.forEach((item, index) => {
      const icon = this.slotIcons[index];
      if (!icon) return;
      icon.setText(item ? FR.items[item as ItemId].icon : FR.hud.empty);
      icon.setColor(item ? '#ffffff' : '#91a0aa');
    });

    const label = snapshot.interaction;
    const showInteraction = label !== null && this.overlay.length === 0;
    this.interactionButton.setVisible(showInteraction);
    this.interactionLabel.setVisible(showInteraction).setText(label ?? '');

    const controlsVisible = this.level.state === 'playing' && this.overlay.length === 0;
    [this.joystickBase, this.joystickRing, this.joystickKnob, this.runButton, this.runLabel].forEach(
      (object) => object.setVisible(controlsVisible)
    );
  }

  // ───────────────────────────────── HUD ──────────────────────────────────

  private buildHud() {
    this.add.graphics().fillStyle(0x07101f, 0.3).fillRoundedRect(11, 13, 368, 82, 22).setDepth(299);
    const panel = this.add.graphics().setDepth(300);
    panel.fillStyle(COLORS.hud, 0.97).fillRoundedRect(10, 9, 370, 80, 22);
    panel.lineStyle(2, 0xffffff, 0.12).strokeRoundedRect(10, 9, 370, 80, 22);

    this.add.circle(33, 36, 14, COLORS.player, 1).setStrokeStyle(2, 0xffffff, 0.28).setDepth(301);
    makeText(this, 33, 36, '↑', { size: 17, bold: true, color: '#ffffff' }).setOrigin(0.5).setDepth(302);
    makeText(this, 55, 24, FR.app.title, { size: 14, bold: true, color: '#ffffff' }).setDepth(301);
    makeText(this, 55, 47, this.level.hudSnapshot.levelName, {
      size: 9,
      bold: true,
      color: '#9fb1c5',
      letterSpacing: 0.5
    }).setDepth(301);

    this.clockText = makeText(this, 350, 20, '', { size: 23, bold: true, color: '#fff3d6' })
      .setOrigin(1, 0)
      .setDepth(301);
    this.stateText = makeText(this, 350, 54, '', { size: 10, bold: true, color: '#9fd4ad' })
      .setOrigin(1, 0)
      .setDepth(301);

    // « II » en ASCII : les chiffres romains Unicode manquent à beaucoup de
    // polices système et s'affichent en carré vide.
    const pause = makeButton(
      this,
      276,
      46,
      'II',
      { width: 32, height: 32, color: 0x2c3c58, size: 15 },
      () => {
        this.inputState.pausePressed = true;
      }
    );
    pause.background.setDepth(305);
    pause.label.setDepth(306);

    this.hiddenText = makeText(this, VIEW_WIDTH / 2, 105, FR.hud.hidden, {
      size: 13,
      bold: true,
      color: '#ffffff',
      backgroundColor: '#365b6d',
      padding: { x: 12, y: 7 }
    })
      .setOrigin(0.5)
      .setDepth(310)
      .setVisible(false);

    this.boostText = makeText(this, VIEW_WIDTH / 2, 140, '', {
      size: 12,
      bold: true,
      color: '#3b2a1c',
      backgroundColor: '#e8c48a',
      padding: { x: 10, y: 5 }
    })
      .setOrigin(0.5)
      .setDepth(310)
      .setVisible(false);

    this.toastText = makeText(this, VIEW_WIDTH / 2, 605, '', {
      size: 13,
      bold: true,
      color: '#ffffff',
      backgroundColor: '#18232de6',
      align: 'center',
      padding: { x: 13, y: 8 }
    })
      .setOrigin(0.5)
      .setDepth(350)
      .setVisible(false);

    makeText(this, 21, 97, FR.hud.pockets, {
      size: 9,
      bold: true,
      color: '#596777',
      letterSpacing: 1
    }).setDepth(301);

    for (let index = 0; index < INVENTORY_SLOTS; index += 1) {
      const x = 38 + index * 47;
      const slot = this.add
        .rectangle(x, 126, 40, 40, COLORS.hud, 0.94)
        .setStrokeStyle(2, 0xffffff, 0.28)
        .setDepth(302)
        .setInteractive({ useHandCursor: true });
      // Toucher une poche utilise son objet : le café et le rapport sont actifs.
      slot.on('pointerdown', () => {
        this.inputState.useSlot = index;
      });
      this.slotIcons.push(
        makeText(this, x, 126, FR.hud.empty, { size: 18, bold: true, color: '#91a0aa' })
          .setOrigin(0.5)
          .setDepth(303)
      );
    }
  }

  // ─────────────────────────────── contrôles ──────────────────────────────

  private buildControls() {
    const onLeft = SettingsStore.get().joystickSide === 'left';
    const joystickX = onLeft ? JOYSTICK_MARGIN_X : VIEW_WIDTH - JOYSTICK_MARGIN_X;
    const actionX = onLeft ? VIEW_WIDTH - CONTROL_MARGIN_X : CONTROL_MARGIN_X;
    this.joystickOrigin.set(joystickX, JOYSTICK_Y);

    this.joystickBase = this.add
      .circle(joystickX, JOYSTICK_Y + 4, JOYSTICK_RADIUS + 13, COLORS.hud, 0.38)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setDepth(320);
    this.joystickRing = this.add
      .circle(joystickX, JOYSTICK_Y, JOYSTICK_RADIUS, 0xffffff, 0.16)
      .setStrokeStyle(2, 0xffffff, 0.28)
      .setDepth(321);
    this.joystickKnob = this.add
      .circle(joystickX, JOYSTICK_Y, 25, COLORS.hud, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.65)
      .setDepth(322);

    this.joystickZone = this.add.zone(joystickX, JOYSTICK_Y, 175, 175).setDepth(323).setInteractive();
    this.joystickZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer !== null || this.level.state !== 'playing') return;
      this.joystickPointer = pointer.id;
      this.updateJoystick(pointer);
    });

    this.runButton = this.add
      .circle(actionX, RUN_BUTTON_Y, 43, COLORS.player, 0.94)
      .setStrokeStyle(3, 0xffffff, 0.48)
      .setDepth(320)
      .setInteractive();
    this.runLabel = makeText(this, actionX, RUN_BUTTON_Y, FR.controls.run, {
      size: 11,
      bold: true,
      color: '#ffffff',
      align: 'center',
      lineSpacing: -3
    })
      .setOrigin(0.5)
      .setDepth(321);
    this.runButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.level.state !== 'playing') return;
      this.runPointer = pointer.id;
      this.setRunHeld(true);
    });

    this.interactionButton = this.add
      .circle(actionX, RUN_BUTTON_Y - 112, 47, COLORS.door, 0.92)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setDepth(330)
      .setInteractive()
      .setVisible(false);
    this.interactionLabel = makeText(this, actionX, RUN_BUTTON_Y - 112, '', {
      size: 12,
      bold: true,
      color: '#ffffff',
      align: 'center'
    })
      .setOrigin(0.5)
      .setDepth(331)
      .setVisible(false);
    this.interactionButton.on('pointerdown', () => {
      this.inputState.interactPressed = true;
    });
  }

  private setRunHeld(active: boolean) {
    this.inputState.runHeld = active;
    this.runButton.setFillStyle(active ? 0x19b7ae : COLORS.player, active ? 1 : 0.94);
    this.runButton.setScale(active ? 1.06 : 1);
    this.runLabel.setScale(active ? 1.06 : 1);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointer) this.updateJoystick(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id === this.joystickPointer) {
      this.joystickPointer = null;
      this.resetJoystick();
    }
    if (pointer.id === this.runPointer) {
      this.runPointer = null;
      this.setRunHeld(false);
    }
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    const dx = pointer.x - this.joystickOrigin.x;
    const dy = pointer.y - this.joystickOrigin.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const capped = Math.min(distance, JOYSTICK_RADIUS);

    this.joystickKnob.setPosition(
      this.joystickOrigin.x + Math.cos(angle) * capped,
      this.joystickOrigin.y + Math.sin(angle) * capped
    );

    if (distance < 7) {
      this.inputState.moveX = 0;
      this.inputState.moveY = 0;
      return;
    }
    const strength = Math.min(distance / JOYSTICK_RADIUS, 1);
    this.inputState.moveX = Math.cos(angle) * strength;
    this.inputState.moveY = Math.sin(angle) * strength;
  }

  private resetJoystick() {
    this.inputState.moveX = 0;
    this.inputState.moveY = 0;
    this.joystickKnob.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
  }

  // ──────────────────────────────── panneaux ──────────────────────────────

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

  private clearOverlay() {
    this.overlay.forEach((object) => object.destroy());
    this.overlay = [];
  }

  private showPausePanel(automatic: boolean) {
    this.clearOverlay();
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT);
    const panel = this.add
      .rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 320, 300, 0xf8f4ea, 1)
      .setStrokeStyle(5, 0x4f7f96, 1);
    const heading = makeText(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 92, FR.pause.title, {
      size: 30,
      bold: true,
      color: '#35596b'
    }).setOrigin(0.5);
    const body = makeText(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 - 26,
      automatic ? FR.pause.autoBody : FR.pause.body,
      { size: 13, color: '#46545d', align: 'center', wrap: 260, lineSpacing: 4 }
    ).setOrigin(0.5);

    const resume = makeButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 55,
      FR.pause.resume,
      { width: 220, height: 54, color: 0x4f7f96 },
      () => {
        this.clearOverlay();
        this.level.resumeFromPause();
      }
    );
    const quit = makeButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 118,
      FR.pause.quit,
      { width: 220, height: 42, color: 0x8a5949, size: 12 },
      () => {
        this.clearOverlay();
        this.level.abandonRun();
      }
    );

    this.overlay = [shade, panel, heading, body, ...resume.objects, ...quit.objects];
    this.overlay.forEach((object) => (object as Phaser.GameObjects.Image).setDepth?.(700));
    if (!automatic) this.showToast(FR.toasts.pausePenalty);
  }

  private showDialogue(dialogue: DialogueDef, resolve: ChoiceResolver) {
    this.clearOverlay();
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.84);
    const panel = this.add
      .rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 354, 650, 0xf8f4ea, 1)
      .setStrokeStyle(5, COLORS.colleague, 1);
    const heading = makeText(this, VIEW_WIDTH / 2, 130, dialogue.heading, {
      size: 24,
      bold: true,
      color: '#783f33',
      align: 'center',
      wrap: 300
    }).setOrigin(0.5);
    const body = makeText(this, VIEW_WIDTH / 2, 182, dialogue.body, {
      size: 14,
      color: '#33414b',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);

    this.overlay = [shade, panel, heading, body];

    const snapshot = this.level.hudSnapshot;
    dialogue.choices.forEach((choice, index) => {
      const y = 290 + index * 122;
      const available = !choice.requiresItem || snapshot.inventory.includes(choice.requiresItem);
      const button = makeButton(
        this,
        VIEW_WIDTH / 2,
        y,
        choice.title,
        { width: 312, height: 92, color: choice.color, enabled: available, size: 15 },
        () => {
          Audio.play('ui');
          const outcome = resolve(choice.id);
          if (outcome) this.showDialogueOutcome(outcome);
        }
      );
      const detail = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 22,
        available ? choice.detail : `${FR.items[choice.requiresItem as ItemId].name} requis`,
        { size: 11, color: '#edf5f8', align: 'center' }
      ).setOrigin(0.5);
      button.label.setY(y - 14);
      this.overlay.push(...button.objects, detail);
    });

    const freeze = makeText(this, VIEW_WIDTH / 2, 620, 'Le temps est arrêté pendant le dialogue.', {
      size: 11,
      bold: true,
      color: '#6a747a'
    }).setOrigin(0.5);
    this.overlay.push(freeze);
    this.overlay.forEach((object) => (object as Phaser.GameObjects.Image).setDepth?.(600));
  }

  private showDialogueOutcome(outcome: DialogueOutcome) {
    this.clearOverlay();
    const color = outcome.success ? 0x4f8b61 : 0xb8493f;
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.84);
    const panel = this.add
      .rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 330, 310, 0xf8f4ea, 1)
      .setStrokeStyle(5, color, 1);
    const heading = makeText(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 - 85,
      outcome.success ? 'ÇA PASSE !' : 'AÏE…',
      { size: 28, bold: true, color: outcome.success ? '#3f7550' : '#a03d34' }
    ).setOrigin(0.5);
    const body = makeText(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 15, outcome.text, {
      size: 15,
      color: '#33414b',
      align: 'center',
      wrap: 270,
      lineSpacing: 5
    }).setOrigin(0.5);

    const button = makeButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 92,
      'CONTINUER',
      { width: 210, height: 54, color },
      () => {
        this.clearOverlay();
        this.level.events.emit('dialogue-closed');
      }
    );

    this.overlay = [shade, panel, heading, body, ...button.objects];
    this.overlay.forEach((object) => (object as Phaser.GameObjects.Image).setDepth?.(600));
  }
}
