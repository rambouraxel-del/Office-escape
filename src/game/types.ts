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

/**
 * Nature d'un obstacle. Elle ne décide QUE de son habillage : le rectangle de
 * collision, lui, est celui du niveau. Changer un `kind` rehabille une pièce
 * sans déplacer un mur d'une unité.
 */
export type ObstacleKind =
  | 'wall'
  | 'desk'
  | 'pillar'
  | 'cabinet'
  | 'partition'
  | 'door'
  | 'restroom'
  // ── V0.11 : de quoi nommer une pièce au lieu de la deviner.
  | 'bench'
  | 'meeting'
  | 'reception'
  | 'lockers'
  | 'glass'
  | 'server'
  | 'counter';

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
export type ZoneMaterial =
  | 'start'
  | 'exit'
  | 'alcove'
  | 'neutral'
  | 'exec'
  | 'bay'
  // ── V0.11 : une zone de sol suffit à dire de quelle pièce il s'agit.
  | 'lounge'
  | 'meeting'
  | 'hall'
  | 'kitchen'
  | 'tech'
  | 'outdoor'
  | 'parquet';

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
  | 'neon'
  // ── V0.11 : d'après les planches d'assets fournies.
  | 'sofa'
  | 'coffeeTable'
  | 'whiteboard'
  | 'corkboard'
  | 'coatRack'
  | 'wallClock'
  | 'mat'
  | 'server'
  | 'vending'
  | 'microwave'
  | 'fridge'
  | 'mop'
  | 'wetFloor'
  | 'recycling'
  | 'laptop'
  | 'reader'
  | 'turnstile'
  | 'railing'
  | 'urinal'
  | 'sinkCounter'
  | 'binder'
  | 'hazardTape'
  // ── V0.11.1 : accessoires fournis.
  | 'workstation'
  | 'monitor'
  | 'filebox'
  | 'stapler';

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

export type NpcArchetype =
  | 'colleague'
  | 'boss'
  | 'intern'
  | 'guard'
  | 'camera'
  // ── V0.11 : quatre rôles de plus. Purement visuel — un archétype choisit
  // une planche, jamais un comportement. La ronde, la vision et la détection
  // restent entièrement dans la donnée du PNJ.
  | 'hr'
  | 'tech'
  | 'receptionist'
  | 'janitor';

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
  /**
   * Circuit cyclique, parcouru point par point, en ligne droite et dans
   * l'ordre. Un seul point = PNJ statique. C'est la ronde que le joueur doit
   * pouvoir apprendre : deux points consécutifs doivent se voir sans obstacle,
   * un test le vérifie sur tous les niveaux livrés.
   */
  patrol: Vec2[];
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

/** Lampe torche du joueur. Sa présence allume la mécanique de nuit. */
export interface TorchDef {
  /** Portée du faisceau, en unités de monde. */
  range: number;
  /** Demi-ouverture du faisceau, en degrés. */
  halfAngleDeg: number;
  /** Rayon éclairé autour des pieds : on ne marche jamais totalement à l'aveugle. */
  spill: number;
}

export interface AmbientDef {
  /**
   * 0 = plein jour, 1 = nuit noire. Assombrit le DÉCOR, qui doit rester
   * lisible : on continue de voir où l'on met les pieds.
   */
  darkness?: number;
  /**
   * Faisceau du joueur. Présent, les éléments de JEU — PNJ, cônes de vision,
   * objets, indices — ne sont visibles que dans sa lumière ou dans celle des
   * lampes fixes. Absent, tout reste visible.
   */
  torch?: TorchDef;
  /** Opacité des éléments de jeu dans le noir. 0 = réellement invisibles. */
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
  /**
   * `msPerMinute` est optionnel : à défaut, `MS_PER_GAME_MINUTE`. La pression
   * du temps est une constante du jeu, pas une propriété d'étage — la mettre
   * dans chaque niveau, c'était trois copies du même nombre à tenir à jour.
   */
  clock: { startHour: number; startMinute: number; msPerMinute?: number; failAtHour: number };
  /** Seuils en minutes de jeu écoulées pour 3, 2 et 1 étoile. */
  stars: [number, number, number];
}
