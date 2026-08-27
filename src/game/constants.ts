/**
 * Réglages de game feel. Aucune logique ici : uniquement des nombres que l'on
 * peut modifier sans lire le reste du code.
 */
import { PALETTE } from './palette';

export const VIEW_WIDTH = 390;
export const VIEW_HEIGHT = 844;

export const WALK_SPEED = 175;
export const RUN_SPEED = 290;
export const COFFEE_WALK_MULTIPLIER = 1.28;
export const COFFEE_RUN_MULTIPLIER = 1.18;
export const COFFEE_DURATION_MS = 15000;

export const JOYSTICK_RADIUS = 58;
export const JOYSTICK_MARGIN_X = 96;
export const JOYSTICK_Y = 736;
export const RUN_BUTTON_Y = 728;
export const CONTROL_MARGIN_X = 66;

export const PLAYER_RADIUS = 18;
export const NPC_RADIUS = 17;

export const DEFAULT_PATROL_SPEED = 82;
export const DEFAULT_CHASE_SPEED = 116;

/**
 * Réglage des cônes de vision (V0.10.1).
 *
 * Le marché : **plus étroit et plus court, mais franchement plus mordant.**
 * Les cônes de la V0.9 couvraient la moitié du couloir et se traversaient
 * pourtant sans conséquence — on les subissait sans jamais les jouer.
 * Désormais on les contourne facilement, et les traverser coûte cher.
 *
 * Ces cinq nombres sont le seul endroit à toucher pour réviser l'équilibrage.
 * Un `NpcDef` peut affiner par PNJ (`visionRange`, `visionHalfAngleDeg`).
 */
export const DEFAULT_VISION_RANGE = 230;
export const DEFAULT_VISION_HALF_ANGLE_DEG = 22;

/** Courir agrandit le cône et remplit la jauge plus vite. */
export const RUN_VISION_MULTIPLIER = 1.3;
export const RUN_DETECTION_MULTIPLIER = 4 / 3;

/** Secondes passées dans le cône avant l'alerte, puis avant l'interception. */
export const DETECTION_ALERT_SECONDS = 1.1;
export const DETECTION_INTERCEPT_SECONDS = 2.4;
/** Vitesse de retombée de la jauge une fois hors du cône. */
export const DETECTION_DECAY_PER_SECOND = 1.4;

/**
 * Vitesse de REMPLISSAGE de la jauge (V0.10.3).
 *
 * On multiplie la cadence plutôt que de raboter les deux seuils : les
 * durées ci-dessus restent lisibles en secondes, et « une caméra mord 60 %
 * plus vite qu'un humain » se lit d'une ligne.
 *
 * Une caméra ne se contourne pas au feeling : elle a un angle affiché, un
 * balayage régulier et un arrêt en bout de course. On sait donc exactement
 * quand passer — et si l'on se trompe, cela doit coûter.
 */
export const NPC_DETECTION_RATE = 1.1;
export const CAMERA_DETECTION_RATE = 1.6;

/** Le PNJ va fouiller la dernière position connue avant de repartir en ronde. */
export const SEARCH_SECONDS = 4;
export const SEARCH_ARRIVAL_RADIUS = 26;
/**
 * Rondes (V0.10.3).
 *
 * Retour à un circuit PRÉDÉFINI : un PNJ enchaîne les points déclarés dans la
 * donnée du niveau, en ligne droite, dans l'ordre. La V0.10.1 tirait chaque
 * destination au hasard dans une zone ; c'était vivant et illisible, et un jeu
 * d'infiltration se joue sur ce qu'on peut APPRENDRE.
 *
 * Ce qui varie, et rien d'autre — tiré une seule fois par PNJ, au `Prng` du
 * niveau, donc le Défi du jour reste reproductible :
 *  - le sens de départ du circuit ;
 *  - la durée de la pause à chaque point ;
 *  - la vitesse, à quelques pour cent près.
 */
export const PATROL_PAUSE_SECONDS = 0.9;
export const PATROL_PAUSE_VARIATION = 0.45;
export const PATROL_SPEED_VARIATION = 0.08;

/**
 * Filet anti-blocage. Un PNJ qui n'a pas parcouru `STUCK_DISTANCE` en
 * `STUCK_SECONDS` alors qu'il voulait avancer recalcule son chemin.
 *
 * Le pathfinding ne suffit pas : deux PNJ qui se croisent dans une porte se
 * poussent mutuellement hors de leur trajectoire, et aucun des deux n'est
 * « contre un mur » au sens de la grille.
 */
export const STUCK_SECONDS = 1.2;
export const STUCK_DISTANCE = 14;

/** Recalcul de trajectoire pendant une poursuite, en secondes. */
export const CHASE_REPATH_SECONDS = 0.45;

/**
 * Caméras de surveillance (V0.10.1).
 *
 * Une caméra balaie à vitesse constante, s'arrête à chaque extrémité, puis
 * repart. C'est cette PAUSE qui rend la caméra jouable : elle donne la fenêtre
 * qu'on attend, au lieu d'un va-et-vient qu'on subit.
 */
export const CAMERA_SWEEP_DEG_PER_SECOND = 26;
export const CAMERA_HOLD_MS = 1600;

/** Une distraction (rapport lâché) attire les PNJ dans ce rayon. */
export const DISTRACTION_RADIUS = 300;
export const DISTRACTION_SECONDS = 6;

export const INTERACTION_RADIUS = 76;
export const INVENTORY_SLOTS = 2;

/**
 * Position des poches dans le HUD. Partagée entre `UiScene`, qui les dessine,
 * et `LevelScene`, qui y envoie l'objet ramassé : deux valeurs séparées se
 * seraient désynchronisées au premier ajustement de maquette.
 */
