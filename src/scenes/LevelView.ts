import Phaser from 'phaser';
import {
  COLORS,
  DEPTH,
  DEFAULT_VISION_HALF_ANGLE_DEG,
  DEFAULT_VISION_RANGE,
  NPC_RADIUS,
  VISION_SEGMENTS
} from '../game/constants';
import {
  ART_SCALE,
  CHARACTER_TEXTURES,
  DESK_PROPS,
  DOOR_TEXTURE,
  FLOOR_TILE,
  MATERIALS,
  NINE_SLICE_CORNER,
  OUTLINE,
  PROP_TEXTURES,
  TALKER_TEXTURE,
  ZONE_EDGES,
  ZONE_TILES,
  type MaterialStyle
} from '../game/artTheme';
import { PALETTE, type PaletteKey } from '../game/palette';
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

/** Aligne une coordonnée sur la grille du pixel d'art. */
function snap(value: number): number {
  return Math.round(value / ART_SCALE) * ART_SCALE;
}

/**
 * Toute la couche « dessin » d'un niveau, en pixel art.
 *
 * Séparer la vue de `LevelScene` évite de retomber dans la classe-dieu de la
 * V0.7 : ici, aucune règle de jeu, uniquement des pixels.
 *
 * Principe de la V0.9 : le rectangle de collision d'un obstacle reste
 * EXACTEMENT celui de la V0.8, simplement rendu invisible ; l'habillage est
 * dessiné par-dessus. Le gameplay ne peut donc pas bouger d'un pixel.
 */
