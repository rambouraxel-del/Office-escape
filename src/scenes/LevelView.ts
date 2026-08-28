import Phaser from 'phaser';
import {
  COLORS,
  DEPTH,
  DEFAULT_VISION_HALF_ANGLE_DEG,
  DEFAULT_VISION_RANGE,
  NPC_RADIUS,
  TORCH_BEAM_ALPHA,
  TORCH_SPILL_ALPHA,
  VIEW_WIDTH,
  VISION_SEGMENTS
} from '../game/constants';
import {
  DOOR_OPEN_ANIM,
  DOOR_OPEN_MS,
  EMOTES,
  HINT_ANIM,
  PICKUP_ANIM,
  itemAnimKey,
  type CharacterState
} from '../game/animations';
import { playCharacter, playLiving, playLoop } from './animate';
import {
  ART_SCALE,
  CHARACTER_TEXTURES,
  DOOR_TEXTURE,
  FLOOR_TILES,
  FX_TEXTURES,
  ITEM_TEXTURES,
  PROP_ELEVATION,
  MATERIALS,
  TEXT,
  TEXT_TONES,
  WORLD_TEXT,
  NINE_SLICE_CORNER,
  OUTLINE,
  PROP_TEXTURES,
  TALKER_TEXTURE,
  ZONE_EDGES,
  ZONE_TILES,
  type MaterialStyle
} from '../game/artTheme';
import { PALETTE, hex, type PaletteKey } from '../game/palette';
import { Torch } from '../systems/Torch';
import { TUTORIAL_MARGIN, TUTORIAL_PADDING, TUTORIAL_TEXT_WIDTH, TUTORIAL_TOUCH_MARGIN } from '../game/constants';
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
import type { DecorDef, LevelDef, NpcDef, ObstacleDef, TutorialDef, Vec2 } from '../game/types';
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
  /** Bulle « ? / ! / … » au-dessus de la tête. */
  emote: Phaser.GameObjects.Sprite;
  /** Horodatage jusqu'auquel le PNJ joue son sursaut, écrit par `LevelScene`. */
  reactUntil: number;
  visionRange: number;
  visionHalfAngle: number;
  /** Orientation courante du cône (radians), écrite par `LevelScene`. */
  facing: number;
  /** Sommets du cône, préalloués et réutilisés d'une frame à l'autre. */
  polygon: Phaser.Math.Vector2[];
}

/**
 * Tout ce qui peut s'effacer dans le noir. Les rectangles de Phaser n'ont
 * qu'une opacité globale, les sprites en ont quatre : on ne demande donc que
 * le dénominateur commun.
 */
type Fadeable = { setAlpha(value: number): unknown };

