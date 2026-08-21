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

export type ObstacleKind = 'wall' | 'desk' | 'pillar' | 'cabinet' | 'partition' | 'door';

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

/** Décor purement cosmétique, sans collision ni occlusion. */
export interface DecorDef {
  kind: 'plant' | 'zone' | 'text' | 'deskProps';
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  color?: number;
  size?: number;
  scale?: number;
  side?: -1 | 1;
}

export type NpcArchetype = 'colleague' | 'boss' | 'intern' | 'guard' | 'camera';

export interface NpcDef {
  id: string;
  label: string;
  archetype: NpcArchetype;
  /** Trajet cyclique. Un seul point = PNJ statique. */
  patrol: Vec2[];
  /** Caméras / vigies : balayage angulaire (degrés) au lieu d'un déplacement. */
  sweep?: { from: number; to: number; periodMs: number };
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
  color: number;
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

export interface AmbientDef {
  /** 0 = plein jour, 1 = nuit noire. Le joueur porte alors une source de lumière. */
  darkness?: number;
  floor?: number;
  floorAlt?: number;
  tint?: number;
}

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  briefing: string;
  size: { w: number; h: number };
  spawn: Vec2;
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
