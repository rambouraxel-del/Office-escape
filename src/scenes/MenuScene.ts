import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../game/constants';
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
import { LEVEL_THUMBS, MENU_BACKGROUND, PLAYER_TEXTURE, TEXT } from '../game/artTheme';
import { PALETTE } from '../game/palette';

declare const __APP_VERSION__: string;

type Panel = 'home' | 'levels' | 'settings';

export class MenuScene extends Phaser.Scene {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private panel: Panel = 'home';

  constructor() {
    super('Menu');
  }

  create() {
    // Instance de scène réutilisée : on repart d'une liste d'objets vierge.
    this.objects = [];
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, MENU_BACKGROUND);
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, PALETTE.hudPanel, 0.55);
    this.show('home');
    enterScene(this);
  }

  private show(panel: Panel) {
    this.panel = panel;
    this.objects.forEach((object) => object.destroy());
    this.objects = [];

    const shadow = this.add.rectangle(VIEW_WIDTH / 2 + 4, VIEW_HEIGHT / 2 + 6, 350, 690, PALETTE.hudInset, 0.45);
    const card = makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 350, 690);
    this.objects.push(shadow, card);

    if (panel === 'home') this.buildHome();
    else if (panel === 'levels') this.buildLevels();
    else this.buildSettings();
  }

  private push(...objects: Phaser.GameObjects.GameObject[]) {
    this.objects.push(...objects);
  }

  private buildHome() {
    // Le joueur EST le logo. Un disque avec une flèche disait « bouton » ;
    // le personnage dit « c'est toi qu'on essaie de faire sortir ».
    const mark = this.add.image(VIEW_WIDTH / 2, 112, PLAYER_TEXTURE).setScale(1.5);
    const title = makeText(this, VIEW_WIDTH / 2, 158, 'OFFICE\nESCAPE', {
      size: 36,
      bold: true,
      color: TEXT.onLight,
      align: 'center',
      lineSpacing: -5
    }).setOrigin(0.5, 0);
    const tagline = makeText(this, VIEW_WIDTH / 2, 256, FR.app.tagline, {
      size: 12,
      bold: true,
      color: TEXT.heading,
      align: 'center',
      wrap: 290
    }).setOrigin(0.5);
    this.push(mark, title, tagline);

    const record = Save.getRecord(LEVELS[0].id);
    const summary = makeText(
      this,
      VIEW_WIDTH / 2,
      308,
      record ? `${FR.menu.record} niveau 1 · ${record.minutes} min` : FR.menu.pitch,
      { size: 13, color: TEXT.onLightMuted, align: 'center', wrap: 290 }
    ).setOrigin(0.5);
    this.push(summary);

    const play = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      386,
      FR.menu.play,
      { width: 274, height: 64, size: 17 },
      () => this.startRun({ levelId: LEVELS[0].id, seed: randomSeed(), daily: false })
    );
    const levels = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      464,
      FR.menu.levels,
      { width: 274, height: 52, skin: 'ui-button-muted', size: 14 },
      () => this.show('levels')
    );
    this.push(...play.objects, ...levels.objects);

    const dayKey = dailyKey();
    const dailyRecord = Save.getDailyRecord(dayKey);
    const daily = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      534,
      FR.menu.daily,
      { width: 274, height: 52, skin: 'ui-button-warm', size: 14 },
      () =>
        this.startRun({
          levelId: LEVELS[new Date().getDate() % LEVELS.length].id,
          seed: dailySeed(),
          daily: true,
          dayKey
        })
    );
    const dailyHint = makeText(
      this,
      VIEW_WIDTH / 2,
      570,
      dailyRecord ? `${FR.menu.dailyDone} · ${dailyRecord.minutes} min` : `${FR.menu.dailySeed} ${dayKey}`,
      { size: 10, color: TEXT.onLightMuted, align: 'center' }
    ).setOrigin(0.5);
    this.push(...daily.objects, dailyHint);

    const settings = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      626,
      FR.menu.settings,
      { width: 274, height: 48, skin: 'ui-button-muted', size: 13 },
      () => this.show('settings')
    );
    const version = makeText(this, VIEW_WIDTH / 2, 690, `v${__APP_VERSION__}`, {
      size: 10,
      color: TEXT.onLightMuted,
      align: 'center'
    }).setOrigin(0.5);
    this.push(...settings.objects, version);
  }

  private buildLevels() {
    const title = makeText(this, VIEW_WIDTH / 2, 104, FR.menu.levels, {
      size: 24,
      bold: true,
      color: TEXT.onLight
    }).setOrigin(0.5);
    this.push(title);

    LEVELS.forEach((level, index) => {
      const y = 216 + index * 186;
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
      const y = 178 + index * 74;
      const label = makeText(this, 58, y - 12, row.label, { size: 14, bold: true, color: TEXT.onLight });
      const valueText = makeText(this, 58, y + 10, row.value(SettingsStore.get()), {
        size: 12,
        bold: true,
        color: TEXT.info
      });
      const hint = row.hint
        ? makeText(this, 58, y + 30, row.hint, { size: 9, color: TEXT.onLightMuted, wrap: 200 })
        : null;
      const toggle = makePixelButton(this, 305, y, '⇄', { width: 54, height: 44, size: 16 }, () => {
        row.onPress();
        if (this.panel === 'settings') valueText.setText(row.value(SettingsStore.get()));
      });
      // Filet de séparation : sans lui, six lignes de réglages font un bloc.
      const rule = this.add.rectangle(VIEW_WIDTH / 2, y + 44, 254, 1, PALETTE.floorSeam, 0.5);
      this.push(label, valueText, rule, ...toggle.objects);
      if (hint) this.push(hint);
    });

    // La remise à zéro vit ici, pas sur l'accueil : c'est un réglage, et le
    // premier écran du jeu n'a pas à proposer d'effacer sa progression.
    const feedback = makeText(this, VIEW_WIDTH / 2, 666, '', {
      size: 11,
      bold: true,
      color: TEXT.success,
      align: 'center'
    }).setOrigin(0.5);
    const reset = makePixelButton(
      this,
      VIEW_WIDTH / 2,
      636,
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
      730,
      FR.menu.back,
      { width: 200, height: 44, skin: 'ui-button-muted', size: 13 },
      () => this.show('home')
    );
    this.push(...back.objects);
  }

  private startRun(request: RunRequest) {
    Audio.unlock();
    Audio.play('ui');
    this.registry.set(REGISTRY_KEYS.request, request);
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    leaveScene(this, () => this.scene.start('Level'));
  }
}