export const POCKET_SLOT_X = 44;
export const POCKET_SLOT_Y = 82;
export const POCKET_SLOT_STEP = 44;

/** Bandeau unique du HUD : centre vertical et hauteur. */
export const HUD_Y = 58;
export const HUD_HEIGHT = 112;

/** Message contextuel : au-dessus des commandes, jamais au milieu du terrain. */
export const TOAST_Y = 620;

/**
 * Bulles de tutoriel (V0.10.1).
 *
 * Elles se ferment de trois façons : au toucher, dès que le joueur avance
 * vraiment, ou toutes seules. Une consigne qui reste à l'écran finit par
 * cacher le terrain qu'elle explique.
 */
export const TUTORIAL_AUTO_DISMISS_MS = 6500;
/** Largeur d'habillage du texte, en pixels d'écran. Le panneau s'y adapte. */
export const TUTORIAL_TEXT_WIDTH = 224;
export const TUTORIAL_PADDING = 16;
export const TUTORIAL_MARGIN = 24;
/** Marge tactile autour de la bulle : on doit pouvoir la fermer au pouce. */
export const TUTORIAL_TOUCH_MARGIN = 14;
/** Distance parcourue après l'apparition qui referme une bulle de mouvement. */
export const TUTORIAL_MOVE_DISMISS = 110;

/**
 * Cadence de l'horloge de jeu : millisecondes réelles pour une minute de
 * bureau (V0.10.3, 1,75× plus rapide qu'en V0.10.2, où il fallait 5 000 ms).
 *
 * Un `LevelDef` peut l'écraser, mais aucun ne le fait : la pression du temps
 * est une constante du jeu, pas une propriété d'étage. Les seuils d'étoiles et
 * l'heure fatidique restent comptés en minutes de JEU — ils n'ont pas bougé,
 * c'est le temps réel disponible qui se resserre.
 */
export const MS_PER_GAME_MINUTE = 2857;

/**
 * Lampe torche du joueur (V0.10.3).
 *
 * Le halo circulaire de la V0.10.1 révélait tout autour de soi : on voyait
 * arriver ce qu'on n'avait aucune raison de voir. Un faisceau oriente
 * l'attention et fait du simple fait de REGARDER une décision.
 */
export const TORCH_LERP = 0.22;
/** Opacité additive du faisceau et de la flaque au sol. */
export const TORCH_BEAM_ALPHA = 0.62;
export const TORCH_SPILL_ALPHA = 0.4;

/**
 * Ouverture de l'accueil (V0.10.2).
 *
 * On laisse la pièce vivre seule le temps de la remarquer, puis l'interface
 * monte par vagues. Court : au-delà d'une seconde, une introduction cesse
 * d'être une intention et devient une latence — surtout au deuxième lancement.
 */
export const MENU_INTRO_HOLD_MS = 700;
export const MENU_INTRO_STEP_MS = 110;
export const MENU_INTRO_FADE_MS = 320;

/** Durée du sursaut d'un PNJ qui vient de repérer le joueur. */
export const REACT_MS = 520;

/**
 * Temps laissé à l'effet de fin AVANT de basculer sur l'écran de résultat.
 * Purement visuel : l'horloge est déjà figée quand ces délais démarrent.
 */
export const EXIT_FLOURISH_MS = 560;
export const INTERCEPT_FLOURISH_MS = 320;

/** Pénalité anti-exploit : la pause manuelle gèle l'horloge mais se paie. */
export const MANUAL_PAUSE_PENALTY_MINUTES = 1;

/** Échantillonnage du fantôme (record précédent rejoué). */
export const GHOST_SAMPLE_MS = 100;
export const GHOST_MAX_SAMPLES = 3000;

export const VISION_SEGMENTS = 30;

/**
 * Les rares couleurs que le CODE DE JEU manipule directement — le fond de
 * caméra, les cônes de vision, le fantôme. Tout le reste de l'habillage passe
 * par `artTheme.ts` ; ce qui figure ici n'est pas de la décoration, c'est de
 * l'information de gameplay.
 */
export const COLORS = {
  background: PALETTE.floorDark,
  /** Vigilance, fouille, poursuite : les trois états d'un cône. */
  coneCalm: PALETTE.gold,
  coneSearch: PALETTE.goldDark,
  coneAlert: PALETTE.alert,
  /** Record précédent rejoué, volontairement fantomatique. */
  ghost: PALETTE.tealLight
} as const;

/**
 * Ordre de dessin.
 *
 * Le voile de nuit (`darkness`) est posé JUSTE au-dessus du décor et
 * en dessous de tout ce qui relève du jeu : cônes, objets, personnages. Le
 * parking paraît donc sombre sans qu'on perde de vue les faisceaux ni ce
 * qu'on ramasse. C'est la lampe du joueur, pas le voile, qui décide de ce
 * qu'on distingue.
 */
export const DEPTH = {
  floor: 0,
  floorLabel: 1,
  obstacleShadow: 7,
  obstacle: 8,
  obstacleDetail: 9,
  deskProps: 10,
  obstacleLabel: 11,
  plant: 12,
  darkness: 13,
  light: 14,
  vision: 15,
  item: 16,
  ghost: 22,
  npc: 25,
  npcDetail: 27,
  player: 30,
  detection: 40,
  /**
   * Interface de l'accueil. Au-dessus du décor vivant : sans ça, un collègue
   * qui tape à la machine passe devant le panneau des réglages.
   */
  menuUi: 60,
  tutorial: 250
} as const;
