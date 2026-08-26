import Phaser from 'phaser';
import {
  DEPTH,
  MENU_INTRO_FADE_MS,
  MENU_INTRO_HOLD_MS,
  MENU_INTRO_STEP_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH
} from '../game/constants';
import { Audio } from '../core/audio';
import { dailyKey, dailySeed, randomSeed } from '../core/prng';
import { Save } from '../core/save';
import { SettingsStore, type Settings } from '../core/settings';
import { formatMinutes } from '../core/clock';
import { FR } from '../core/strings';
import { LEVELS, LEVEL_IDS } from '../levels';
import { REGISTRY_KEYS, resetInputState, type InputState, type RunRequest } from '../game/session';
import { makePanel, makePixelButton, makeText } from '../ui/theme';
import { enterScene, leaveScene } from '../ui/transition';
import { LEVEL_THUMBS, TEXT } from '../game/artTheme';
import { PALETTE } from '../game/palette';
import { MenuStage } from './MenuStage';

declare const __APP_VERSION__: string;

type Panel = 'home' | 'levels' | 'settings';

/** Carte des écrans secondaires : assez large pour lire, pas pour tout couvrir. */
const CARD = { width: 358, height: 668 };

/** Panneau de l'accueil : il se pose en bas, le décor garde la moitié haute. */
const HOME_PANEL = { top: 500, height: 320 };

/** Plaque du titre, posée sur la baie vitrée. */
const TITLE = { y: 112, width: 302, height: 92 };

export class MenuScene extends Phaser.Scene {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private panel: Panel = 'home';
  private stage!: MenuStage;
  /** Vrai tant que l'accueil n'est pas apparu : on n'accepte pas de clic. */
  private introducing = false;

  constructor() {
    super('Menu');
  }

  create() {
    // Instance de scène réutilisée : on repart d'une liste d'objets vierge, et
    // d'un décor neuf. Les initialiseurs de champs, eux, ne rejouent pas.
    this.objects = [];
    this.introducing = false;
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);

    this.stage = new MenuStage(this);
    this.stage.build();