export class LevelView {
  readonly solids: Phaser.GameObjects.Rectangle[] = [];
  private blockers: Blocker[] = [];
  private culled: Blocker[] = [];
  private talkers = new Map<string, { sprite: Phaser.GameObjects.Sprite; name: Phaser.GameObjects.Text }>();
  private dressing = new Map<Phaser.GameObjects.Rectangle, Phaser.GameObjects.GameObject[]>();
  private light?: Phaser.GameObjects.Arc;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelDef
  ) {}

  drawFloor() {
    const { w, h } = this.level.size;
    this.scene.add.tileSprite(0, 0, w, h, FLOOR_TILE).setOrigin(0, 0).setDepth(DEPTH.floor);
  }

  /** Dessine les obstacles et renvoie les portes verrouillables, par identifiant. */
  drawObstacles(): Map<string, Phaser.GameObjects.Rectangle> {
    const doors = new Map<string, Phaser.GameObjects.Rectangle>();

    this.level.obstacles.forEach((obstacle) => {
      // Corps physique : identique à la V0.8, mais invisible.
      const solid = this.scene.add
        .rectangle(obstacle.x, obstacle.y, obstacle.w, obstacle.h)
        .setVisible(false);
      this.scene.physics.add.existing(solid, true);
      this.solids.push(solid);
      if (!obstacle.transparent) {
        this.blockers.push(makeBlocker(obstacle.x, obstacle.y, obstacle.w, obstacle.h));
      }

      this.dressing.set(solid, this.dressObstacle(obstacle));
      if (obstacle.kind === 'door' && obstacle.id) doors.set(obstacle.id, solid);
    });

    return doors;
  }

  /** Habillage pixel art d'un obstacle : ombre, matière, arêtes, incrustation. */
  private dressObstacle(obstacle: ObstacleDef): Phaser.GameObjects.GameObject[] {
    const style = MATERIALS[obstacle.kind];
    const parts: Phaser.GameObjects.GameObject[] = [];
    const left = snap(obstacle.x - obstacle.w / 2);
    const top = snap(obstacle.y - obstacle.h / 2);
    const width = snap(obstacle.w);
    const height = snap(obstacle.h);

    // Ombre portée, décalée d'un pixel d'art : détache le meuble du sol.
    parts.push(
      this.scene.add
        .rectangle(left + ART_SCALE * 2, top + ART_SCALE * 3, width, height, PALETTE.ink, 0.22)
        .setOrigin(0, 0)
        .setDepth(DEPTH.obstacleShadow)
    );

    const fill = this.scene.add
      .tileSprite(left, top, width, height, style.tile)
      .setOrigin(0, 0)
      .setDepth(DEPTH.obstacle);
    // Le motif suit une grille de monde commune : deux meubles voisins ne
    // montrent pas de rupture de raccord.
    fill.tilePositionX = left;
    fill.tilePositionY = top;
    parts.push(fill);

    parts.push(this.drawEdges(left, top, width, height, style));

    if (style.inset && width > 40 && height > 40) {
      parts.push(
        this.scene.add
          .rectangle(
            left + OUTLINE * 4,
            top + OUTLINE * 4,
            width - OUTLINE * 8,
            height - OUTLINE * 8,
            PALETTE[style.inset],
            0.35
          )
          .setOrigin(0, 0)
          .setDepth(DEPTH.obstacleDetail)
      );
    }

    if (obstacle.kind === 'door') {
      parts.push(
        this.scene.add.image(snap(obstacle.x), snap(obstacle.y), DOOR_TEXTURE).setDepth(DEPTH.obstacleDetail)
      );
    }

    if (obstacle.label) {
      parts.push(
        makeText(this.scene, snap(obstacle.x), snap(obstacle.y), obstacle.label, {
          size: 13,
          bold: true,
          color: '#fff6e6'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.obstacleLabel)
      );
    }

    return parts;
  }

  /**
   * Contour à traits pleins d'un pixel d'art. On utilise `fillRect` et non
   * `lineStyle` : un trait Phaser est centré et lissé, donc jamais net.
   */
  private drawEdges(
    left: number,
    top: number,
    width: number,
    height: number,
    style: MaterialStyle
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics().setDepth(DEPTH.obstacleDetail);
    const line = (x: number, y: number, w: number, h: number, key: PaletteKey, alpha = 1) => {
      graphics.fillStyle(PALETTE[key], alpha);
      graphics.fillRect(x, y, w, h);
    };

    // Arête supérieure éclairée, base assombrie : du volume sans perspective.
    line(left + OUTLINE, top + OUTLINE, width - OUTLINE * 2, OUTLINE, style.crest);
    line(left + OUTLINE, top + height - OUTLINE * 2, width - OUTLINE * 2, OUTLINE, style.base);

    line(left, top, width, OUTLINE, style.edge);
    line(left, top + height - OUTLINE, width, OUTLINE, style.edge);
    line(left, top, OUTLINE, height, style.edge);
    line(left + width - OUTLINE, top, OUTLINE, height, style.edge);

    return graphics;
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
          .sprite(snap(trigger.zone.x), snap(trigger.zone.y - 50), TALKER_TEXTURE)
          .setDepth(DEPTH.npc);
        const name = makeText(this.scene, snap(trigger.zone.x), snap(trigger.zone.y - 80), dialogue.speaker, {
          size: 11,
          bold: true,
          color: '#7a3f30'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.npcDetail);
        this.talkers.set(dialogue.id, { sprite, name });
      });
  }

  private drawDecorItem(decor: DecorDef) {
    if (decor.kind === 'zone') {
      const material = decor.material ?? 'neutral';
      const width = snap(decor.w ?? 100);
      const height = snap(decor.h ?? 100);
      const left = snap(decor.x - width / 2);
      const top = snap(decor.y - height / 2);

      const zone = this.scene.add
        .tileSprite(left, top, width, height, ZONE_TILES[material])
        .setOrigin(0, 0)
        .setDepth(DEPTH.floor + 0.1);
      zone.tilePositionX = left;
      zone.tilePositionY = top;

      // Liseré : la zone doit se lire comme un tapis posé, pas comme une tache.
      const border = this.scene.add.graphics().setDepth(DEPTH.floor + 0.2);
      border.fillStyle(PALETTE[ZONE_EDGES[material]], 0.9);
      border.fillRect(left, top, width, OUTLINE);
      border.fillRect(left, top + height - OUTLINE, width, OUTLINE);
      border.fillRect(left, top, OUTLINE, height);
      border.fillRect(left + width - OUTLINE, top, OUTLINE, height);

      if (decor.text) {
        makeText(this.scene, snap(decor.x), snap(decor.y), decor.text, {
          size: 15,
          bold: true,
          color: '#3a2f24'
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.floorLabel);
      }
      return;
    }

    if (decor.kind === 'text') {
      makeText(this.scene, snap(decor.x), snap(decor.y), decor.text ?? '', {
        size: decor.size ?? 12,
        bold: true,
        color: `#${(decor.color ?? PALETTE.shadow).toString(16).padStart(6, '0')}`
      })
        .setOrigin(0.5)
        .setDepth(DEPTH.floorLabel);
      return;
    }

    if (decor.kind === 'plant' || decor.kind === 'prop') {
      const prop = decor.kind === 'plant' ? 'plant' : (decor.prop ?? 'plant');
      this.scene.add
        .image(snap(decor.x), snap(decor.y), PROP_TEXTURES[prop])
        .setDepth(prop === 'exitSign' ? DEPTH.obstacleLabel : DEPTH.plant);
      return;
    }

    // deskProps : écran, tasse, dossiers, chaise — la vie de bureau.
    const side = decor.side ?? 1;
    const x = snap(decor.x);
    const y = snap(decor.y);
    this.scene.add.image(x - side * 14, y - 10, DESK_PROPS.screen).setDepth(DEPTH.deskProps);
    this.scene.add.image(x + side * 22, y - 16, DESK_PROPS.mug).setDepth(DEPTH.deskProps);
    this.scene.add.image(x + side * 20, y + 18, DESK_PROPS.folder).setDepth(DEPTH.deskProps);
  }

  /** Voile de nuit + halo porté par le joueur. */
  drawAmbient() {
    const darkness = this.level.ambient?.darkness ?? 0;
    if (darkness <= 0) return;

    this.scene.add
      .graphics()
      .setDepth(DEPTH.darkness)
      .fillStyle(PALETTE.hudInset, darkness)
      .fillRect(0, 0, this.level.size.w, this.level.size.h);

    this.light = this.scene.add
      .circle(this.level.spawn.x, this.level.spawn.y, 150, PALETTE.gold, 0.13)
      .setDepth(DEPTH.light)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  updateLight(x: number, y: number) {
    this.light?.setPosition(x, y);
  }

  createNpc(def: NpcDef, controller: NpcController, index: number): NpcVisual {
    const spawn = def.patrol[0];
    const isCamera = def.archetype === 'camera';
    const sprite = this.scene.add
      .sprite(spawn.x, spawn.y, CHARACTER_TEXTURES[def.archetype])
      .setDepth(DEPTH.npc);

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
      color: '#3a2f3a'
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.npcDetail);

    const gaugeBack = this.scene.add
      .rectangle(spawn.x - 34, spawn.y - 45, 68, 8, PALETTE.ink, 0.85)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.detection)
      .setVisible(false);
    const gaugeFill = this.scene.add
      .rectangle(spawn.x - 32, spawn.y - 45, 64, 4, PALETTE.gold, 1)
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
      npc.vision.lineStyle(2, PALETTE.paper, 0.5);
      for (let index = 1; index < vertices; index += 4) {
        npc.vision.lineBetween(npc.sprite.x, npc.sprite.y, npc.polygon[index].x, npc.polygon[index].y);
      }
    }

    npc.nose.clear();
    npc.nose.fillStyle(PALETTE.paper, 0.9);
    // Repère de direction en pixels carrés plutôt qu'un trait lissé.
    for (let step = 1; step <= 3; step += 1) {
      npc.nose.fillRect(
        snap(npc.sprite.x + Math.cos(facing) * (10 + step * 6)) - OUTLINE,
        snap(npc.sprite.y + Math.sin(facing) * (10 + step * 6)) - OUTLINE,
        OUTLINE * 2,
        OUTLINE * 2
      );
    }

    this.updateGauge(npc, color);
  }

  private updateGauge(npc: NpcVisual, color: number) {
    const active = npc.controller.detectionSeconds > 0.02;
    npc.gaugeBack.setPosition(npc.sprite.x - 34, npc.sprite.y - 45).setVisible(active);
    npc.gaugeFill
      .setPosition(npc.sprite.x - 32, npc.sprite.y - 45)
      .setDisplaySize(Math.max(2, snap(64 * npc.controller.detectionRatio)), 4)
      .setFillStyle(color, 1)
      .setVisible(active);
    npc.gaugeLabel
      .setPosition(npc.sprite.x, npc.sprite.y - 58)
      .setText(npc.controller.alerted ? 'ALERTE !' : npc.controller.isSearching ? FR.hud.search : 'SUSPICION')
      .setColor(npc.controller.alerted ? '#b03424' : '#7b5c22')
      .setVisible(active);
  }

  removeSolid(rectangle: Phaser.GameObjects.Rectangle) {
    const index = this.solids.indexOf(rectangle);
    if (index >= 0) this.solids.splice(index, 1);

    const blockerIndex = this.blockers.findIndex(
      (blocker) => blocker.cx === rectangle.x && blocker.cy === rectangle.y
    );
    if (blockerIndex >= 0) this.blockers.splice(blockerIndex, 1);

    // L'habillage disparaît avec le corps : une porte ouverte ne doit pas
    // laisser son battant peint sur le sol.
    this.dressing.get(rectangle)?.forEach((part) => part.destroy());
    this.dressing.delete(rectangle);
    rectangle.destroy();
  }

  showDistraction(x: number, y: number, durationMs: number) {
    const marker = this.scene.add.image(snap(x), snap(y), 'item-report').setDepth(DEPTH.item);
    const ring = this.scene.add
      .circle(snap(x), snap(y), 20, 0xffffff, 0)
      .setStrokeStyle(OUTLINE, PALETTE.gold, 0.8)
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
    const panel = this.scene.add.nineslice(
      0,
      0,
      'ui-panel-dark',
      undefined,
      252,
      76,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER
    );
    const text = makeText(this.scene, 0, -10, tutorial.text, {
      size: 14,
      bold: true,
      color: '#fff6e6',
      align: 'center',
      wrap: 216
    }).setOrigin(0.5);
    const hint = makeText(this.scene, 0, 24, FR.tutorial.close, { size: 10, color: '#a99cc4' }).setOrigin(
      0.5
    );

    const anchor = tutorial.anchor === 'player' ? { x: 0, y: 0 } : tutorial.anchor;
    const container = this.scene.add
      .container(snap(anchor.x), snap(anchor.y), [panel, text, hint])
      .setSize(252, 76)
      .setDepth(DEPTH.tutorial)
      .setInteractive(new Phaser.Geom.Rectangle(-126, -38, 252, 76), Phaser.Geom.Rectangle.Contains);
    container.setData('anchor', tutorial.anchor);
    container.setData('id', tutorial.id);
    container.on('pointerdown', onDismiss);
    return container;
  }
}
