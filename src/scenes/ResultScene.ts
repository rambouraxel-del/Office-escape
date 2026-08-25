import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../game/constants';
import { PALETTE } from '../game/palette';
import { TEXT } from '../game/artTheme';
import { Audio } from '../core/audio';
import { randomSeed } from '../core/prng';
import { Save } from '../core/save';
import { SettingsStore } from '../core/settings';
import { scoreRun } from '../core/scoring';
import { FR } from '../core/strings';
import { getLevel, nextLevelId } from '../levels';
import { REGISTRY_KEYS, resetInputState, type InputState, type RunResult } from '../game/session';
import { PixelClock, makePanel, makePixelButton, makeShade, makeText } from '../ui/theme';
import { enterScene, leaveScene } from '../ui/transition';

/**
 * Écran de fin.
 *
 * Tout le concept d'Office Escape tient dans une donnée : **l'heure à laquelle
 * on est parti**. Elle est donc traitée comme le héros de la page — chiffres
 * dessinés, trois fois la taille du reste — et le détail du score vient
 * après, pour donner une raison de rejouer autrement que « plus vite ».
 */
export class ResultScene extends Phaser.Scene {
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super('Result');
  }

  create() {
    // Phaser réutilise l'instance de scène : les minuteries de la partie
    // précédente pointeraient sinon vers des objets détruits.
    this.timers.forEach((timer) => timer.remove(false));
    this.timers = [];

    const result = this.registry.get(REGISTRY_KEYS.result) as RunResult;
    const level = getLevel(result.request.levelId);
    const escaped = result.outcome === 'escaped';
    const breakdown = scoreRun(result.stats, level);

    makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.9);
    makePanel(this, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 344, escaped ? 604 : 330);

    const top = VIEW_HEIGHT / 2 - (escaped ? 265 : 135);
    if (escaped) this.buildEscape(result, breakdown, top);
    else this.buildFailure(result, top);

    this.buildActions(result, escaped);
    // Respecte le réglage : ne jamais réactiver le son de force.
    Audio.setMuted(SettingsStore.get().muted);
    enterScene(this);
  }

  private after(delay: number, run: () => void) {
    if (SettingsStore.get().reducedMotion) {
      run();
      return;
    }
    this.timers.push(this.time.delayedCall(delay, run));
  }

  // ─────────────────────────────── réussite ───────────────────────────────

  private buildEscape(result: RunResult, breakdown: ReturnType<typeof scoreRun>, top: number) {
    makeText(this, VIEW_WIDTH / 2, top, FR.result.escaped, {
      size: 13,
      bold: true,
      color: TEXT.onLightMuted,
      letterSpacing: 2,
      align: 'center'
    }).setOrigin(0.5);

    // L'heure de départ, en grand. C'est la phrase que le joueur racontera.
    const clock = new PixelClock(this, VIEW_WIDTH / 2, top + 26, 10, PALETTE.headingWarm, {
      scale: 2,
      align: 'center'
    });
    clock.setText(result.finishedAt);
    if (!SettingsStore.get().reducedMotion) {
      const glyphs = [...clock.objects];
      glyphs.forEach((glyph) => glyph.setAlpha(0).setScale(2.6));
      this.tweens.add({
        targets: glyphs,
        alpha: 1,
        scale: 2,
        duration: 260,
        ease: 'Back.Out',
        delay: this.tweens.stagger(40, {})
      });
    }

    this.buildStars(breakdown.stars, top + 96);
    this.buildRows(breakdown, top + 148);
    this.buildRecord(result, top + 344);
  }

  /** Trois étoiles qui tombent une par une : le petit moment de récompense. */
  private buildStars(stars: number, y: number) {
    const reduced = SettingsStore.get().reducedMotion;
    for (let index = 0; index < 3; index += 1) {
      const earned = index < stars;
      const star = makeText(this, VIEW_WIDTH / 2 - 46 + index * 46, y, earned ? '★' : '☆', {
        size: 34,
        bold: true,
        color: earned ? TEXT.star : TEXT.onLightMuted,
        align: 'center'
      }).setOrigin(0.5);
      if (reduced || !earned) continue;

      star.setScale(0).setAlpha(0);
      this.tweens.add({
        targets: star,
        scale: 1,
        alpha: 1,
        duration: 240,
        ease: 'Back.Out',
        delay: 320 + index * 150
      });
      this.after(320 + index * 150, () => Audio.play('pickup'));
    }
  }

  /** Les trois axes du score, chacun avec son compteur qui monte. */
  private buildRows(breakdown: ReturnType<typeof scoreRun>, top: number) {
    const rows: [string, string, number][] = [
      [FR.result.scoreTime, breakdown.labels.time, breakdown.timePoints],
      [FR.result.scoreStealth, breakdown.labels.stealth, breakdown.stealthPoints],
      [FR.result.scoreCollection, breakdown.labels.collection, breakdown.collectionPoints]
    ];

    rows.forEach(([label, detail, points], index) => {
      const y = top + index * 48;
      makeText(this, 66, y, label, { size: 14, bold: true, color: TEXT.onLight });
      makeText(this, 66, y + 18, detail, { size: 11, color: TEXT.onLightMuted });
      const value = makeText(this, 324, y + 4, '0', {
        size: 18,
        bold: true,
        color: points > 0 ? TEXT.success : TEXT.onLightMuted
      }).setOrigin(1, 0.5);
      this.countUp(value, points, 760 + index * 90);
    });

    const totalY = top + 156;
    this.add.rectangle(VIEW_WIDTH / 2, totalY - 14, 268, 2, PALETTE.floorSeam, 1);
    makeText(this, 66, totalY, FR.result.scoreTotal, { size: 15, bold: true, color: TEXT.onLight });
    const total = makeText(this, 324, totalY + 4, '0', {
      size: 22,
      bold: true,
      color: TEXT.onLight
    }).setOrigin(1, 0.5);
    this.countUp(total, breakdown.total, 1040);
  }

  /**
   * Compteur qui monte. Un score qui apparaît d'un coup ne se lit pas comme
   * une récompense ; en mouvement réduit, on affiche la valeur finale.
   */
  private countUp(text: Phaser.GameObjects.Text, target: number, delay: number) {
    if (SettingsStore.get().reducedMotion || target === 0) {
      text.setText(`${target}`);
      return;
    }
    const counter = { value: 0 };
    this.tweens.add({
      targets: counter,
      value: target,
      duration: 420,
      delay,
      ease: 'Cubic.Out',
      onUpdate: () => text.setText(`${Math.round(counter.value)}`)
    });
  }

  private buildRecord(result: RunResult, y: number) {
    const record = result.request.daily
      ? Save.getDailyRecord(result.request.dayKey ?? '')
      : Save.getRecord(result.request.levelId);
    const isRecord = record !== null && record.minutes === result.stats.minutes;

    const text = makeText(
      this,
      VIEW_WIDTH / 2,
      y,
      isRecord ? FR.result.newRecord : `${FR.menu.record} : ${record?.minutes ?? '—'} min`,
      { size: isRecord ? 15 : 12, bold: true, color: isRecord ? TEXT.success : TEXT.onLightMuted }
    ).setOrigin(0.5);
    if (!isRecord || SettingsStore.get().reducedMotion) return;

    // Un record mérite qu'on le remarque : une pulsation, pas un feu d'artifice.
    text.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      duration: 300,
      delay: 1200,
      ease: 'Back.Out'
    });
    this.after(1200, () => Audio.play('win'));
  }

  // ─────────────────────────────── échec ──────────────────────────────────

  private buildFailure(result: RunResult, top: number) {
    makeText(
      this,
      VIEW_WIDTH / 2,
      top,
      result.outcome === 'overtime' ? FR.result.overtime : FR.result.intercepted,
      { size: 26, bold: true, color: TEXT.heading, align: 'center', wrap: 290 }
    ).setOrigin(0.5);

    // Même dans l'échec, l'heure reste l'information : c'est elle qu'on
    // essaiera de battre au prochain essai.
    const clock = new PixelClock(this, VIEW_WIDTH / 2, top + 44, 10, PALETTE.inkFaint, {
      scale: 1,
      align: 'center'
    });
    clock.setText(result.finishedAt);

    makeText(
      this,
      VIEW_WIDTH / 2,
      top + 100,
      result.outcome === 'overtime' ? FR.result.overtimeBody : (result.reason ?? ''),
      { size: 14, color: TEXT.onLightBody, align: 'center', wrap: 280, lineSpacing: 5 }
    ).setOrigin(0.5);
  }

  // ─────────────────────────────── actions ────────────────────────────────

  private buildActions(result: RunResult, escaped: boolean) {
    const followUp = escaped ? nextLevelId(result.request.levelId) : null;
    const baseY = VIEW_HEIGHT / 2 + (escaped ? 210 : 70);
    const skin = escaped ? 'ui-button' : 'ui-button-warm';

    if (followUp && !result.request.daily) {
      makePixelButton(this, VIEW_WIDTH / 2, baseY, FR.result.next, { width: 240, height: 52, skin }, () =>
        this.launch({ levelId: followUp, seed: randomSeed(), daily: false })
      );
    } else {
      makePixelButton(
        this,
        VIEW_WIDTH / 2,
        baseY,
        escaped ? FR.result.replay : FR.result.retry,
        { width: 240, height: 52, skin },
        () =>
          this.launch({ ...result.request, seed: result.request.daily ? result.request.seed : randomSeed() })
      );
    }

    makePixelButton(
      this,
      VIEW_WIDTH / 2,
      baseY + 64,
      FR.result.menu,
      { width: 240, height: 44, skin: 'ui-button-muted', size: 13 },
      () => {
        Audio.play('ui');
        resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
        leaveScene(this, () => this.scene.start('Menu'));
      }
    );
  }

  private launch(request: RunResult['request']) {
    Audio.play('ui');
    this.registry.set(REGISTRY_KEYS.request, request);
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    leaveScene(this, () => this.scene.start('Level'));
  }
}
