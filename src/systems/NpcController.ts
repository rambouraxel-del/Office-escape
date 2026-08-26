import {
  CAMERA_HOLD_MS,
  CAMERA_SWEEP_DEG_PER_SECOND,
  CHASE_REPATH_SECONDS,
  DETECTION_ALERT_SECONDS,
  DETECTION_DECAY_PER_SECOND,
  DETECTION_INTERCEPT_SECONDS,
  ROAM_JITTER,
  ROAM_PAUSE_SECONDS,
  RUN_DETECTION_MULTIPLIER,
  SEARCH_ARRIVAL_RADIUS,
  SEARCH_SECONDS
} from '../game/constants';
import { NAV_WAYPOINT_RADIUS, type NavGrid } from './NavGrid';
import type { NpcDef, Vec2 } from '../game/types';

export type NpcState = 'patrol' | 'chase' | 'search' | 'distracted';

/** Ce que le PNJ perçoit du monde à cette frame. */
export interface NpcSense {
  position: Vec2;
  playerVisible: boolean;
  playerPosition: Vec2;
  playerRunning: boolean;
  /** Point d'intérêt sonore actif (rapport lâché), sinon `null`. */
  distraction: Vec2 | null;
}

/**
 * ATTENTION : l'instance renvoyée par `update()` est RÉUTILISÉE d'une frame à
 * l'autre (zéro allocation). Il faut la consommer immédiatement, jamais la
 * stocker ni la comparer à un appel précédent.
 */
export interface NpcIntent {
  /** Destination visée. */
  target: Vec2;
  speed: number;
  /** Orientation du cône, en radians. */
  facing: number;
}

/** Longueur maximale d'un chemin conservé. Au-delà, on recalcule. */
const MAX_PATH = 48;

