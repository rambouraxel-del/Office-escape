import Phaser from 'phaser';
import {
  CONTROL_MARGIN_X,
  HUD_HEIGHT,
  HUD_Y,
  INVENTORY_SLOTS,
  TOAST_Y,
  POCKET_SLOT_STEP,
  POCKET_SLOT_X,
  POCKET_SLOT_Y,
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
import { PixelClock, makePanel, makePixelButton, makeShade, makeText } from '../ui/theme';
import { enterScene } from '../ui/transition';
import { PALETTE } from '../game/palette';
import { OUTLINE, PLAYER_TEXTURE, STATE_TEXT, TEXT, UI_TEXTURES } from '../game/artTheme';
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

  private clock!: PixelClock;
  private stateText!: Phaser.GameObjects.Text;
  private hiddenText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private boostText!: Phaser.GameObjects.Text;
  private slotIcons: Phaser.GameObjects.Text[] = [];
  private slotFrames: Phaser.GameObjects.NineSlice[] = [];

  private joystickKnob!: Phaser.GameObjects.Image;
  private joystickBase!: Phaser.GameObjects.Image;
  private joystickRing!: Phaser.GameObjects.Image;
  private joystickZone!: Phaser.GameObjects.Zone;
  private joystickOrigin = new Phaser.Math.Vector2();
  private joystickPointer: number | null = null;
  private runButton!: Phaser.GameObjects.Image;
  private runLabel!: Phaser.GameObjects.Text;
  private runPointer: number | null = null;
  private interactionButton!: Phaser.GameObjects.Image;
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
    this.slotFrames = [];
    this.overlay = [];
    this.joystickPointer = null;
    this.runPointer = null;
    this.toastTimer = undefined;

    this.level = this.scene.get('Level') as LevelScene;
    this.inputState = this.registry.get(REGISTRY_KEYS.input) as InputState;

    this.buildHud();
    this.buildControls();
    this.live = true;
    // Le HUD arrive avec le terrain : sans ce fondu, il apparaît net sur un
    // niveau encore noir.
    enterScene(this);

    this.level.events.on('toast', this.showToast, this);
    this.level.events.on('paused', this.showPausePanel, this);
    this.level.events.on('dialogue-open', this.showDialogue, this);
    this.level.events.on('item-collected', this.pulseSlot, this);

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
      this.level.events.off('item-collected', this.pulseSlot, this);
    });
  }

  /**
   * La poche encaisse l'arrivée de l'objet. C'est le bout de la trajectoire
   * commencée dans le monde : sans ce sursaut, l'objet disparaît dans le vide.
   */
  private pulseSlot(slot: number) {
    const frame = this.slotFrames[slot];
    if (!frame || SettingsStore.get().reducedMotion) return;
    this.tweens.add({ targets: frame, scale: 1.22, duration: 110, yoyo: true, ease: 'Quad.Out' });
  }

  /** Affiche (ou masque) un texte HUD avec le panneau qui lui sert de fond. */
  private static setBadgeVisible(text: Phaser.GameObjects.Text, visible: boolean, alpha = 1): void {
    text.setVisible(visible).setAlpha(alpha);
    const panel = text.getData('panel') as Phaser.GameObjects.NineSlice | undefined;
    panel?.setVisible(visible).setAlpha(alpha);
  }

  update() {
    // La scène de jeu peut s'éteindre entre deux frames (fin de partie) :
    // lire son état ensuite provoquerait un accès à des objets détruits.
    if (!this.live || !this.scene.isActive('Level')) return;

    const snapshot = this.level.hudSnapshot;
    this.clock.setText(snapshot.time);

    if (snapshot.hidden) this.stateText.setText(FR.hud.hidden).setColor(STATE_TEXT.hidden);
    else if (this.level.state === 'paused') this.stateText.setText(FR.hud.paused).setColor(STATE_TEXT.idle);
    else if (this.level.state === 'dialogue') this.stateText.setText(FR.hud.dialogue).setColor(STATE_TEXT.seen);
    else if (snapshot.alerted) this.stateText.setText(FR.hud.chase).setColor(STATE_TEXT.chase);
    else if (snapshot.searching) this.stateText.setText(FR.hud.search).setColor(STATE_TEXT.searching);
    else if (snapshot.seen) this.stateText.setText(FR.hud.scanning).setColor(STATE_TEXT.seen);
    else this.stateText.setText(FR.hud.discreet).setColor(STATE_TEXT.calm);

    UiScene.setBadgeVisible(this.hiddenText, snapshot.hidden);
    this.boostText.setText(`☕ ${Math.ceil(snapshot.coffeeRemaining / 1000)} s`);
    UiScene.setBadgeVisible(this.boostText, snapshot.coffeeRemaining > 0);

    snapshot.inventory.forEach((item, index) => {
      const icon = this.slotIcons[index];
      if (!icon) return;
      icon.setText(item ? FR.items[item as ItemId].icon : FR.hud.empty);
      icon.setColor(item ? TEXT.onDark : TEXT.onDarkMuted);
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
    // UN SEUL bandeau. En V0.9.1 il y en avait trois — titre, poches, badges —
    // qui flottaient séparément et mangeaient tout le haut du terrain. Un bloc
    // unique se lit plus vite et rend 40 pixels de jeu.
    makePanel(this, VIEW_WIDTH / 2, HUD_Y, 372, HUD_HEIGHT, 'ui-panel-dark').setDepth(300);

    this.add.image(34, 32, PLAYER_TEXTURE).setScale(0.5).setDepth(302);
    makeText(this, 56, 19, FR.app.title, { size: 13, bold: true, color: TEXT.onDark }).setDepth(301);
    makeText(this, 56, 37, this.level.hudSnapshot.levelName, {
      size: 9,
      bold: true,
      color: TEXT.onDarkMuted,
      letterSpacing: 0.5
    }).setDepth(301);

    // L'heure est l'information la plus regardée du jeu : elle occupe le coin
    // le plus stable de l'écran et rien ne vient jamais s'y superposer.
    this.clock = new PixelClock(this, 370, 16, 301, PALETTE.paper);
    this.stateText = makeText(this, 370, 48, '', { size: 10, bold: true, color: STATE_TEXT.calm })
      .setOrigin(1, 0)
      .setDepth(301);

    const pause = this.add
      .image(250, 34, UI_TEXTURES.pause)
      .setDepth(305)
      .setInteractive({ useHandCursor: true });
    makeText(this, 250, 34, FR.hud.pause, { size: 13, bold: true, color: TEXT.onDark })
      .setOrigin(0.5)
      .setDepth(306);
    pause.on('pointerdown', () => {
      this.inputState.pausePressed = true;
    });

    this.buildPockets();

    // Badges d'état : sous le bandeau, jamais empilés l'un sur l'autre.
    this.hiddenText = makeText(this, VIEW_WIDTH / 2, 128, FR.hud.hidden, {
      size: 13,
      bold: true,
      color: TEXT.onDark
    })
      .setOrigin(0.5)
      .setDepth(311)
      .setVisible(false);
    const hiddenPanel = makePanel(this, VIEW_WIDTH / 2, 128, 210, 32, 'ui-panel-inset').setDepth(310);
    this.hiddenText.setData('panel', hiddenPanel);
    hiddenPanel.setVisible(false);

    this.boostText = makeText(this, 300, 82, '', { size: 11, bold: true, color: TEXT.onLight })
      .setOrigin(0.5)
      .setDepth(311)
      .setVisible(false);
    const boostPanel = makePanel(this, 300, 82, 96, 26, 'ui-button-warm').setDepth(310);
    this.boostText.setData('panel', boostPanel);
    boostPanel.setVisible(false);

    // Message contextuel : bas de l'écran, au-dessus des commandes, jamais au
    // milieu du terrain.
    this.toastText = makeText(this, VIEW_WIDTH / 2, TOAST_Y, '', {
      size: 13,
      bold: true,
      color: TEXT.onDark,
      align: 'center',
      wrap: 290
    })
      .setOrigin(0.5)
      .setDepth(351)
      .setVisible(false);
    const toastPanel = makePanel(this, VIEW_WIDTH / 2, TOAST_Y, 320, 46, 'ui-panel-dark').setDepth(350);
    this.toastText.setData('panel', toastPanel);
    toastPanel.setVisible(false);
  }

  /** Les deux poches, dans le bandeau : une cible tactile, pas un panneau. */
  private buildPockets() {
    for (let index = 0; index < INVENTORY_SLOTS; index += 1) {
      const x = POCKET_SLOT_X + index * POCKET_SLOT_STEP;
      const frame = makePanel(this, x, POCKET_SLOT_Y, 40, 40, 'ui-panel-inset')
        .setDepth(302)
        .setInteractive({ useHandCursor: true });
      // Toucher une poche utilise son objet : le café et le rapport sont actifs.
      frame.on('pointerdown', () => {
        this.inputState.useSlot = index;
      });
      this.slotFrames.push(frame);
      this.slotIcons.push(
        makeText(this, x, POCKET_SLOT_Y, FR.hud.empty, { size: 18, bold: true, color: TEXT.onDarkMuted })
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

    this.joystickBase = this.add.image(joystickX, JOYSTICK_Y, UI_TEXTURES.stickBase).setDepth(320).setAlpha(0.5);
    this.joystickRing = this.add
      .image(joystickX, JOYSTICK_Y, UI_TEXTURES.stickBase)
      .setDepth(321)
      .setScale(0.6)
      .setAlpha(0.42);
    this.joystickKnob = this.add.image(joystickX, JOYSTICK_Y, UI_TEXTURES.stickKnob).setDepth(322).setAlpha(0.9);

    this.joystickZone = this.add.zone(joystickX, JOYSTICK_Y, 175, 175).setDepth(323).setInteractive();
    this.joystickZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer !== null || this.level.state !== 'playing') return;
      this.joystickPointer = pointer.id;
      this.updateJoystick(pointer);
    });

    this.runButton = this.add.image(actionX, RUN_BUTTON_Y, UI_TEXTURES.run).setDepth(320).setInteractive();
    this.runLabel = makeText(this, actionX, RUN_BUTTON_Y, FR.controls.run, {
      size: 11,
      bold: true,
      color: TEXT.onDark,
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
      .image(actionX, RUN_BUTTON_Y - 112, UI_TEXTURES.action)
      .setDepth(330)
      .setInteractive()
      .setVisible(false);
    this.interactionLabel = makeText(this, actionX, RUN_BUTTON_Y - 112, '', {
      size: 12,
      bold: true,
      color: TEXT.onLight,
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
    // Deux sprites distincts plutôt qu'un changement de teinte : l'état
    // « en course » doit se voir au premier coup d'œil, pouce posé dessus.
    this.runButton.setTexture(active ? UI_TEXTURES.runOn : UI_TEXTURES.run);
    this.runLabel.setY(RUN_BUTTON_Y + (active ? OUTLINE : 0));
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
    this.toastText.setText(message);
    UiScene.setBadgeVisible(this.toastText, true);
    const panel = this.toastText.getData('panel') as Phaser.GameObjects.NineSlice;
    this.toastTimer = this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [this.toastText, panel],
        alpha: 0,
        duration: 220,
        onComplete: () => UiScene.setBadgeVisible(this.toastText, false)
      });
    });
  }

  private clearOverlay() {
    this.overlay.forEach((object) => object.destroy());
    this.overlay = [];
  }

  /**
   * Arrivée d'un panneau modal. Un voile qui apparaît d'un coup se lit comme
   * un bug d'affichage ; 160 ms suffisent à dire « on change de contexte ».
   */
  private revealOverlay(depth: number) {
    this.overlay.forEach((object) => (object as Phaser.GameObjects.Image).setDepth?.(depth));
    if (SettingsStore.get().reducedMotion) return;
    const movable = this.overlay.filter(
      (object): object is Phaser.GameObjects.Image => 'setAlpha' in object
    );
    movable.forEach((object) => object.setAlpha(0));
    this.tweens.add({ targets: movable, alpha: 1, duration: 160, ease: 'Quad.Out' });
  }

  private showPausePanel(automatic: boolean) {
    this.clearOverlay();
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT);
    const panel = makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 320, 300);
    const heading = makeText(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 92, FR.pause.title, {
      size: 30,
      bold: true,
      color: TEXT.heading
    }).setOrigin(0.5);
    const body = makeText(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 - 26,
      automatic ? FR.pause.autoBody : FR.pause.body,
      { size: 13, color: TEXT.onLightBody, align: 'center', wrap: 260, lineSpacing: 4 }
    ).setOrigin(0.5);

    const resume = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 55,
      FR.pause.resume,
      { width: 220, height: 54 },
      () => {
        this.clearOverlay();
        this.level.resumeFromPause();
      }
    );
    const quit = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 118,
      FR.pause.quit,
      { width: 220, height: 42, skin: 'ui-button-muted', size: 12 },
      () => {
        this.clearOverlay();
        this.level.abandonRun();
      }
    );

    this.overlay = [shade, panel, heading, body, ...resume.objects, ...quit.objects];
    this.revealOverlay(700);
    if (!automatic) this.showToast(FR.toasts.pausePenalty);
  }

  /**
   * Panneau de dialogue.
   *
   * Trois choix, trois habillages, et sous chacun une PUCE de conséquence :
   * le joueur doit pouvoir arbitrer sans relire la phrase. Le contenu et les
   * probabilités viennent entièrement du niveau — ici, rien que de la mise en
   * page.
   */
  private showDialogue(dialogue: DialogueDef, resolve: ChoiceResolver) {
    this.clearOverlay();
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.86);
    const panel = makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 354, 656);
    // Bandeau de titre : il sépare « qui parle » de « que fais-tu ».
    const band = makePanel(this, VIEW_WIDTH / 2, 148, 322, 108, 'ui-panel-inset');
    const speaker = makeText(this, VIEW_WIDTH / 2, 112, dialogue.speaker, {
      size: 11,
      bold: true,
      color: TEXT.onDarkMuted,
      letterSpacing: 1
    }).setOrigin(0.5);
    const heading = makeText(this, VIEW_WIDTH / 2, 146, dialogue.heading, {
      size: 22,
      bold: true,
      color: TEXT.onDark,
      align: 'center',
      wrap: 292
    }).setOrigin(0.5);
    const body = makeText(this, VIEW_WIDTH / 2, 226, dialogue.body, {
      size: 14,
      color: TEXT.onLightBody,
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);

    this.overlay = [shade, panel, band, speaker, heading, body];

    const snapshot = this.level.hudSnapshot;
    dialogue.choices.forEach((choice, index) => {
      const y = 320 + index * 118;
      const available = !choice.requiresItem || snapshot.inventory.includes(choice.requiresItem);
      const button = makePixelButton(
        this,
        VIEW_WIDTH / 2,
        y,
        choice.title,
        {
          width: 312,
          height: 88,
          skin: index === 0 ? 'ui-button-warm' : index === 1 ? 'ui-button' : 'ui-button-muted',
          enabled: available,
          size: 15
        },
        () => {
          Audio.play('ui');
          const outcome = resolve(choice.id);
          if (outcome) this.showDialogueOutcome(outcome);
        }
      );
      const detail = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 20,
        available ? choice.detail : FR.dialogue.requires(FR.items[choice.requiresItem as ItemId].name),
        { size: 11, color: TEXT.onDark, align: 'center' }
      ).setOrigin(0.5);
      button.label.setY(y - 16);
      this.overlay.push(...button.objects, detail);
    });

    const freeze = makeText(this, VIEW_WIDTH / 2, 664, FR.dialogue.freeze, {
      size: 11,
      bold: true,
      color: TEXT.onLightMuted
    }).setOrigin(0.5);
    this.overlay.push(freeze);
    this.revealOverlay(600);
  }

  private showDialogueOutcome(outcome: DialogueOutcome) {
    this.clearOverlay();
    const shade = makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.86);
    const panel = makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 330, 330);
    const heading = makeText(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 - 95,
      outcome.success ? FR.dialogue.win : FR.dialogue.lose,
      { size: 28, bold: true, color: outcome.success ? TEXT.success : TEXT.heading }
    ).setOrigin(0.5);
    const body = makeText(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 28, outcome.text, {
      size: 15,
      color: TEXT.onLightBody,
      align: 'center',
      wrap: 270,
      lineSpacing: 5
    }).setOrigin(0.5);

    // Le prix payé, en clair : sans ce chiffre, le joueur ne sait pas ce que
    // son pari lui a coûté avant de relire l'horloge.
    const cost = makeText(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 34,
      outcome.minutes === 0
        ? FR.dialogue.neutral
        : outcome.minutes < 0
          ? FR.dialogue.gain(outcome.minutes)
          : FR.dialogue.cost(outcome.minutes),
      { size: 20, bold: true, color: outcome.minutes > 0 ? TEXT.heading : TEXT.success }
    ).setOrigin(0.5);

    const button = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2 + 105,
      FR.dialogue.continue,
      { width: 210, height: 54, skin: outcome.success ? 'ui-button' : 'ui-button-warm' },
      () => {
        this.clearOverlay();
        this.level.events.emit('dialogue-closed');
      }
    );

    this.overlay = [shade, panel, heading, body, cost, ...button.objects];
    this.revealOverlay(600);
  }
}
