import Phaser from 'phaser';
import { COLORS, VIEW_HEIGHT, VIEW_WIDTH } from '../game/constants';
import { Audio } from '../core/audio';
import { randomSeed } from '../core/prng';
import { Save } from '../core/save';
import { SettingsStore } from '../core/settings';
import { scoreRun, starDisplay } from '../core/scoring';
import { FR } from '../core/strings';
import { getLevel, nextLevelId } from '../levels';
import { REGISTRY_KEYS, resetInputState, type InputState, type RunResult } from '../game/session';
import { makeButton, makeShade, makeText } from '../ui/theme';

/**
 * Écran de fin : détaille le score sur ses trois axes plutôt que d'afficher un
 * seul chrono, pour donner une raison de rejouer autrement que « plus vite ».
 */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create() {
    const result = this.registry.get(REGISTRY_KEYS.result) as RunResult;
    const level = getLevel(result.request.levelId);
    const escaped = result.outcome === 'escaped';
    const breakdown = scoreRun(result.stats, level);
    const color = escaped ? 0x4f8b61 : result.outcome === 'overtime' ? 0x6e4d78 : 0xb8493f;

    makeShade(this, VIEW_WIDTH, VIEW_HEIGHT, 0.9);
    this.add
      .rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 340, escaped ? 560 : 380, 0xf8f4ea, 1)
      .setStrokeStyle(5, color, 1);

    const top = VIEW_HEIGHT / 2 - (escaped ? 250 : 160);
    const title = escaped
      ? `${FR.result.escaped} : ${result.finishedAt}`
      : result.outcome === 'overtime'
        ? FR.result.overtime
        : FR.result.intercepted;

    makeText(this, VIEW_WIDTH / 2, top, title, {
      size: 26,
      bold: true,
      color: `#${color.toString(16).padStart(6, '0')}`,
      align: 'center',
      wrap: 290
    }).setOrigin(0.5);

    if (escaped) this.buildScoreCard(result, breakdown, top);
    else {
      makeText(
        this,
        VIEW_WIDTH / 2,
        top + 70,
        result.outcome === 'overtime' ? FR.result.overtimeBody : (result.reason ?? ''),
        { size: 14, color: '#33414b', align: 'center', wrap: 280, lineSpacing: 5 }
      ).setOrigin(0.5);
    }

    this.buildActions(result, escaped, color);
    // Respecte le réglage : ne jamais réactiver le son de force.
    Audio.setMuted(SettingsStore.get().muted);
  }

  private buildScoreCard(result: RunResult, breakdown: ReturnType<typeof scoreRun>, top: number) {
    makeText(this, VIEW_WIDTH / 2, top + 44, starDisplay(breakdown.stars), {
      size: 34,
      bold: true,
      color: '#d8a638',
      align: 'center'
    }).setOrigin(0.5);

    const rows: [string, string, number][] = [
      [FR.result.scoreTime, breakdown.labels.time, breakdown.timePoints],
      [FR.result.scoreStealth, breakdown.labels.stealth, breakdown.stealthPoints],
      [FR.result.scoreCollection, breakdown.labels.collection, breakdown.collectionPoints]
    ];

    rows.forEach(([label, detail, points], index) => {
      const y = top + 110 + index * 52;
      makeText(this, 70, y, label, { size: 14, bold: true, color: '#2c3a48' });
      makeText(this, 70, y + 19, detail, { size: 11, color: '#7d8894' });
      makeText(this, 320, y + 4, `${points}`, {
        size: 18,
        bold: true,
        color: points > 0 ? '#4f8b61' : '#a8a29a'
      }).setOrigin(1, 0.5);
    });

    const totalY = top + 280;
    this.add.rectangle(VIEW_WIDTH / 2, totalY - 14, 268, 2, 0xd8cdb8, 1);
    makeText(this, 70, totalY, FR.result.scoreTotal, { size: 15, bold: true, color: '#2c3a48' });
    makeText(this, 320, totalY + 4, `${breakdown.total}`, {
      size: 22,
      bold: true,
      color: '#2c3a48'
    }).setOrigin(1, 0.5);

    const record = result.request.daily
      ? Save.getDailyRecord(result.request.dayKey ?? '')
      : Save.getRecord(result.request.levelId);
    const isRecord = record !== null && record.minutes === result.stats.minutes;
    makeText(
      this,
      VIEW_WIDTH / 2,
      totalY + 48,
      isRecord ? FR.result.newRecord : `${FR.menu.record} : ${record?.minutes ?? '—'} min`,
      { size: 12, bold: true, color: isRecord ? '#4f8b61' : '#8b8377', align: 'center' }
    ).setOrigin(0.5);
  }

  private buildActions(result: RunResult, escaped: boolean, color: number) {
    const followUp = escaped ? nextLevelId(result.request.levelId) : null;
    const baseY = VIEW_HEIGHT / 2 + (escaped ? 200 : 110);

    if (followUp && !result.request.daily) {
      makeButton(this, VIEW_WIDTH / 2, baseY, FR.result.next, { width: 240, height: 52, color }, () =>
        this.launch({ levelId: followUp, seed: randomSeed(), daily: false })
      );
    } else {
      makeButton(
        this,
        VIEW_WIDTH / 2,
        baseY,
        escaped ? FR.result.replay : FR.result.retry,
        { width: 240, height: 52, color },
        () =>
          this.launch({ ...result.request, seed: result.request.daily ? result.request.seed : randomSeed() })
      );
    }

    makeButton(
      this,
      VIEW_WIDTH / 2,
      baseY + 64,
      FR.result.menu,
      { width: 240, height: 44, color: COLORS.hud, size: 13 },
      () => {
        resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
        this.scene.start('Menu');
      }
    );
  }

  private launch(request: RunResult['request']) {
    Audio.play('ui');
    this.registry.set(REGISTRY_KEYS.request, request);
    resetInputState(this.registry.get(REGISTRY_KEYS.input) as InputState);
    this.scene.start('Level');
  }
}