/**
 * Machine à états d'un PNJ, sans dépendance à Phaser.
 *
 * Trois comportements par-dessus la ronde :
 *  - `search` : on va fouiller la dernière position connue avant de repartir
 *    en ronde, ce qui rend la cachette tactique au lieu d'annulante ;
 *  - `distracted` : un rapport lâché déplace l'attention ;
 *  - navigation : depuis la V0.10.1, TOUTE destination passe par la grille de
 *    navigation du niveau. Le PNJ suit des points de passage au lieu de foncer
 *    en ligne droite — c'est ce qui l'empêchait de rester collé aux voitures
 *    du parking, et la poussée latérale de secours n'a plus lieu de servir.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class NpcController {
  state: NpcState = 'patrol';
  detectionSeconds = 0;
  alerted = false;

  private patrolIndex: number;
  private searchTimer = 0;
  private lastKnown: Vec2 = { x: 0, y: 0 };
  private facingAngle = Math.PI / 2;
  private readonly intent: NpcIntent = { target: { x: 0, y: 0 }, speed: 0, facing: 0 };

  /** Destination courante, et le chemin qui y mène. */
  private readonly goal: Vec2 = { x: 0, y: 0 };
  private hasGoal = false;
  private readonly path: Vec2[] = Array.from({ length: MAX_PATH }, () => ({ x: 0, y: 0 }));
  private pathLength = 0;
  private pathIndex = 0;
  private repathTimer = 0;
  private pauseTimer = 0;
  private readonly scratch: Vec2 = { x: 0, y: 0 };

  /** Balayage de caméra : sens courant et temps d'arrêt restant. */
  private sweepRatio = 0;
  private sweepDirection = 1;
  private holdTimer = 0;

  constructor(
    private readonly def: NpcDef,
    private readonly patrolSpeed: number,
    private readonly chaseSpeed: number,
    /** Décalage de phase initial, tiré de la seed : varie le Défi du jour. */
    phase = 0,
    /** Grille du niveau. Absente, le PNJ vise en ligne droite comme en V0.9. */
    private readonly nav: NavGrid | null = null,
    /**
     * Tirage du niveau, seedé. Il décale les points de ronde dans la zone
     * autorisée — le Défi du jour reste donc parfaitement reproductible.
     */
    private readonly random: () => number = () => 0.5
  ) {
    this.patrolIndex = def.patrol.length > 1 ? 1 : 0;
    this.sweepRatio = phase % 1;
  }

  get isCamera(): boolean {
    return this.def.archetype === 'camera' || this.def.patrol.length === 1;
  }

  get isSearching(): boolean {
    return this.state === 'search' || this.state === 'distracted';
  }

  /** Ratio de remplissage de la jauge de suspicion, dans [0, 1]. */
  get detectionRatio(): number {
    return Math.min(1, this.detectionSeconds / DETECTION_INTERCEPT_SECONDS);
  }

  get shouldIntercept(): boolean {
    return this.detectionSeconds >= DETECTION_INTERCEPT_SECONDS;
  }

  /** Fait progresser la jauge. Renvoie `true` si l'alerte vient de se déclencher. */
  updateDetection(deltaSeconds: number, visible: boolean, playerRunning: boolean): boolean {
    const wasAlerted = this.alerted;

    if (visible) {
      const multiplier = playerRunning ? RUN_DETECTION_MULTIPLIER : 1;
      this.detectionSeconds = Math.min(
        DETECTION_INTERCEPT_SECONDS,
        this.detectionSeconds + deltaSeconds * multiplier
      );
    } else {
      this.detectionSeconds = Math.max(0, this.detectionSeconds - deltaSeconds * DETECTION_DECAY_PER_SECOND);
    }

    if (this.detectionSeconds >= DETECTION_ALERT_SECONDS) this.alerted = true;
    else if (this.detectionSeconds < 0.35) this.alerted = false;

    return !wasAlerted && this.alerted;
  }

  update(deltaSeconds: number, sense: NpcSense): NpcIntent {
    const previousState = this.state;
    this.updateState(deltaSeconds, sense);
    // Un changement d'état invalide toujours le chemin : celui d'une ronde
    // n'a aucun sens pour une poursuite, et l'inverse non plus. C'est ce qui
    // fait qu'un PNJ reprend proprement sa ronde après une fouille.
    if (this.state !== previousState) this.clearPath();

    if (this.isCamera) {
      this.intent.target.x = sense.position.x;
      this.intent.target.y = sense.position.y;
      this.intent.speed = 0;
      this.intent.facing = this.cameraFacing(deltaSeconds, sense);
      return this.intent;
    }

    const step = this.navigate(deltaSeconds, sense);
    this.intent.target.x = step.x;
    this.intent.target.y = step.y;
    this.intent.speed = this.pauseTimer > 0 ? 0 : this.state === 'chase' ? this.chaseSpeed : this.patrolSpeed;

    const dx = step.x - sense.position.x;
    const dy = step.y - sense.position.y;
    if (this.intent.speed > 0 && dx * dx + dy * dy > 1) this.facingAngle = Math.atan2(dy, dx);
    this.intent.facing = this.facingAngle;

    return this.intent;
  }

  // ─────────────────────────────── navigation ─────────────────────────────

  private clearPath(): void {
    this.pathLength = 0;
    this.pathIndex = 0;
    this.hasGoal = false;
    this.repathTimer = 0;
  }

  /**
   * Renvoie le POINT DE PASSAGE à viser maintenant.
   *
   * On ne recalcule un chemin que lorsque la destination change vraiment, ou
   * périodiquement en poursuite : un parcours en largeur d'abord par frame et
   * par PNJ ferait chuter le téléphone pour rien.
   */
  private navigate(deltaSeconds: number, sense: NpcSense): Vec2 {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= deltaSeconds;
      // Si la pause s'achève dans cette frame, on repart tout de suite : la
      // retenir une frame de plus ferait bégayer le PNJ.
      if (this.pauseTimer > 0) return sense.position;
    }

    this.repathTimer -= deltaSeconds;
    const desired = this.desiredGoal(sense);

    const moved = Math.hypot(desired.x - this.goal.x, desired.y - this.goal.y);
    const needsPath =
      !this.hasGoal ||
      this.pathIndex >= this.pathLength ||
      moved > SEARCH_ARRIVAL_RADIUS ||
      (this.state === 'chase' && this.repathTimer <= 0);

    if (needsPath) {
      this.goal.x = desired.x;
      this.goal.y = desired.y;
      this.hasGoal = true;
      this.repathTimer = CHASE_REPATH_SECONDS;
      this.buildPath(sense.position);
    }

    if (this.pathIndex >= this.pathLength) return this.goal;

    const waypoint = this.path[this.pathIndex];
    if (Math.hypot(sense.position.x - waypoint.x, sense.position.y - waypoint.y) <= NAV_WAYPOINT_RADIUS) {
      this.pathIndex += 1;
      if (this.pathIndex >= this.pathLength) {
        this.arrive();
        return this.goal;
      }
    }
    return this.path[this.pathIndex];
  }

  private buildPath(position: Vec2): void {
    this.pathIndex = 0;
    if (!this.nav) {
      // Sans grille, on garde le comportement de la V0.9 : viser tout droit.
      this.pathLength = 1;
      this.path[0].x = this.goal.x;
      this.path[0].y = this.goal.y;
      return;
    }

    // Un PNJ peut se trouver dans la marge d'un obstacle, et une destination
    // tirée au hasard peut tomber dans un mur : on recale les deux bouts.
    this.nav.nearestWalkable(position.x, position.y, this.scratch);
    const startX = this.scratch.x;
    const startY = this.scratch.y;
    this.nav.nearestWalkable(this.goal.x, this.goal.y, this.scratch);
    this.goal.x = this.scratch.x;
    this.goal.y = this.scratch.y;

    this.scratch.x = startX;
    this.scratch.y = startY;
    this.pathLength = this.nav.findPath(this.scratch, this.goal, this.path);
    if (this.pathLength === 0) {
      // Aucun chemin : on vise quand même, la physique fera le reste et le
      // point de ronde suivant remettra le PNJ dans le droit chemin.
      this.pathLength = 1;
      this.path[0].x = this.goal.x;
      this.path[0].y = this.goal.y;
    }
  }

  /** Le PNJ est arrivé : point de ronde suivant, avec une courte pause. */
  private arrive(): void {
    if (this.state !== 'patrol' || this.def.patrol.length <= 1) return;
    this.patrolIndex = (this.patrolIndex + 1) % this.def.patrol.length;
    this.pauseTimer = ROAM_PAUSE_SECONDS;
    this.hasGoal = false;
  }

  /** Destination visée par l'état courant, avant mise en chemin. */
  private desiredGoal(sense: NpcSense): Vec2 {
    if (this.state === 'chase') return sense.playerPosition;
    if (this.state === 'search' || this.state === 'distracted') return this.lastKnown;

    const anchor = this.def.patrol[this.patrolIndex] ?? sense.position;
    const zone = this.def.roam;
    if (!zone) return anchor;

    // Décalage aléatoire autour du point de ronde, borné par la zone
    // autorisée : le circuit reste apprenable, la trajectoire ne se répète
    // jamais à l'identique.
    const jitterX = (this.random() * 2 - 1) * ROAM_JITTER;
    const jitterY = (this.random() * 2 - 1) * ROAM_JITTER;
    this.scratch.x = clamp(anchor.x + jitterX, zone.x - zone.w / 2, zone.x + zone.w / 2);
    this.scratch.y = clamp(anchor.y + jitterY, zone.y - zone.h / 2, zone.y + zone.h / 2);
    return this.scratch;
  }

  private updateState(deltaSeconds: number, sense: NpcSense): void {
    if (this.alerted && sense.playerVisible) {
      this.state = 'chase';
      this.lastKnown.x = sense.playerPosition.x;
      this.lastKnown.y = sense.playerPosition.y;
      this.searchTimer = SEARCH_SECONDS;
      return;
    }

    if (this.state === 'chase') {
      // Le joueur a disparu : on va voir là où il était.
      this.state = 'search';
      this.searchTimer = SEARCH_SECONDS;
      return;
    }

    if (this.state === 'search') {
      const reached =
        Math.hypot(sense.position.x - this.lastKnown.x, sense.position.y - this.lastKnown.y) <
        SEARCH_ARRIVAL_RADIUS;
      this.searchTimer -= deltaSeconds * (reached ? 2 : 1);
      if (this.searchTimer <= 0) this.state = 'patrol';
      return;
    }

    if (sense.distraction) {
      this.state = 'distracted';
      this.lastKnown.x = sense.distraction.x;
      this.lastKnown.y = sense.distraction.y;
      return;
    }

    if (this.state === 'distracted') this.state = 'patrol';
  }

  private cameraFacing(deltaSeconds: number, sense: NpcSense): number {
    // Une caméra alertée cesse de balayer et suit sa cible.
    if (this.alerted && sense.playerVisible) {
      return Math.atan2(sense.playerPosition.y - sense.position.y, sense.playerPosition.x - sense.position.x);
    }

    const sweep = this.def.sweep;
    if (!sweep) return this.facingAngle;

    const span = Math.abs(sweep.to - sweep.from) || 1;
    const speed = (sweep.degPerSecond ?? CAMERA_SWEEP_DEG_PER_SECOND) / span;

    if (this.holdTimer > 0) {
      // Arrêt en bout de course : c'est CETTE pause qui donne au joueur une
      // fenêtre qu'il peut observer, compter et jouer.
      this.holdTimer -= deltaSeconds * 1000;
    } else {
      this.sweepRatio += this.sweepDirection * speed * deltaSeconds;
      if (this.sweepRatio >= 1) {
        this.sweepRatio = 1;
        this.sweepDirection = -1;
        this.holdTimer = sweep.holdMs ?? CAMERA_HOLD_MS;
      } else if (this.sweepRatio <= 0) {
        this.sweepRatio = 0;
        this.sweepDirection = 1;
        this.holdTimer = sweep.holdMs ?? CAMERA_HOLD_MS;
      }
    }

    const degrees = sweep.from + (sweep.to - sweep.from) * this.sweepRatio;
    this.facingAngle = (degrees * Math.PI) / 180;
    return this.facingAngle;
  }
}