    this.show('home');
    enterScene(this);
    this.playIntro();
  }

  update(time: number) {
    this.stage.update(time);
  }

  /**
   * Ouverture : le décor d'abord, l'interface ensuite.
   *
   * On laisse la pièce vivre seule le temps de la remarquer, puis le titre et
   * les boutons montent par vagues. En mouvement réduit, tout est là d'emblée
   * — le réglage promet l'absence d'animation, pas une attente plus longue.
   */
  private playIntro(): void {
    if (SettingsStore.get().reducedMotion) return;

    this.introducing = true;
    this.input.enabled = false;
    // On mémorise l'opacité VOULUE avant d'effacer : la plaque du titre est
    // translucide, un bouton verrouillé est à demi éteint. Ramener tout le
    // monde à 1 effacerait ces intentions au premier fondu.
    const waves = this.objects.filter(isFadeable).map((object) => ({ object, alpha: object.alpha }));
    waves.forEach(({ object }) => object.setAlpha(0));

    waves.forEach(({ object, alpha }, index) => {
      this.tweens.add({
        targets: object,
        alpha,
        duration: MENU_INTRO_FADE_MS,
        delay: MENU_INTRO_HOLD_MS + Math.floor(index / 4) * MENU_INTRO_STEP_MS,
        ease: 'Sine.easeOut'
      });
    });

    this.time.delayedCall(MENU_INTRO_HOLD_MS + MENU_INTRO_FADE_MS, () => {
      this.introducing = false;
      this.input.enabled = true;
    });
  }

  private show(panel: Panel) {
    this.panel = panel;
    this.objects.forEach((object) => object.destroy());
    this.objects = [];

    if (panel === 'home') this.buildHome();
    else this.buildCard(panel);
  }

  /** Carte des écrans secondaires, posée sur le décor assombri. */
  private buildCard(panel: Panel) {
    const shade = this.add.rectangle(
      VIEW_WIDTH / 2,
      VIEW_HEIGHT / 2,
      VIEW_WIDTH,
      VIEW_HEIGHT,
      PALETTE.hudInset,
      0.72
    );
    const card = makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, CARD.width, CARD.height);
    this.push(shade, card);
    if (panel === 'levels') this.buildLevels();
    else this.buildSettings();
  }

  /**
   * Enregistre des objets d'interface et les place AU-DESSUS du décor vivant.
   *
   * C'est le seul endroit qui le fait : oublier une profondeur quelque part
   * ferait passer un collègue qui tape à la machine devant les réglages.
   */
  private push(...objects: Phaser.GameObjects.GameObject[]) {
    objects.forEach((object) => {
      if (hasDepth(object)) object.setDepth(DEPTH.menuUi);
    });
    this.objects.push(...objects);
  }

  /** Filet fin : sépare deux blocs sans ajouter une deuxième boîte. */
  private rule(y: number, width: number, color = PALETTE.hudEdge, alpha = 0.5) {
    return this.add.rectangle(VIEW_WIDTH / 2, y, width, 1, color, alpha);
  }

  // ────────────────────────────── accueil ───────────────────────────────

  private buildHome() {
    this.buildTitle();
    this.buildActions();
  }

  /**
   * Le titre se pose SUR le ciel, pas sur le mur.
   *
   * La bande de mur nu est la seule surface calme du décor : c'est justement
   * là que vivent l'horloge, l'affiche et l'écran de la crédence. Un titre
   * posé dessus les écrasait. Sur la baie, une plaque translucide laisse
   * passer la ville et le couchant — et le décor garde tous ses détails.
   */
  private buildTitle() {
    const plate = makePanel(this, VIEW_WIDTH / 2, TITLE.y, TITLE.width, TITLE.height, 'ui-panel-dark');
    plate.setAlpha(0.86);
    const topRule = this.rule(TITLE.y - 34, 214, PALETTE.gold, 0.85);
    const title = makeText(this, VIEW_WIDTH / 2, TITLE.y - 12, FR.app.title, {
      size: 24,
      bold: true,
      color: TEXT.onDark,
      align: 'center',
      wrap: TITLE.width - 30
    }).setOrigin(0.5);
    const tagline = makeText(this, VIEW_WIDTH / 2, TITLE.y + 18, FR.app.tagline, {
      size: 11,
      bold: true,
      color: TEXT.onDarkMuted,
      align: 'center',
      wrap: TITLE.width - 40
    }).setOrigin(0.5);
    const bottomRule = this.rule(TITLE.y + 34, 214, PALETTE.gold, 0.85);
    this.push(plate, topRule, title, tagline, bottomRule);
  }

  /**
   * Les actions, par ordre d'importance : partir, choisir, relever le défi,
   * régler. Une seule cible primaire, deux secondaires de même poids, et le
   * reste en retrait — c'est ce que la V0.10.1 empilait en cinq boutons
   * identiques.
   */
  private buildActions() {
    const panel = makePanel(
      this,
      VIEW_WIDTH / 2,
      HOME_PANEL.top + HOME_PANEL.height / 2,
      CARD.width,
      HOME_PANEL.height,
      'ui-panel-dark'
    );
    this.push(panel);

    const play = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      546,
      FR.menu.play,
      { width: 286, height: 62, size: 17 },
      () => this.startRun({ levelId: LEVELS[0].id, seed: randomSeed(), daily: false })
    );
    this.push(...play.objects);

    const dayKey = dailyKey();
    const levels = makePixelButton(
      this,
      120,
      614,
      FR.menu.levels,
      { width: 138, height: 46, skin: 'ui-button-muted', size: 13 },
      () => this.show('levels')
    );
    const daily = makePixelButton(
      this,
      270,
      614,
      FR.menu.daily,
      { width: 138, height: 46, skin: 'ui-button-warm', size: 13 },
      () =>
        this.startRun({
          levelId: LEVELS[new Date().getDate() % LEVELS.length].id,
          seed: dailySeed(),
          daily: true,
          dayKey
        })
    );
    this.push(...levels.objects, ...daily.objects);

    const dailyRecord = Save.getDailyRecord(dayKey);
    const hint = makeText(
      this,
      VIEW_WIDTH / 2,
      652,
      dailyRecord ? `${FR.menu.dailyDone} · ${dailyRecord.minutes} min` : `${FR.menu.dailySeed} ${dayKey}`,
      { size: 10, color: TEXT.onDarkMuted, align: 'center' }
    ).setOrigin(0.5);
    const status = makeText(this, VIEW_WIDTH / 2, 680, this.progressLine(), {
      size: 11,
      bold: true,
      color: TEXT.onDark,
      align: 'center',
      wrap: 300
    }).setOrigin(0.5);
    this.push(hint, status);

    const settings = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      742,
      FR.menu.settings,
      // 44 pixels de haut au minimum : c'est la taille d'un pouce, et c'est
      // la seule mesure qui compte sur un téléphone tenu en portrait.
      { width: 200, height: 44, skin: 'ui-button-muted', size: 12 },
      () => this.show('settings')
    );
    const version = makeText(this, VIEW_WIDTH / 2, 794, `v${__APP_VERSION__}`, {
      size: 10,
      color: TEXT.onDarkMuted,
      align: 'center'
    }).setOrigin(0.5);
    this.push(this.rule(712, 254), ...settings.objects, version);
  }

  /**
   * Une ligne qui dit où on en est. Elle remplace la phrase d'accroche de la
   * V0.10.1, qui répétait le sous-titre : sur l'accueil d'un jeu déjà lancé,
   * savoir où l'on en est vaut mieux qu'un argument de vente.
   */
  private progressLine(): string {
    const unlocked = LEVELS.filter((level, index) =>
      Save.isLevelUnlocked(index === 0 ? level.id : LEVELS[index - 1].id, index)
    ).length;
    const record = Save.getRecord(LEVELS[0].id);
    const progress = `${unlocked}/${LEVELS.length} ${FR.menu.unlocked}`;
    return record ? `${progress} · ${FR.menu.record} ${record.minutes} min` : progress;
  }

  // ──────────────────────────── les niveaux ─────────────────────────────

  private buildLevels() {
    const title = makeText(this, VIEW_WIDTH / 2, 116, FR.menu.levels, {
      size: 24,
      bold: true,
      color: TEXT.onLight
    }).setOrigin(0.5);
    this.push(title);

    LEVELS.forEach((level, index) => {
      const y = 222 + index * 182;
      const unlocked = Save.isLevelUnlocked(index === 0 ? level.id : LEVELS[index - 1].id, index);
      const record = Save.getRecord(level.id);

      // Vignette : bureaux, direction ou parking se reconnaissent avant même
      // qu'on ait lu le titre. Elle est composée des mêmes motifs que le jeu.
      const thumb = this.add
        .image(VIEW_WIDTH / 2, y - 48, LEVEL_THUMBS[level.theme ?? 'office'])
        .setScale(0.82)
        .setAlpha(unlocked ? 1 : 0.35);

      const button = makePixelButton(
        this,
        VIEW_WIDTH / 2,
        y + 24,
        `${index + 1}. ${level.name}`,
        {
          width: 290,
          height: 56,
          skin: unlocked ? 'ui-button' : 'ui-button-muted',
          enabled: unlocked,
          size: 16
        },
        () => this.startRun({ levelId: level.id, seed: randomSeed(), daily: false })
      );
      const subtitle = makeText(this, VIEW_WIDTH / 2, y + 62, level.subtitle, {
        size: 11,
        bold: true,
        color: TEXT.onLightMuted,
        align: 'center'
      }).setOrigin(0.5);
      const stars = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 82,
        unlocked
          ? `${FR.menu.starTargets} ★★★ ${formatMinutes(level.clock.startHour * 60 + level.stars[0])} · ★★ ${formatMinutes(level.clock.startHour * 60 + level.stars[1])} · ★ ${formatMinutes(level.clock.startHour * 60 + level.stars[2])}`
          : FR.menu.locked,
        { size: 10, color: TEXT.onLightMuted, align: 'center', wrap: 300 }
      ).setOrigin(0.5);
      const best = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 100,
        record ? `${FR.menu.record} : ${record.minutes} min` : FR.menu.noRecord,
        { size: 10, bold: true, color: record ? TEXT.success : TEXT.onLightMuted, align: 'center' }
      ).setOrigin(0.5);

      this.push(thumb, ...button.objects, subtitle, stars, best);
    });

    this.pushBackButton();
  }

  // ──────────────────────────── les réglages ────────────────────────────

  private buildSettings() {
    const title = makeText(this, VIEW_WIDTH / 2, 116, FR.settings.title, {
      size: 24,
      bold: true,
      color: TEXT.onLight
    }).setOrigin(0.5);
    this.push(title);

    const rows: {
      label: string;
      value: (settings: Settings) => string;
      hint?: string;
      onPress: () => void;
    }[] = [
      {
        label: FR.settings.sound,
        value: (settings) => (settings.muted ? FR.settings.off : FR.settings.on),
        onPress: () => {
          const next = SettingsStore.toggle('muted');
          Audio.setMuted(next.muted);
          if (!next.muted) Audio.play('ui');
        }
      },
      {
        label: FR.settings.vibrations,
        value: (settings) => (settings.vibrations ? FR.settings.on : FR.settings.off),
        onPress: () => SettingsStore.toggle('vibrations')
      },
      {
        label: FR.settings.tutorials,
        value: (settings) => (settings.tutorials ? FR.settings.on : FR.settings.off),
        hint: FR.settings.hintTutorials,
        onPress: () => SettingsStore.toggle('tutorials')
      },
      {
        label: FR.settings.ghost,
        value: (settings) => (settings.ghost ? FR.settings.on : FR.settings.off),
        hint: FR.settings.hintGhost,
        onPress: () => SettingsStore.toggle('ghost')
      },
      {
        label: FR.settings.motion,
        value: (settings) => (settings.reducedMotion ? FR.settings.on : FR.settings.off),
        hint: FR.settings.hintMotion,
        onPress: () => SettingsStore.toggle('reducedMotion')
      },
      {
        label: FR.settings.colorBlind,
        value: (settings) => (settings.colorBlindMode ? FR.settings.on : FR.settings.off),
        hint: FR.settings.hintColorBlind,
        onPress: () => SettingsStore.toggle('colorBlindMode')
      },
      {
        label: FR.settings.textScale,
        value: (settings) => `${Math.round(settings.textScale * 100)} %`,
        onPress: () => {
          const current = SettingsStore.get().textScale;
          const next = current >= 1.35 ? 0.9 : Math.round((current + 0.15) * 100) / 100;
          SettingsStore.set('textScale', next);
          // La taille du texte se voit partout : on reconstruit la scène.
          this.scene.restart();
        }
      },
      {
        label: FR.settings.joystick,
        value: (settings) => (settings.joystickSide === 'left' ? FR.settings.left : FR.settings.right),
        onPress: () => {
          const side = SettingsStore.get().joystickSide === 'left' ? 'right' : 'left';
          SettingsStore.set('joystickSide', side);
        }
      }
    ];

    rows.forEach((row, index) => {
      const y = 166 + index * 62;
      const label = makeText(this, 58, y - 14, row.label, { size: 13, bold: true, color: TEXT.onLight });
      const valueText = makeText(this, 58, y + 6, row.value(SettingsStore.get()), {
        size: 12,
        bold: true,
        color: TEXT.info
      });
      const hint = row.hint
        ? makeText(this, 58, y + 26, row.hint, { size: 9, color: TEXT.onLightMuted, wrap: 210 })
        : null;
      const toggle = makePixelButton(this, 305, y + 4, FR.settings.toggle, { width: 52, height: 44, size: 16 }, () => {
        row.onPress();
        if (this.panel === 'settings') valueText.setText(row.value(SettingsStore.get()));
      });
      // Filet de séparation : sans lui, huit lignes de réglages font un bloc.
      const rule = this.add.rectangle(VIEW_WIDTH / 2, y + 40, 254, 1, PALETTE.floorSeam, 0.5);
      this.push(label, valueText, rule, ...toggle.objects);
      if (hint) this.push(hint);
    });

    // La remise à zéro vit ici, pas sur l'accueil : c'est un réglage, et le
    // premier écran du jeu n'a pas à proposer d'effacer sa progression.
    const feedback = makeText(this, VIEW_WIDTH / 2, 700, '', {
      size: 11,
      bold: true,
      color: TEXT.success,
      align: 'center'
    }).setOrigin(0.5);
    const reset = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      672,
      FR.menu.reset,
      { width: 274, height: 38, skin: 'ui-button-warm', size: 11 },
      () => {
        Save.resetProgress([...LEVEL_IDS]);
        feedback.setText(FR.menu.resetDone);
        Audio.play('ui');
      }
    );
    this.push(...reset.objects, feedback);

    this.pushBackButton();
  }

  private pushBackButton() {
    const back = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      784,
      FR.menu.back,
      { width: 200, height: 44, skin: 'ui-button-muted', size: 13 },
      () => this.show('home')
    );
    this.push(...back.objects);
  }

  private startRun(request: RunRequest) {
    if (this.introducing) return;
    Audio.unlock();
    Audio.play('ui');
    this.registry.set(REGISTRY_KEYS.request, request);
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    leaveScene(this, () => this.scene.start('Level'));
  }
}

/** Tout ce qui sait s'effacer : c'est ce qui peut entrer en fondu. */
type Fadeable = Phaser.GameObjects.GameObject & { alpha: number; setAlpha(value: number): unknown };

function isFadeable(object: Phaser.GameObjects.GameObject): object is Fadeable {
  return typeof (object as Fadeable).setAlpha === 'function';
}

type Depthful = Phaser.GameObjects.GameObject & { setDepth(value: number): unknown };

function hasDepth(object: Phaser.GameObjects.GameObject): object is Depthful {
  return typeof (object as Depthful).setDepth === 'function';
}
