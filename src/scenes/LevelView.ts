import Phaser from 'phaser';
import {
  COLORS,
  DEPTH,
  DEFAULT_VISION_HALF_ANGLE_DEG,
  DEFAULT_VISION_RANGE,
  NPC_RADIUS,
  VISION_SEGMENTS
} from '../game/constants';
import { SettingsStore } from '../core/settings';
import { FR } from '../core/strings';
import {
  buildVisionPolygon,
  cullBlockers,
  isPointVisible,
  makeBlocker,
  type Blocker,
  type PointLike
} from '../game/geometry';
import type { NpcController } from '../systems/NpcController';
import type { DecorDef, LevelDef, NpcDef, ObstacleDef, TutorialDef } from '../game/types';
import { makeText } from '../ui/theme';

export interface NpcVisual {
  def: NpcDef;
  controller: NpcController;
  sprite: Phaser.GameObjects.Sprite;
  body: Phaser.Physics.Arcade.Body | null;
  nameText: Phaser.GameObjects.Text;
  vision: Phaser.GameObjects.Graphics;
  nose: Phaser.GameObjects.Graphics;
  gaugeBack: Phaser.GameObjects.Rectangle;
  gaugeFill: Phaser.GameObjects.Rectangle;
  gaugeLabel: Phaser.GameObjects.Text;
  visionRange: number;
  visionHalfAngle: number;
  /** Orientation courante du cône (radians), écrite par `LevelScene`. */
  facing: number;
  /** Sommets du cône, préalloués et réutilisés d'une frame à l'autre. */
  polygon: Phaser.Math.Vector2[];
}

const OBSTACLE_STYLE: Record<ObstacleDef['kind'], { fill: number; stroke: number }> = {
  wall: { fill: COLORS.wall, stroke: COLORS.wallTrim },
  desk: { fill: COLORS.desk, stroke: COLORS.ink },
  pillar: { fill: COLORS.pillar, stroke: COLORS.ink },
  cabinet: { fill: COLORS.cabinet, stroke: COLORS.ink },
  partition: { fill: COLORS.partition, stroke: COLORS.ink },
  door: { fill: COLORS.doorLocked, stroke: COLORS.ink }
};

/**
 * Toute la couche « dessin » d'un niveau.
 *
 * Séparer la vue de `LevelScene` évite de retomber dans la classe-dieu de la
 * V0.7 : ici, aucune règle de jeu, uniquement des pixels.
 */
