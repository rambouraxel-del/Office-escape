/**
 * Contrat de données du jeu.
 *
 * Un niveau est une DONNÉE (`LevelDef`), pas du code : `LevelScene` en est
 * l'interpréteur. Ajouter un niveau = ajouter un fichier dans `src/levels/`.
 */

export interface Vec2 {
  x: number;
  y: number;
}

/** Rectangle défini par son CENTRE (cohérent avec les helpers Phaser utilisés). */
export interface RectDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ObstacleKind = 'wall' | 'desk' | 'pillar' | 'cabinet' | 'partition' | 'door' | 'restroom';

export interface ObstacleDef extends RectDef {
  kind: ObstacleKind;
  /** Étiquette dessinée au centre (ARCHIVES, WC…). */
  label?: string;
  /** Un obstacle non bloquant visuellement reste traversable par la vision. */
  transparent?: boolean;
  /** Porte verrouillée : l'objet requis pour l'ouvrir. */
  lock?: ItemId;
  id?: string;
}

/** Matières de sol nommées, pour les zones de décor. */
export type ZoneMaterial = 'start' | 'exit' | 'alcove' | 'neutral' | 'exec' | 'bay';

/**
 * Identité visuelle d'un niveau. Elle choisit le jeu de matières et le sol,
 * sans qu'aucun niveau n'ait à citer un nom de fichier.
 */
export type LevelTheme = 'office' | 'exec' | 'parking';

/** Tons disponibles pour une étiquette posée dans un niveau. */
export type TextTone = 'zone' | 'quiet' | 'warm' | 'cool';

/** Accessoires posés librement dans le niveau. */
export type PropKind =
  | 'plant'
  | 'cactus'
  | 'toilet'
  | 'sink'
  | 'stall'
  | 'chair'
  | 'exitSign'
  | 'trash'
  | 'cooler'
  | 'printer'
  | 'boxes'
  | 'books'
  | 'phone'
  | 'lamp'
  | 'keyboard'
  | 'sticky'
  | 'screen'
  | 'armchair'
  | 'frame'
  | 'award'
  | 'vase'
  | 'machine'
  | 'cone'
  | 'barrier'
  | 'extinguisher'
  | 'bike'
  | 'cart'
  | 'crate'
  | 'tire'
  | 'parkingSign'
  | 'neon';

/** Décor purement cosmétique, sans collision ni occlusion. */
export interface DecorDef {
  kind: 'plant' | 'zone' | 'text' | 'deskProps' | 'prop';
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  /** Zones : matière de sol. À défaut, `neutral`. */
  material?: ZoneMaterial;
  /** `prop` : quel accessoire poser. */
  prop?: PropKind;
  /** `text` : ton de lecture. Jamais une valeur hexadécimale. */
  tone?: TextTone;
  size?: number;
  side?: -1 | 1;
}

export type NpcArchetype = 'colleague' | 'boss' | 'intern' | 'guard' | 'camera';

/**
 * Balayage d'une caméra.
 *
 * Vitesse constante entre `from` et `to`, puis ARRÊT de `holdMs` à chaque
 * extrémité avant de repartir en sens inverse. C'est la pause qui rend la
 * caméra jouable : elle offre une fenêtre qu'on peut attendre et compter.
 */
export interface SweepDef {
  /** Angles extrêmes, en degrés (0 = vers la droite, 90 = vers le bas). */
  from: number;
  to: number;
  /** Vitesse de rotation. À défaut, `CAMERA_SWEEP_DEG_PER_SECOND`. */
  degPerSecond?: number;
  /** Temps d'arrêt à chaque extrémité. À défaut, `CAMERA_HOLD_MS`. */
  holdMs?: number;
}

export interface NpcDef {
  id: string;
  label: string;
  archetype: NpcArchetype;
  /** Trajet cyclique. Un seul point = PNJ statique. */
  patrol: Vec2[];
  /**
   * Zone de déplacement AUTORISÉE. Le PNJ décale ses points de ronde au
   * hasard à l'intérieur, ce qui l'empêche de repasser exactement au même
   * endroit sans le rendre imprévisible. Absent = ronde stricte.
   */
  roam?: RectDef;
  /** Caméras / vigies : balayage angulaire au lieu d'un déplacement. */
  sweep?: SweepDef;
  patrolSpeed?: number;
  chaseSpeed?: number;
  visionRange?: number;
  visionHalfAngleDeg?: number;
}

