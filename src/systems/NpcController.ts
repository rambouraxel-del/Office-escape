import {
  CAMERA_DETECTION_RATE,
  CAMERA_HOLD_MS,
  CAMERA_SWEEP_DEG_PER_SECOND,
  CHASE_REPATH_SECONDS,
  DETECTION_ALERT_SECONDS,
  DETECTION_DECAY_PER_SECOND,
  DETECTION_INTERCEPT_SECONDS,
  NPC_DETECTION_RATE,
  PATROL_PAUSE_SECONDS,
  PATROL_PAUSE_VARIATION,
  PATROL_SPEED_VARIATION,
  RUN_DETECTION_MULTIPLIER,
  SEARCH_ARRIVAL_RADIUS,
  SEARCH_SECONDS,
  STUCK_DISTANCE,
  STUCK_SECONDS
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
 * **La ronde est prédéfinie** (V0.10.3). Le PNJ enchaîne les points déclarés
 * dans la donnée du niveau, en ligne droite, dans l'ordre. La V0.10.1 tirait
 * chaque destination au hasard dans une zone : c'était vivant et illisible.
 * Un jeu d'infiltration se joue sur ce qu'on peut apprendre — si le circuit
 * n'est pas mémorisable, il ne reste que la chance.
 *
 * Ce qui varie tient en trois nombres, tirés UNE FOIS au `Prng` du niveau
 * (donc le Défi du jour reste reproductible) : le sens de départ, la durée des
 * pauses, la vitesse à quelques pour cent près.
 *
 * Trois comportements par-dessus :
 *  - `search` : on va fouiller la dernière position connue avant de repartir
 *    en ronde, ce qui rend la cachette tactique au lieu d'annulante ;
 *  - `distracted` : un rapport lâché déplace l'attention ;
 *  - `rejoin` : au retour, on rattrape le point de ronde le plus proche.
 *
 * La grille de navigation ne sert QUE dans ces trois cas — et en dernier
 * recours si un segment de ronde est barré. En ronde ordinaire, le PNJ va tout
 * droit : c'est ce qui rend sa trajectoire lisible.
 */
export class NpcController {
  state: NpcState = 'patrol';
  detectionSeconds = 0;
  alerted = false;

  private patrolIndex: number;
  /** Sens de parcours du circuit : +1 ou -1, tiré au départ. */
  private readonly patrolStep: number;
  /** Pause à chaque point, et vitesse de marche : propres à ce PNJ. */
  private readonly pauseSeconds: number;
  private readonly speedScale: number;
  /**
   * Vrai tant que le PNJ n'a pas retrouvé son circuit après un écart. C'est le
   * SEUL cas de ronde où l'on passe par la grille de navigation.
   */
  private rejoining = false;
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

  /** Filet anti-blocage : d'où l'on venait, et depuis combien de temps. */
  private readonly stuckFrom: Vec2 = { x: 0, y: 0 };
  private stuckTimer = 0;

  constructor(
    private readonly def: NpcDef,
    private readonly patrolSpeed: number,
    private readonly chaseSpeed: number,
    /** Décalage de phase initial, tiré de la seed : varie le Défi du jour. */
    phase = 0,
    /** Grille du niveau. Absente, le PNJ vise en ligne droite comme en V0.9. */
    private readonly nav: NavGrid | null = null,
    /**
     * Tirage du niveau, seedé. Il ne sert qu'à personnaliser ce PNJ au
     * démarrage — jamais à choisir une destination. Le Défi du jour reste donc
     * parfaitement reproductible, et la ronde parfaitement prévisible.
     */
    random: () => number = () => 0.5
  ) {
    this.patrolStep = random() < 0.5 ? -1 : 1;
    this.pauseSeconds = Math.max(
      0,
      PATROL_PAUSE_SECONDS + (random() * 2 - 1) * PATROL_PAUSE_VARIATION
    );
    this.speedScale = 1 + (random() * 2 - 1) * PATROL_SPEED_VARIATION;
    this.patrolIndex = def.patrol.length > 1 ? this.wrap(this.patrolStep) : 0;
    this.sweepRatio = phase % 1;
  }

  /** Indice de ronde ramené dans les bornes, quel que soit le sens. */
  private wrap(index: number): number {
    const length = this.def.patrol.length;
    return ((index % length) + length) % length;
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
      // Une caméra mord bien plus vite qu'un humain : elle ne cligne pas des
      // yeux, ne se retourne pas, et son balayage est affiché. On sait quand
      // passer — se tromper doit coûter.
      const rate = this.isCamera ? CAMERA_DETECTION_RATE : NPC_DETECTION_RATE;
      const multiplier = (playerRunning ? RUN_DETECTION_MULTIPLIER : 1) * rate;
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
    // En poursuite, tout le monde court à la même vitesse : la variation de
    // marche est un détail de vie, pas un handicap qu'on subirait à l'aveugle.
    this.intent.speed =
      this.pauseTimer > 0 ? 0 : this.state === 'chase' ? this.chaseSpeed : this.patrolSpeed * this.speedScale;

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

    const desired = this.desiredGoal(sense);

    // ── Ronde ordinaire : tout droit vers le point suivant.
    // C'est ce qui rend le circuit lisible. On ne bascule sur la grille que si
    // la voie est réellement barrée, ou si l'on revient d'un écart.
    if (this.state === 'patrol' && !this.rejoining && this.hasClearLine(sense.position, desired)) {
      this.clearPath();
      this.goal.x = desired.x;
      this.goal.y = desired.y;
      this.hasGoal = true;
      if (this.reached(sense.position, desired)) {
        this.arrive();
        return this.goal;
      }
      this.watchForStuck(deltaSeconds, sense.position);
      return this.goal;
    }

    this.repathTimer -= deltaSeconds;
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

    this.watchForStuck(deltaSeconds, sense.position);

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

  /** Vrai si l'on peut aller droit au but sans traverser quoi que ce soit. */
  private hasClearLine(from: Vec2, to: Vec2): boolean {
    if (!this.nav) return true;
    return this.nav.hasLineOfSight(from.x, from.y, to.x, to.y);
  }

  private reached(position: Vec2, target: Vec2): boolean {
    return Math.hypot(position.x - target.x, position.y - target.y) <= NAV_WAYPOINT_RADIUS;
  }

  /**
   * Filet anti-blocage.
   *
   * Le pathfinding ne suffit pas : deux PNJ qui se croisent dans une porte se
   * poussent hors de leur trajectoire, et aucun des deux n'est « contre un
   * mur » au sens de la grille. Si l'on voulait avancer et qu'on n'a pas
   * bougé, on jette le chemin et l'on passe par la grille — même en ronde.
   */
  private watchForStuck(deltaSeconds: number, position: Vec2): void {
    this.stuckTimer += deltaSeconds;
    if (this.stuckTimer < STUCK_SECONDS) return;

    const travelled = Math.hypot(position.x - this.stuckFrom.x, position.y - this.stuckFrom.y);
    this.stuckTimer = 0;
    this.stuckFrom.x = position.x;
    this.stuckFrom.y = position.y;
    if (travelled >= STUCK_DISTANCE) return;

    this.clearPath();
    // Le contournement vaut aussi pour une ronde : mieux vaut un détour
    // visible qu'un PNJ qui pousse un mur pendant toute la partie.
    if (this.state === 'patrol') this.rejoining = true;
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
    // Toucher un point de ronde, c'est avoir retrouvé le circuit.
    this.rejoining = false;
    this.patrolIndex = this.wrap(this.patrolIndex + this.patrolStep);
    this.pauseTimer = this.pauseSeconds;
    this.hasGoal = false;
  }

  /**
   * Destination visée par l'état courant, avant mise en chemin.
   *
   * En ronde, c'est le point déclaré dans le niveau — exactement lui, sans
   * décalage. C'est toute la différence avec la V0.10.1 : ce que le joueur
   * observe une fois reste vrai la fois suivante.
   */
  private desiredGoal(sense: NpcSense): Vec2 {
    if (this.state === 'chase') return sense.playerPosition;
    if (this.state === 'search' || this.state === 'distracted') return this.lastKnown;
    return this.def.patrol[this.patrolIndex] ?? sense.position;
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
      if (this.searchTimer <= 0) this.resumePatrol(sense.position);
      return;
    }

    if (sense.distraction) {
      this.state = 'distracted';
      this.lastKnown.x = sense.distraction.x;
      this.lastKnown.y = sense.distraction.y;
      return;
    }

    if (this.state === 'distracted') this.resumePatrol(sense.position);
  }

  /**
   * Retour en ronde après un écart.
   *
   * On repart du point de ronde le PLUS PROCHE, pas de celui qu'on visait
   * avant la poursuite : rebrousser tout le couloir pour revenir à un point
   * qu'on a déjà dépassé donne un PNJ qui a l'air perdu. Et tant qu'on n'a
   * pas rejoint le circuit, on passe par la grille : c'est le seul moment où
   * un PNJ est ailleurs que sur sa ligne.
   */
  private resumePatrol(position: Vec2): void {
    this.state = 'patrol';
    this.rejoining = this.def.patrol.length > 1;
    if (!this.rejoining) return;

    let best = 0;
    let bestDistance = Infinity;
    this.def.patrol.forEach((point, index) => {
      const distance = Math.hypot(point.x - position.x, point.y - position.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    // Si l'on se tient DÉJÀ sur ce point, on vise le suivant : se voir
    // ordonner de rejoindre l'endroit où l'on est ferait perdre une frame et,
    // pire, une pause de plus au même endroit.
    this.patrolIndex = bestDistance <= SEARCH_ARRIVAL_RADIUS ? this.wrap(best + this.patrolStep) : best;
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