/** Position du joueur, réutilisée : `revealAround` tourne à chaque frame. */
const POINT: Vec2 = { x: 0, y: 0 };


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
  private doorSprites = new Map<Phaser.GameObjects.Rectangle, Phaser.GameObjects.Sprite>();
  /**
   * Ce que la lampe du joueur révèle : PNJ, objets, indices. Le DÉCOR n'y est
   * pas — il reste lisible, on doit pouvoir se déplacer dans le noir.
   */
  private readonly revealed: { objects: Fadeable[]; at: Vec2 }[] = [];
  /** Modèle d'éclairage du niveau. Absent = plein jour, rien à révéler. */
  private torch: Torch | null = null;
  private hiddenAlpha = 0;
  /** Faisceau et flaque au sol, déplacés à chaque frame. */
  private beam?: Phaser.GameObjects.Image;
  private spill?: Phaser.GameObjects.Image;

  /** Jeu de matières du niveau : c'est lui qui donne son identité à l'étage. */
  private readonly materials: Record<string, MaterialStyle>;
  private readonly floorTile: string;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelDef
  ) {
    const theme = level.theme ?? 'office';
    this.materials = MATERIALS[theme];
    this.floorTile = FLOOR_TILES[theme];
    const ambient = level.ambient;
    this.torch = ambient?.torch ? new Torch(ambient.torch, ambient.lights ?? []) : null;
    this.hiddenAlpha = ambient?.hiddenAlpha ?? 0;
  }

  /**
   * Déclare un groupe d'objets que la lumière révèle.
   * Sans faisceau dans le niveau, l'appel ne coûte rien : la liste reste vide
   * et `revealAround` sort immédiatement.
   */
  private trackReveal(at: Vec2, ...objects: Fadeable[]) {
    if (!this.torch) return;
    this.revealed.push({ objects, at });
  }

  /**
   * Lampe torche : n'est visible que ce qui est ÉCLAIRÉ.
   *
   * Purement visuel. `NpcController` et les cônes de vision ne consultent
   * jamais l'opacité — un PNJ invisible vous voit exactement comme avant.
   * C'est justement ce qui rend la nuit tendue : on ne sait pas, eux si.
   */
  revealAround(x: number, y: number, facing: number) {
    const torch = this.torch;
    if (!torch) return;
    this.beam?.setPosition(x, y).setRotation(facing);
    this.spill?.setPosition(x, y);

    for (let index = 0; index < this.revealed.length; index += 1) {
      const entry = this.revealed[index];
      POINT.x = x;
      POINT.y = y;
      const light = torch.lightAt(entry.at, POINT, facing);
      const alpha = this.hiddenAlpha + (1 - this.hiddenAlpha) * light;
      for (let slot = 0; slot < entry.objects.length; slot += 1) entry.objects[slot].setAlpha(alpha);
    }
  }

  drawFloor() {
    const { w, h } = this.level.size;
    this.scene.add.tileSprite(0, 0, w, h, this.floorTile).setOrigin(0, 0).setDepth(DEPTH.floor);
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

      this.dressing.set(solid, this.dressObstacle(obstacle, solid));
      if (obstacle.kind === 'door' && obstacle.id) doors.set(obstacle.id, solid);
    });

    return doors;
  }

  /** Habillage pixel art d'un obstacle : ombre, matière, arêtes, incrustation. */
  private dressObstacle(
    obstacle: ObstacleDef,
    solid: Phaser.GameObjects.Rectangle
  ): Phaser.GameObjects.GameObject[] {
    const style = this.materials[obstacle.kind];
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
      const panel = this.scene.add
        .sprite(snap(obstacle.x), snap(obstacle.y), DOOR_TEXTURE)
        .setDepth(DEPTH.obstacleDetail);
      this.doorSprites.set(solid, panel);
      parts.push(panel);
    }

    if (obstacle.label) {
      parts.push(
        makeText(this.scene, snap(obstacle.x), snap(obstacle.y), obstacle.label, {
          size: 13,
          bold: true,
          color: WORLD_TEXT.furniture
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
        playCharacter(sprite, TALKER_TEXTURE, 'idle', 0, 0);
        const name = makeText(this.scene, snap(trigger.zone.x), snap(trigger.zone.y - 80), dialogue.speaker, {
          size: 11,
          bold: true,
          color: TEXT.heading
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
          color: WORLD_TEXT.floor
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
        color: hex(TEXT_TONES[decor.tone ?? 'zone'])
      })
        .setOrigin(0.5)
        .setDepth(DEPTH.floorLabel);
      return;
    }

    if (decor.kind === 'plant' || decor.kind === 'prop') {
      const prop = decor.kind === 'plant' ? 'plant' : (decor.prop ?? 'plant');
      this.addProp(
        snap(decor.x),
        snap(decor.y),
        PROP_TEXTURES[prop],
        PROP_ELEVATION[prop] === 'wall' ? DEPTH.obstacleLabel : DEPTH.plant
      );
      return;
    }

  }

  /**
   * Un accessoire de décor. Les quelques-uns qui ont une planche « vivante »
   * (écran, imprimante, fontaine, néon) se mettent à respirer tout seuls :
   * aucune condition à écrire ici ni dans la donnée du niveau.
   */
  private addProp(x: number, y: number, texture: string, depth: number) {
    const sprite = this.scene.add.sprite(x, y, texture).setDepth(depth);
    playLiving(sprite, texture);
    return sprite;
  }

  /**
   * Petit halo sur ce avec quoi on peut interagir : cachettes et portes
   * verrouillées. Tout vient de la DONNÉE du niveau — aucune coordonnée écrite
   * ici — et le halo reste volontairement pâle : un feedback n'est utile que
   * s'il ne concurrence pas les cônes de vision.
   */
  drawInteractionHints() {
    const points = [
      ...this.level.hidingSpots.map((spot) => spot.door),
      ...this.level.obstacles.filter((obstacle) => obstacle.kind === 'door' && obstacle.lock)
    ];
    points.forEach((point) => {
      const hint = this.scene.add
        .sprite(snap(point.x), snap(point.y), FX_TEXTURES.hint)
        .setDepth(DEPTH.item)
        .setAlpha(0.8);
      hint.play(HINT_ANIM);
      this.trackReveal(hint, hint);
    });
  }

  /**
   * Nuit du parking : un voile dense, percé par des halos additifs.
   *
   * Un seul sprite de dégradé, réutilisé et redimensionné — aucune texture
   * fabriquée à l'exécution, aucun shader, rien qui coûte sur un téléphone.
   * Et surtout : ces lampes ne sont QUE du rendu. `NpcController` et les cônes
   * de vision ne les consultent jamais.
   */
  drawAmbient() {
    const darkness = this.level.ambient?.darkness ?? 0;
    if (darkness <= 0) return;

    this.scene.add
      .graphics()
      .setDepth(DEPTH.darkness)
      .fillStyle(PALETTE.hudInset, darkness)
      .fillRect(0, 0, this.level.size.w, this.level.size.h);

    (this.level.ambient?.lights ?? []).forEach((lamp) => {
      const halo = this.scene.add
        .image(snap(lamp.x), snap(lamp.y), FX_TEXTURES.light)
        .setDepth(DEPTH.light)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(lamp.intensity ?? 0.72);
      // Le sprite fait 64 unités de côté : on le met à l'échelle du rayon voulu.
      halo.setDisplaySize(lamp.radius * 2, lamp.radius * 2);
    });

    const torch = this.level.ambient?.torch;
    if (!torch) return;

    // Faisceau : le sprite pointe vers la DROITE et son origine est à la
    // pointe, donc la rotation vaut directement l'orientation du joueur.
    this.beam = this.scene.add
      .image(this.level.spawn.x, this.level.spawn.y, FX_TEXTURES.beam)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.light + 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(TORCH_BEAM_ALPHA);
    this.beam.setDisplaySize(torch.range, torch.range * Math.tan((torch.halfAngleDeg * Math.PI) / 180) * 2);

    // Flaque aux pieds : sans elle, on avance en fixant l'horizon et l'on se
    // cogne dans ce qu'on a sous le nez.
    this.spill = this.scene.add
      .image(this.level.spawn.x, this.level.spawn.y, FX_TEXTURES.light)
      .setDepth(DEPTH.light + 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(TORCH_SPILL_ALPHA);
    this.spill.setDisplaySize(torch.spill * 2.4, torch.spill * 2.4);
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
      color: WORLD_TEXT.floor
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
    // Au-dessus de la jauge, jamais dessus : la bulle REMPLACE l'étiquette
    // texte de la V0.9.1 — une glyphe se lit plus vite qu'un mot, et se
    // distingue par sa FORME, donc aussi en mode daltonien.
    const emote = this.scene.add
      .sprite(spawn.x, spawn.y - 62, FX_TEXTURES.emote)
      .setDepth(DEPTH.detection + 3)
      .setVisible(false);

    const vision = this.scene.add.graphics().setDepth(DEPTH.vision + index * 0.01);

    // Le cône entre dans le groupe (V0.10.3) : dans le noir, un garde ne
    // trahit plus sa position par son faisceau. On l'éclaire, ou on ne sait
    // pas qu'il est là — et lui vous voit quand même.
    this.trackReveal(sprite, sprite, nameText, emote, gaugeBack, gaugeFill, vision);

    return {
      def,
      controller,
      sprite,
      body,
      nameText,
      emote,
      reactUntil: 0,
      vision,
      nose: this.scene.add.graphics().setDepth(DEPTH.npcDetail),
      gaugeBack,
      gaugeFill,
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
    this.animateNpc(npc);

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

  /**
   * Le personnage suit sa VITESSE, pas la direction de son cône : un vigile qui
   * balaie du regard ne doit pas marcher de côté.
   */
  private animateNpc(npc: NpcVisual) {
    const velocity = npc.body?.velocity;
    const dx = velocity?.x ?? 0;
    const dy = velocity?.y ?? 0;
    const moving = Math.hypot(dx, dy) > 6;
    const state: CharacterState =
      this.scene.time.now < npc.reactUntil
        ? 'react'
        : moving
          ? npc.controller.alerted
            ? 'run'
            : 'walk'
          : 'idle';
    playCharacter(npc.sprite, CHARACTER_TEXTURES[npc.def.archetype], state, dx, dy);

    // Une bulle par état de détection : le joueur doit comprendre CE QUE fait
    // le PNJ sans lire la jauge.
    const emoteKey = npc.controller.alerted
      ? EMOTES.alert
      : npc.controller.isSearching
        ? EMOTES.search
        : npc.controller.detectionSeconds > 0.05
          ? EMOTES.suspicion
          : null;
    npc.emote.setPosition(snap(npc.sprite.x), snap(npc.sprite.y - 62));
    playLoop(npc.emote, emoteKey);
  }

  private updateGauge(npc: NpcVisual, color: number) {
    const active = npc.controller.detectionSeconds > 0.02;
    npc.gaugeBack.setPosition(npc.sprite.x - 34, npc.sprite.y - 45).setVisible(active);
    npc.gaugeFill
      .setPosition(npc.sprite.x - 32, npc.sprite.y - 45)
      .setDisplaySize(Math.max(2, snap(64 * npc.controller.detectionRatio)), 4)
      .setFillStyle(color, 1)
      .setVisible(active);
  }

  removeSolid(rectangle: Phaser.GameObjects.Rectangle) {
    const parts = this.dressing.get(rectangle) ?? [];
    this.detachSolid(rectangle);
    // L'habillage disparaît avec le corps : une porte ouverte ne doit pas
    // laisser son battant peint sur le sol.
    parts.forEach((part) => part.destroy());
    rectangle.destroy();
  }

  /** Retire le corps du monde physique et de l'occlusion, sans rien détruire. */
  private detachSolid(rectangle: Phaser.GameObjects.Rectangle) {
    const index = this.solids.indexOf(rectangle);
    if (index >= 0) this.solids.splice(index, 1);

    const blockerIndex = this.blockers.findIndex(
      (blocker) => blocker.cx === rectangle.x && blocker.cy === rectangle.y
    );
    if (blockerIndex >= 0) this.blockers.splice(blockerIndex, 1);

    this.dressing.delete(rectangle);
    this.doorSprites.delete(rectangle);
  }

  /**
   * Ouverture d'une porte.
   *
   * La COLLISION disparaît immédiatement — le gameplay reste exactement celui
   * de la V0.8 —, seul l'habillage prend le temps de s'ouvrir. Le battant joue
   * son animation, le reste s'efface, puis tout est détruit.
   */
  openDoor(rectangle: Phaser.GameObjects.Rectangle) {
    const panel = this.doorSprites.get(rectangle);
    const parts = this.dressing.get(rectangle) ?? [];
    this.detachSolid(rectangle);
    rectangle.destroy();

    if (!panel) {
      parts.forEach((part) => part.destroy());
      return;
    }

    panel.play(DOOR_OPEN_ANIM);
    this.scene.tweens.add({
      targets: parts.filter((part) => part !== panel),
      alpha: 0,
      duration: DOOR_OPEN_MS,
      onComplete: () => parts.forEach((part) => part.destroy())
    });
  }

  /** Éclat de ramassage, puis vol de l'objet vers la poche du HUD. */
  collectItem(sprite: Phaser.GameObjects.Sprite, pocket: { x: number; y: number }) {
    const burst = this.scene.add
      .sprite(snap(sprite.x), snap(sprite.y), FX_TEXTURES.pickup)
      .setDepth(DEPTH.item + 1);
    burst.play(PICKUP_ANIM);
    burst.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => burst.destroy());

    // Le flottement de l'objet tire sur la même propriété que le vol : sans
    // cette coupure, les deux tweens se disputeraient la position.
    this.scene.tweens.killTweensOf(sprite);
    // On détache l'objet du monde pour l'accrocher à l'ÉCRAN : la caméra
    // continue de défiler pendant le vol, et une cible en coordonnées de monde
    // dériverait de plusieurs dizaines de pixels avant d'arriver.
    const camera = this.scene.cameras.main;
    sprite.setScrollFactor(0).setPosition(sprite.x - camera.scrollX, sprite.y - camera.scrollY);
    this.scene.tweens.add({
      targets: sprite,
      x: pocket.x,
      y: pocket.y,
      scale: 0.45,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.In',
      onComplete: () => sprite.setVisible(false).setActive(false)
    });
  }

  /** Idle d'un objet posé au sol : reflet qui balaie le sprite. */
  playItemIdle(sprite: Phaser.GameObjects.Sprite, texture: string) {
    playLoop(sprite, itemAnimKey(texture));
  }

  /** Un objet au sol : il ne se révèle que dans le halo, comme les PNJ. */
  trackItem(sprite: Phaser.GameObjects.Sprite, label: Phaser.GameObjects.Text) {
    this.trackReveal({ x: sprite.x, y: sprite.y }, sprite, label);
  }

  showDistraction(x: number, y: number, durationMs: number) {
    const marker = this.scene.add.image(snap(x), snap(y), ITEM_TEXTURES.report).setDepth(DEPTH.item);
    const ring = this.scene.add
      .circle(snap(x), snap(y), 20, PALETTE.paper, 0)
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

  /**
   * Bulle de tutoriel.
   *
   * Le PANNEAU se dimensionne sur le texte, jamais l'inverse : c'est la seule
   * façon de tenir la promesse du réglage « taille du texte ». Avec un cadre
   * figé, une consigne de trois lignes en débordait dès 120 %.
   */
  createTutorialBubble(tutorial: TutorialDef, onDismiss: () => void): Phaser.GameObjects.Container {
    const text = makeText(this.scene, 0, 0, tutorial.text, {
      size: 14,
      bold: true,
      color: TEXT.onDark,
      align: 'center',
      wrap: TUTORIAL_TEXT_WIDTH
    }).setOrigin(0.5);
    const hint = makeText(this.scene, 0, 0, FR.tutorial.close, {
      size: 10,
      color: TEXT.onDarkMuted,
      align: 'center'
    }).setOrigin(0.5);

    const width = Math.min(
      VIEW_WIDTH - TUTORIAL_MARGIN * 2,
      Math.max(text.width, hint.width) + TUTORIAL_PADDING * 2
    );
    const height = text.height + hint.height + TUTORIAL_PADDING * 3;
    text.setY(-height / 2 + TUTORIAL_PADDING + text.height / 2);
    hint.setY(height / 2 - TUTORIAL_PADDING / 2 - hint.height / 2);

    const panel = this.scene.add.nineslice(
      0,
      0,
      'ui-panel-dark',
      undefined,
      width,
      height,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER,
      NINE_SLICE_CORNER
    );
    // Liseré supérieur : la bulle se distingue d'un panneau de menu, et le
    // regard sait tout de suite que c'est une consigne, pas un choix.
    const rule = this.scene.add
      .rectangle(0, -height / 2 + OUTLINE * 3, width - OUTLINE * 8, OUTLINE, PALETTE.gold, 0.85)
      .setOrigin(0.5);

    const anchor = tutorial.anchor === 'player' ? { x: 0, y: 0 } : tutorial.anchor;
    const container = this.scene.add
      .container(snap(anchor.x), snap(anchor.y), [panel, rule, text, hint])
      .setSize(width, height)
      .setDepth(DEPTH.tutorial)
      // Zone tactile élargie : une bulle qu'on n'arrive pas à fermer est pire
      // qu'une bulle absente.
      .setInteractive(
        new Phaser.Geom.Rectangle(
          -width / 2 - TUTORIAL_TOUCH_MARGIN,
          -height / 2 - TUTORIAL_TOUCH_MARGIN,
          width + TUTORIAL_TOUCH_MARGIN * 2,
          height + TUTORIAL_TOUCH_MARGIN * 2
        ),
        Phaser.Geom.Rectangle.Contains
      );
    container.setData('anchor', tutorial.anchor);
    container.setData('id', tutorial.id);
    container.on('pointerdown', onDismiss);

    // Arrivée en douceur : une consigne qui apparaît d'un coup se lit comme
    // une erreur d'affichage.
    if (!SettingsStore.get().reducedMotion) {
      container.setScale(0.86).setAlpha(0);
      this.scene.tweens.add({
        targets: container,
        scale: 1,
        alpha: 1,
        duration: 180,
        ease: 'Back.Out'
      });
    }
    return container;
  }

  /**
   * Récompense visuelle de la sortie : le sol s'illumine et un halo s'ouvre.
   * Aucune règle n'attend cette animation — la partie est déjà gagnée.
   */
  celebrateExit(x: number, y: number) {
    if (SettingsStore.get().reducedMotion) return;
    const burst = this.scene.add
      .image(snap(x), snap(y), FX_TEXTURES.light)
      .setDepth(DEPTH.detection)
      .setTint(PALETTE.carpetExit)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1);
    this.scene.tweens.add({
      targets: burst,
      scale: 7,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => burst.destroy()
    });
  }
}