export type ItemId = 'donut' | 'coffee' | 'badge' | 'report';

export interface ItemSpawnDef {
  id: ItemId;
  at: Vec2;
}

export interface HidingSpotDef {
  id: string;
  door: Vec2;
  exit: Vec2;
  label: string;
}

export interface TutorialDef {
  id: string;
  text: string;
  anchor: Vec2 | 'player';
  /**
   * La bulle s'efface dès que le joueur s'est déplacé. À défaut, vrai pour
   * une bulle ancrée au joueur — elle parle forcément de déplacement.
   */
  dismissOnMove?: boolean;
  /** Toutes les conditions renseignées doivent être vraies simultanément. */
  when: {
    after?: string;
    movedFromSpawn?: number;
    hasRun?: boolean;
    nearPoint?: { at: Vec2; radius: number };
    beyondY?: number;
    itemPending?: ItemId;
    hasItem?: ItemId;
  };
}

export interface DialogueChoiceDef {
  id: string;
  title: string;
  detail: string;
  /** Objet consommé et exigé pour activer le choix. */
  requiresItem?: ItemId;
  successChance: number;
  /** Minutes ajoutées en cas d'échec. */
  penaltyMinutes: number;
  /** Minutes ajoutées en cas de succès (négatif = temps gagné). */
  rewardMinutes: number;
  successText: string;
  failureText: string;
}

export interface DialogueDef {
  id: string;
  speaker: string;
  speakerAfter: string;
  heading: string;
  body: string;
  choices: DialogueChoiceDef[];
}

export type TriggerKind = 'dialogue' | 'exit';

export interface TriggerDef {
  id: string;
  kind: TriggerKind;
  zone: RectDef;
  /** `dialogue` : identifiant du dialogue. */
  payload?: string;
  /** Ne se déclenche qu'une fois tous les dialogues résolus. */
  requiresDialoguesResolved?: boolean;
}

/** Source lumineuse fixe, purement décorative. */
export interface LightDef {
  x: number;
  y: number;
  /** Rayon éclairé, en unités de monde. */
  radius: number;
  /** 0…1. Au-delà de 0,5 la lumière écrase le décor. */
  intensity?: number;
}

export interface AmbientDef {
  /**
   * 0 = plein jour, 1 = nuit noire. Assombrit le DÉCOR, qui doit rester
   * lisible : on continue de voir où l'on met les pieds.
   */
  darkness?: number;
  /**
   * Rayon, en unités de monde, dans lequel la lampe du joueur RÉVÈLE les
   * éléments de jeu — PNJ, objets, indices d'interaction. Au-delà, ils
   * s'effacent. Absent = tout reste visible.
   */
  revealRadius?: number;
  /** Opacité des éléments de jeu hors du halo. 0 = invisibles. */
  hiddenAlpha?: number;
  /**
   * Lampes fixes. Purement visuelles : la détection ne les consulte JAMAIS.
   * Une lumière qui changerait la visibilité serait une mécanique, pas un rendu.
   */
  lights?: LightDef[];
}

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  briefing: string;
  size: { w: number; h: number };
  spawn: Vec2;
  /** Identité visuelle. À défaut, le bureau classique du niveau 1. */
  theme?: LevelTheme;
  ambient?: AmbientDef;
  obstacles: ObstacleDef[];
  decor: DecorDef[];
  npcs: NpcDef[];
  items: ItemSpawnDef[];
  hidingSpots: HidingSpotDef[];
  triggers: TriggerDef[];
  dialogues: DialogueDef[];
  tutorials: TutorialDef[];
  clock: { startHour: number; startMinute: number; msPerMinute: number; failAtHour: number };
  /** Seuils en minutes de jeu écoulées pour 3, 2 et 1 étoile. */
  stars: [number, number, number];
}
