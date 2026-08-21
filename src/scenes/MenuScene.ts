import Phaser from 'phaser';
import { COLORS, VIEW_HEIGHT, VIEW_WIDTH } from '../game/constants';
import { Audio } from '../core/audio';
import { dailyKey, dailySeed, randomSeed } from '../core/prng';
import { Save } from '../core/save';
import { SettingsStore, type Settings } from '../core/settings';
import { formatMinutes } from '../core/clock';
import { FR } from '../core/strings';
import { LEVELS, LEVEL_IDS } from '../levels';
import { REGISTRY_KEYS, resetInputState, type InputState, type RunRequest } from '../game/session';
import { makeButton, makeText } from '../ui/theme';

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
    this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 'office-menu-bg').setDisplaySize(VIEW_WIDTH, VIEW_HEIGHT);
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, COLORS.hud, 0.62);
    this.show('home');
  }

  private show(panel: Panel) {
    this.panel = panel;
    this.objects.forEach((object) => object.destroy());
    this.objects = [];

    const shadow = this.add.rectangle(VIEW_WIDTH / 2 + 5, VIEW_HEIGHT / 2 + 8, 350, 694, 0x07101f, 0.36);
    const card = this.add
      .rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 350, 690, 0xfff8e9, 0.96)
      .setStrokeStyle(4, COLORS.player, 1);
    this.objects.push(shadow, card);

    if (panel === 'home') this.buildHome();
    else if (panel === 'levels') this.buildLevels();
    else this.buildSettings();
  }

  private push(...objects: Phaser.GameObjects.GameObject[]) {
    this.objects.push(...objects);
  }

  private buildHome() {
    const badge = this.add
      .circle(VIEW_WIDTH / 2, 104, 28, COLORS.player, 1)
      .setStrokeStyle(4, 0xffffff, 0.72);
    const icon = makeText(this, VIEW_WIDTH / 2, 103, '↑', {
      size: 31,
      bold: true,
      color: '#ffffff'
    }).setOrigin(0.5);
    const title = makeText(this, VIEW_WIDTH / 2, 152, 'OFFICE\nESCAPE', {
      size: 36,
      bold: true,
      color: '#172238',
      align: 'center',
      lineSpacing: -5
    }).setOrigin(0.5, 0);
    const tagline = makeText(this, VIEW_WIDTH / 2, 250, FR.app.tagline, {
      size: 12,
      bold: true,
      color: '#b45743',
      align: 'center',
      wrap: 290
    }).setOrigin(0.5);
    this.push(badge, icon, title, tagline);

    const record = Save.getRecord(LEVELS[0].id);
    const summary = makeText(
      this,
      VIEW_WIDTH / 2,
      308,
      record
        ? `${FR.menu.record} niveau 1 · ${record.minutes} min`
        : 'Trois niveaux. Une seule envie : partir.',
      { size: 13, color: '#5f6d7a', align: 'center', wrap: 290 }
    ).setOrigin(0.5);
    this.push(summary);

    const play = makeButton(
      this,
      VIEW_WIDTH / 2,
      378,
      FR.menu.play,
      { width: 274, height: 62, color: COLORS.player, size: 17 },
      () => this.startRun({ levelId: LEVELS[0].id, seed: randomSeed(), daily: false })
    );
    const levels = makeButton(
      this,
      VIEW_WIDTH / 2,
      452,
      FR.menu.levels,
      { width: 274, height: 50, color: 0x4f7f96, size: 14 },
      () => this.show('levels')
    );
    this.push(...play.objects, ...levels.objects);

    const dayKey = dailyKey();
    const dailyRecord = Save.getDailyRecord(dayKey);
    const daily = makeButton(
      this,
      VIEW_WIDTH / 2,
      518,
      FR.menu.daily,
      { width: 274, height: 50, color: 0x8a6f4f, size: 14 },
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
      552,
      dailyRecord ? `${FR.menu.dailyDone} · ${dailyRecord.minutes} min` : `${FR.menu.dailySeed} ${dayKey}`,
      { size: 10, color: '#7d6a52', align: 'center' }
    ).setOrigin(0.5);
    this.push(...daily.objects, dailyHint);

    const settings = makeButton(
      this,
      VIEW_WIDTH / 2,
      606,
      FR.menu.settings,
      { width: 274, height: 46, color: COLORS.hud, size: 13 },
      () => this.show('settings')
    );
    this.push(...settings.objects);

    const feedback = makeText(this, VIEW_WIDTH / 2, 672, '', {
      size: 11,
      bold: true,
      color: '#4f8b61',
      align: 'center'
    }).setOrigin(0.5);
    const reset = makeButton(
      this,
      VIEW_WIDTH / 2,
      648,
      FR.menu.reset,
      { width: 274, height: 34, color: 0x8a5949, size: 10 },
      () => {
        Save.resetProgress([...LEVEL_IDS]);
        feedback.setText(FR.menu.resetDone);
        Audio.play('ui');
      }
    );
    const version = makeText(this, VIEW_WIDTH / 2, 726, `v${__APP_VERSION__}`, {
      size: 10,
      color: '#7f898f',
      align: 'center'
    }).setOrigin(0.5);
    this.push(...reset.objects, feedback, version);
  }

  private buildLevels() {
    const title = makeText(this, VIEW_WIDTH / 2, 130, FR.menu.levels, {
      size: 24,
      bold: true,
      color: '#172238'
    }).setOrigin(0.5);
    this.push(title);

    LEVELS.forEach((level, index) => {
      const y = 210 + index * 158;
      const unlocked = Save.isLevelUnlocked(index === 0 ? level.id : LEVELS[index - 1].id, index);
      const record = Save.getRecord(level.id);

      const button = makeButton(
        this,
        VIEW_WIDTH / 2,
        y,
        `${index + 1}. ${level.name}`,
        { width: 290, height: 62, color: unlocked ? COLORS.player : 0x8d9199, enabled: unlocked, size: 16 },
        () => this.startRun({ levelId: level.id, seed: randomSeed(), daily: false })
      );
      const subtitle = makeText(this, VIEW_WIDTH / 2, y + 48, level.subtitle, {
        size: 11,
        bold: true,
        color: '#7a6a55',
        align: 'center'
      }).setOrigin(0.5);
      const stars = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 72,
        unlocked
          ? `${FR.menu.starTargets} ★★★ ${formatMinutes(level.clock.startHour * 60 + level.stars[0])} · ★★ ${formatMinutes(level.clock.startHour * 60 + level.stars[1])} · ★ ${formatMinutes(level.clock.startHour * 60 + level.stars[2])}`
          : FR.menu.locked,
        { size: 10, color: '#8b7f6d', align: 'center', wrap: 300 }
      ).setOrigin(0.5);
      const best = makeText(
        this,
        VIEW_WIDTH / 2,
        y + 94,
        record ? `${FR.menu.record} : ${record.minutes} min` : FR.menu.noRecord,
        { size: 10, bold: true, color: record ? '#4f8b61' : '#a09384', align: 'center' }
      ).setOrigin(0.5);

      this.push(...button.objects, subtitle, stars, best);
    });

    this.pushBackButton();
  }

  private buildSettings() {
    const title = makeText(this, VIEW_WIDTH / 2, 130, FR.settings.title, {
      size: 24,
      bold: true,
      color: '#172238'
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
      const y = 200 + index * 78;
      const label = makeText(this, 60, y - 12, row.label, { size: 14, bold: true, color: '#2c3a48' });
      const valueText = makeText(this, 60, y + 10, row.value(SettingsStore.get()), {
        size: 12,
        bold: true,
        color: '#4f7f96'
      });
      const hint = row.hint
        ? makeText(this, 60, y + 30, row.hint, { size: 9, color: '#8b8377', wrap: 200 })
        : null;
      const toggle = makeButton(
        this,
        305,
        y,
        '⇄',
        { width: 54, height: 44, color: COLORS.player, size: 16 },
        () => {
          row.onPress();
          if (this.panel === 'settings') valueText.setText(row.value(SettingsStore.get()));
        }
      );
      this.push(label, valueText, ...toggle.objects);
      if (hint) this.push(hint);
    });

    this.pushBackButton();
  }

  private pushBackButton() {
    const back = makeButton(
      this,
      VIEW_WIDTH / 2,
      700,
      FR.menu.back,
      { width: 200, height: 44, color: COLORS.hud, size: 13 },
      () => this.show('home')
    );
    this.push(...back.objects);
  }

  private startRun(request: RunRequest) {
    Audio.unlock();
    Audio.play('ui');
    this.registry.set(REGISTRY_KEYS.request, request);
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    this.scene.start('Level');
  }
}