export class LevelView {
  readonly solids: Phaser.GameObjects.Rectangle[] = [];
  private blockers: Blocker[] = [];
  private culled: Blocker[] = [];
  private talkers = new Map<string, { sprite: Phaser.GameObjects.Sprite; name: Phaser.GameObjects.Text }>();
  private darkness?: Phaser.GameObjects.Graphics;
  private light?: Phaser.GameObjects.Arc;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelDef
  ) {}

  drawFloor() {
    const { w, h } = this.level.size;
    const floor = this.level.ambient?.floor ?? COLORS.floor;
    const floorAlt = this.level.ambient?.floorAlt ?? COLORS.floorAlt;

    const graphics = this.scene.add.graphics().setDepth(DEPTH.floor);
    graphics.fillStyle(floor, 1).fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 80) {
      for (let x = 0; x < w; x += 80) {
        if ((x / 80 + y / 80) % 2 === 0) graphics.fillStyle(floorAlt, 0.32).fillRect(x, y, 80, 80);
      }
    }
    graphics.lineStyle(1, COLORS.floorLine, 0.28);
    for (let y = 0; y <= h; y += 80) graphics.lineBetween(0, y, w, y);
    for (let x = 0; x <= w; x += 80) graphics.lineBetween(x, 0, x, h);
  }

  /** Dessine les obstacles et renvoie les portes verrouillables, par identifiant. */
  drawObstacles(): Map<string, Phaser.GameObjects.Rectangle> {
    const doors = new Map<string, Phaser.GameObjects.Rectangle>();

    this.level.obstacles.forEach((obstacle) => {
      const style = OBSTACLE_STYLE[obstacle.kind];
      this.scene.add
        .rectangle(obstacle.x + 5, obstacle.y + 7, obstacle.w, obstacle.h, COLORS.ink, 0.18)
        .setDepth(DEPTH.obstacleShadow);

      const rectangle = this.scene.add
        .rectangle(obstacle.x, obstacle.y, obstacle.w, obstacle.h, style.fill)
        .setStrokeStyle(3, style.stroke, 0.82)
        .setDepth(DEPTH.obstacle);
      this.scene.physics.add.existing(rectangle, true);
      this.solids.push(rectangle);
      if (!obstacle.transparent) {
        this.blockers.push(makeBlocker(obstacle.x, obstacle.y, obstacle.w, obstacle.h));
      }

      if (obstacle.kind === 'cabinet') {
        this.scene.add
          .rectangle(obstacle.x + 1, obstacle.y, obstacle.w - 33, obstacle.h - 40, 0x85b9bd, 0.5)
          .setStrokeStyle(2, 0xdff1ee, 0.45)
          .setDepth(DEPTH.obstacleDetail);
      }
      if (obstacle.kind === 'pillar') {
        this.scene.add
          .rectangle(obstacle.x, obstacle.y, obstacle.w - 28, obstacle.h - 30, 0x756b78, 0.6)
          .setStrokeStyle(2, 0xb9abb6, 0.42)
          .setDepth(DEPTH.obstacleDetail);
      }
      if (obstacle.label) {
        makeText(this.scene, obstacle.x, obstacle.y, obstacle.label, {
          size: obstacle.kind === 'pillar' ? 16 : 15,
          bold: true,
          color: '#f3ece0'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.obstacleLabel);
      }
      if (obstacle.kind === 'door' && obstacle.id) doors.set(obstacle.id, rectangle);
    });

    return doors;
  }

  drawDecor() {
    this.level.decor.forEach((decor) => this.drawDecorItem(decor));

    // Les interlocuteurs de fin de niveau sont placés au-dessus de leur zone.
    this.level.triggers
      .filter((trigger) => trigger.kind === 'dialogue' && trigger.payload)
      .forEach((trigger) => {
        const dialogue = this.level.dialogues.find((candidate) => candidate.id === trigger.payload);
        if (!dialogue) return;
        const sprite = this.scene.add
          .sprite(trigger.zone.x, trigger.zone.y - 50, 'char-talker')
          .setDepth(DEPTH.npc);
        const name = makeText(this.scene, trigger.zone.x, trigger.zone.y - 80, dialogue.speaker, {
          size: 11,
          bold: true,
          color: '#713a30'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.npcDetail);
        this.talkers.set(dialogue.id, { sprite, name });
      });
  }

  private drawDecorItem(decor: DecorDef) {
    if (decor.kind === 'zone') {
      this.scene.add
        .rectangle(decor.x, decor.y, decor.w ?? 100, decor.h ?? 100, decor.color ?? COLORS.green, 0.7)
        .setStrokeStyle(2, 0xffffff, 0.42)
        .setDepth(DEPTH.floor);
      if (decor.text) {
        makeText(this.scene, decor.x, decor.y, decor.text, {
          size: 17,
          bold: true,
          color: '#f7fff5'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.floorLabel);
      }
      return;
    }

    if (decor.kind === 'text') {
      makeText(this.scene, decor.x, decor.y, decor.text ?? '', {
        size: decor.size ?? 12,
        bold: true,
        color: `#${(decor.color ?? 0x8c775c).toString(16).padStart(6, '0')}`
      })
        .setOrigin(0.5)
        .setDepth(DEPTH.floorLabel);
      return;
    }

    if (decor.kind === 'plant') {
      const pot = this.scene.add.ellipse(0, 12, 24, 18, 0x9c633d, 1).setStrokeStyle(2, COLORS.ink, 0.8);
      const leaves = this.scene.add.graphics();
      leaves.fillStyle(COLORS.sage, 1);
      leaves.fillEllipse(-7, -2, 13, 30).fillEllipse(7, -2, 13, 30).fillEllipse(0, -9, 13, 32);
      leaves.lineStyle(1, 0x344d35, 0.8).lineBetween(0, 11, 0, -20);
      this.scene.add
        .container(decor.x, decor.y, [pot, leaves])
        .setScale(decor.scale ?? 0.8)
        .setDepth(DEPTH.plant);
      return;
    }

    // deskProps : écran, dossier, tasse.
    const side = decor.side ?? 1;
    const screenX = decor.x - side * 14;
    this.scene.add
      .rectangle(screenX, decor.y - 12, 34, 23, 0x172238, 1)
      .setStrokeStyle(2, 0x718197, 0.9)
      .setDepth(DEPTH.deskProps);
    this.scene.add.rectangle(screenX, decor.y + 4, 12, 5, 0x3b485b, 1).setDepth(DEPTH.deskProps);
    this.scene.add
      .rectangle(decor.x + side * 18, decor.y + 20, 28, 9, 0xeadfca, 0.92)
      .setStrokeStyle(1, 0x6e5c4d, 0.7)
      .setDepth(DEPTH.deskProps);
    this.scene.add
      .circle(decor.x + side * 25, decor.y - 20, 7, 0xf2ead8, 1)
      .setStrokeStyle(2, COLORS.ink, 0.72)
      .setDepth(DEPTH.deskProps);
  }

  /** Voile de nuit + halo porté par le joueur. */
  drawAmbient() {
    const darkness = this.level.ambient?.darkness ?? 0;
    if (darkness <= 0) return;

    this.darkness = this.scene.add.graphics().setDepth(DEPTH.darkness);
    this.darkness.fillStyle(0x060a12, darkness).fillRect(0, 0, this.level.size.w, this.level.size.h);

    this.light = this.scene.add
      .circle(this.level.spawn.x, this.level.spawn.y, 150, 0xffe9b8, 0.13)
      .setDepth(DEPTH.light)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  updateLight(x: number, y: number) {
    this.light?.setPosition(x, y);
  }

  createNpc(def: NpcDef, controller: NpcController, index: number): NpcVisual {
    const spawn = def.patrol[0];
    const isCamera = def.archetype === 'camera';
    const texture = isCamera ? 'device-camera' : `char-${def.archetype}`;
    const sprite = this.scene.add.sprite(spawn.x, spawn.y, texture).setDepth(DEPTH.npc);

    let body: Phaser.Physics.Arcade.Body | null = null;
    if (!isCamera) {
      this.scene.physics.add.existing(sprite);
      body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setCircle(NPC_RADIUS);
      body.setCollideWorldBounds(true);
    }

    const nameText = makeText(this.scene, spawn.x, spawn.y - 34, def.label, {
      size: 11,
      bold: true,
      color: '#5a4a55'
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.npcDetail);

    const gaugeBack = this.scene.add
      .rectangle(spawn.x - 34, spawn.y - 45, 68, 8, 0x2d3942, 0.85)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.detection)
      .setVisible(false);
    const gaugeFill = this.scene.add
      .rectangle(spawn.x - 32, spawn.y - 45, 64, 5, 0xf0c75e, 1)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.detection + 1)
      .setVisible(false);
    const gaugeLabel = makeText(this.scene, spawn.x, spawn.y - 58, '', {
      size: 10,
      bold: true,
      color: '#5c382d'
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.detection + 2)
      .setVisible(false);

    return {
      def,
      controller,
      sprite,
      body,
      nameText,
      vision: this.scene.add.graphics().setDepth(DEPTH.vision + index * 0.01),
      nose: this.scene.add.graphics().setDepth(DEPTH.npcDetail),
      gaugeBack,
      gaugeFill,
      gaugeLabel,
      visionRange: def.visionRange ?? DEFAULT_VISION_RANGE,
      visionHalfAngle: ((def.visionHalfAngleDeg ?? DEFAULT_VISION_HALF_ANGLE_DEG) * Math.PI) / 180,
      facing: Math.PI / 2,
      // Préallocation : `buildVisionPolygon` ne créera jamais de sommet.
      polygon: Array.from({ length: VISION_SEGMENTS + 2 }, () => new Phaser.Math.Vector2())
    };
  }

  canSee(npc: NpcVisual, target: PointLike, range: number, halfAngle: number): boolean {
    const count = cullBlockers(npc.sprite, range, this.blockers, this.culled);
    return isPointVisible(target, npc.sprite, npc.facing, halfAngle, range, this.culled, count);
  }

  updateNpc(npc: NpcVisual, facing: number, range: number) {
    npc.facing = facing;
    npc.nameText.setPosition(npc.sprite.x, npc.sprite.y - 34);

    const count = cullBlockers(npc.sprite, range, this.blockers, this.culled);
    const vertices = buildVisionPolygon(
      npc.sprite,
      facing,
      npc.visionHalfAngle,
      range,
      this.culled,
      npc.polygon,
      VISION_SEGMENTS,
      count
    );

    const alerted = npc.controller.alerted;
    const searching = npc.controller.isSearching;
    const color = alerted ? COLORS.coneAlert : searching ? COLORS.coneSearch : COLORS.coneCalm;
    const points = npc.polygon.slice(0, vertices);

    npc.vision.clear();
    npc.vision.fillStyle(color, alerted ? 0.34 : 0.25);
    npc.vision.fillPoints(points, true);
    npc.vision.lineStyle(2, color, 0.42);
    npc.vision.strokePoints(points, true);

    // Mode daltonien : des hachures distinguent l'alerte autrement que par la teinte.
    if (alerted && SettingsStore.get().colorBlindMode) {
      npc.vision.lineStyle(2, 0xffffff, 0.5);
      for (let index = 1; index < vertices; index += 4) {
        npc.vision.lineBetween(npc.sprite.x, npc.sprite.y, npc.polygon[index].x, npc.polygon[index].y);
      }
    }

    npc.nose.clear();
    npc.nose.lineStyle(4, 0xffffff, 0.9);
    npc.nose.lineBetween(
      npc.sprite.x,
      npc.sprite.y,
      npc.sprite.x + Math.cos(facing) * 24,
      npc.sprite.y + Math.sin(facing) * 24
    );

    this.updateGauge(npc, color);
  }

  private updateGauge(npc: NpcVisual, color: number) {
    const active = npc.controller.detectionSeconds > 0.02;
    npc.gaugeBack.setPosition(npc.sprite.x - 34, npc.sprite.y - 45).setVisible(active);
    npc.gaugeFill
      .setPosition(npc.sprite.x - 32, npc.sprite.y - 45)
      .setDisplaySize(Math.max(1, 64 * npc.controller.detectionRatio), 5)
      .setFillStyle(color, 1)
      .setVisible(active);
    npc.gaugeLabel
      .setPosition(npc.sprite.x, npc.sprite.y - 58)
      .setText(npc.controller.alerted ? 'ALERTE !' : npc.controller.isSearching ? FR.hud.search : 'SUSPICION')
      .setColor(npc.controller.alerted ? '#b13f35' : '#7b5c22')
      .setVisible(active);
  }

  removeSolid(rectangle: Phaser.GameObjects.Rectangle) {
    const index = this.solids.indexOf(rectangle);
    if (index >= 0) this.solids.splice(index, 1);

    const blockerIndex = this.blockers.findIndex(
      (blocker) => blocker.cx === rectangle.x && blocker.cy === rectangle.y
    );
    if (blockerIndex >= 0) this.blockers.splice(blockerIndex, 1);

    rectangle.destroy();
  }

  showDistraction(x: number, y: number, durationMs: number) {
    const marker = this.scene.add.sprite(x, y, 'item-report').setDepth(DEPTH.item).setAlpha(0.9);
    const ring = this.scene.add
      .circle(x, y, 20, 0xffffff, 0)
      .setStrokeStyle(3, 0xf0c75e, 0.8)
      .setDepth(DEPTH.item);
    this.scene.tweens.add({
      targets: ring,
      radius: 120,
      alpha: 0,
      duration: 1200,
      repeat: Math.floor(durationMs / 1200)
    });
    this.scene.time.delayedCall(durationMs, () => {
      marker.destroy();
      ring.destroy();
    });
  }

  markTalkerDone(dialogueId: string) {
    const talker = this.talkers.get(dialogueId);
    if (!talker) return;
    const dialogue = this.level.dialogues.find((candidate) => candidate.id === dialogueId);
    talker.sprite.setPosition(talker.sprite.x - 160, talker.sprite.y);
    talker.name.setPosition(talker.name.x - 160, talker.name.y).setText(dialogue?.speakerAfter ?? '');
  }

  createTutorialBubble(tutorial: TutorialDef, onDismiss: () => void): Phaser.GameObjects.Container {
    const background = this.scene.add
      .rectangle(0, 0, 252, 72, 0x14212b, 0.96)
      .setStrokeStyle(2, 0xffffff, 0.45);
    const text = makeText(this.scene, 0, -9, tutorial.text, {
      size: 14,
      bold: true,
      color: '#ffffff',
      align: 'center',
      wrap: 224
    }).setOrigin(0.5);
    const hint = makeText(this.scene, 0, 22, FR.tutorial.close, { size: 10, color: '#b9cbd6' }).setOrigin(
      0.5
    );

    const anchor = tutorial.anchor === 'player' ? { x: 0, y: 0 } : tutorial.anchor;
    const container = this.scene.add
      .container(anchor.x, anchor.y, [background, text, hint])
      .setSize(252, 72)
      .setDepth(DEPTH.tutorial)
      .setInteractive(new Phaser.Geom.Rectangle(-126, -36, 252, 72), Phaser.Geom.Rectangle.Contains);
    container.setData('anchor', tutorial.anchor);
    container.setData('id', tutorial.id);
    container.on('pointerdown', onDismiss);
    return container;
  }
}
