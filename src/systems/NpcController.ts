import {
  DETECTION_ALERT_SECONDS,
  DETECTION_DECAY_PER_SECOND,
  DETECTION_INTERCEPT_SECONDS,
  RUN_DETECTION_MULTIPLIER,
  SEARCH_ARRIVAL_RADIUS,
  SEARCH_SECONDS,
  STUCK_SECONDS,
  STUCK_STRAFE_SECONDS
} from '../game/constants';
import type { NpcDef, Vec2 } from '../game/types';

export type NpcState = 'patrol' | 'chase' | 'search' | 'distracted';

/** Ce que le PNJ perçoit du monde à cette frame. */
export interface NpcSense {
  position: Vec2;
  playerVisible: boolean;
  playerPosition: Vec2;
  playerRunning: boolean;
  /** Le corps physique bute sur un obstacle. */
  blocked: boolean;
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

/**
 * Machine à états d'un PNJ, sans dépendance à Phaser.
 *
 * Ajoute deux comportements absents de la V0.7 :
 *  - `search` : on va fouiller la dernière position connue avant de repartir
 *    en ronde, ce qui rend la cachette tactique au lieu d'annulante ;
 *  - déblocage : un PNJ collé à un mur applique une poussée latérale, faute de
 *    navmesh.
 */
export class NpcController {
  state: NpcState = 'patrol';
  detectionSeconds = 0;
  alerted = false;

  private patrolIndex: number;
  private searchTimer = 0;
  private lastKnown: Vec2 = { x: 0, y: 0 };
  private stuckTimer = 0;
  private strafeTimer = 0;
  private strafeSign = 1;
  private sweepTime = 0;
  private facingAngle = Math.PI / 2;
  private readonly intent: NpcIntent = { target: { x: 0, y: 0 }, speed: 0, facing: 0 };

  constructor(
    private readonly def: NpcDef,
    private readonly patrolSpeed: number,
    private readonly chaseSpeed: number,
    /** Décalage de phase initial, tiré de la seed : varie le Défi du jour. */
    phase = 0
  ) {
    this.patrolIndex = def.patrol.length > 1 ? 1 : 0;
    this.sweepTime = phase * (def.sweep?.periodMs ?? 1);
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
    this.updateState(deltaSeconds, sense);
    this.updateStuck(deltaSeconds, sense);

    const target = this.resolveTarget(sense);
    this.intent.target.x = target.x;
    this.intent.target.y = target.y;
    this.intent.speed = this.state === 'chase' ? this.chaseSpeed : this.patrolSpeed;

    if (this.isCamera) {
      this.intent.speed = 0;
      this.intent.facing = this.cameraFacing(deltaSeconds, sense);
    } else {
      const dx = target.x - sense.position.x;
      const dy = target.y - sense.position.y;
      if (dx * dx + dy * dy > 1) this.facingAngle = Math.atan2(dy, dx);
      this.intent.facing = this.facingAngle;
    }

    return this.intent;
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

  private updateStuck(deltaSeconds: number, sense: NpcSense): void {
    if (this.strafeTimer > 0) {
      this.strafeTimer -= deltaSeconds;
      return;
    }

    if (sense.blocked && this.state !== 'patrol') {
      this.stuckTimer += deltaSeconds;
      if (this.stuckTimer >= STUCK_SECONDS) {
        this.stuckTimer = 0;
        this.strafeTimer = STUCK_STRAFE_SECONDS;
        this.strafeSign = -this.strafeSign;
      }
    } else {
      this.stuckTimer = 0;
    }
  }

  private resolveTarget(sense: NpcSense): Vec2 {
    let target: Vec2;

    if (this.state === 'chase') {
      target = sense.playerPosition;
    } else if (this.state === 'search' || this.state === 'distracted') {
      target = this.lastKnown;
    } else {
      target = this.def.patrol[this.patrolIndex] ?? sense.position;
      if (
        this.def.patrol.length > 1 &&
        Math.hypot(sense.position.x - target.x, sense.position.y - target.y) < 12
      ) {
        this.patrolIndex = (this.patrolIndex + 1) % this.def.patrol.length;
        target = this.def.patrol[this.patrolIndex];
      }
    }

    if (this.strafeTimer > 0) {
      // Contournement grossier : on vise perpendiculairement à la direction bloquée.
      const dx = target.x - sense.position.x;
      const dy = target.y - sense.position.y;
      const length = Math.hypot(dx, dy) || 1;
      return {
        x: sense.position.x + (-dy / length) * 120 * this.strafeSign,
        y: sense.position.y + (dx / length) * 120 * this.strafeSign
      };
    }

    return target;
  }

  private cameraFacing(deltaSeconds: number, sense: NpcSense): number {
    // Une caméra alertée cesse de balayer et suit sa cible.
    if (this.alerted && sense.playerVisible) {
      return Math.atan2(sense.playerPosition.y - sense.position.y, sense.playerPosition.x - sense.position.x);
    }

    const sweep = this.def.sweep;
    if (!sweep) return this.facingAngle;

    this.sweepTime = (this.sweepTime + deltaSeconds * 1000) % sweep.periodMs;
    const phase = this.sweepTime / sweep.periodMs;
    // Aller-retour en triangle : balayage régulier, sans à-coup aux extrémités.
    const ratio = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    const degrees = sweep.from + (sweep.to - sweep.from) * ratio;
    this.facingAngle = (degrees * Math.PI) / 180;
    return this.facingAngle;
  }
}
