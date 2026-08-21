import { rectContains } from './geometry';
import type { LevelDef, ObstacleDef, Vec2 } from './types';

/**
 * Validation d'un `LevelDef`.
 *
 * Le prix d'un format data-driven, c'est qu'une faute de frappe devient une
 * partie injouable au lieu d'une erreur de compilation. Ce validateur est
 * exécuté par les tests sur chaque niveau livré, et en `dev` au chargement.
 */

export interface LevelIssue {
  level: string;
  severity: 'error' | 'warning';
  message: string;
}

function insideObstacle(point: Vec2, obstacles: ObstacleDef[], margin: number): ObstacleDef | undefined {
  return obstacles.find((obstacle) =>
    rectContains(
      { x: obstacle.x, y: obstacle.y, w: obstacle.w + margin * 2, h: obstacle.h + margin * 2 },
      point
    )
  );
}

function insideBounds(point: Vec2, level: LevelDef): boolean {
  return point.x >= 0 && point.x <= level.size.w && point.y >= 0 && point.y <= level.size.h;
}

export function validateLevel(level: LevelDef): LevelIssue[] {
  const issues: LevelIssue[] = [];
  const error = (message: string) => issues.push({ level: level.id, severity: 'error', message });
  const warn = (message: string) => issues.push({ level: level.id, severity: 'warning', message });

  // Les portes verrouillées sont franchissables : on les ignore pour les points de passage.
  const solids = level.obstacles.filter((obstacle) => obstacle.kind !== 'door');

  if (!insideBounds(level.spawn, level)) error('Le point de départ est hors des limites du niveau.');
  if (insideObstacle(level.spawn, solids, 12)) error('Le point de départ est dans un obstacle.');

  const [gold, silver, bronze] = level.stars;
  if (!(gold < silver && silver < bronze)) {
    error(`Seuils d'étoiles non croissants : ${level.stars.join(' / ')}.`);
  }
  const budgetMinutes = (level.clock.failAtHour - level.clock.startHour) * 60 - level.clock.startMinute;
  if (bronze >= budgetMinutes) {
    error(`Le seuil 1 étoile (${bronze} min) dépasse le temps disponible (${budgetMinutes} min).`);
  }

  const npcIds = new Set<string>();
  level.npcs.forEach((npc) => {
    if (npcIds.has(npc.id)) error(`Identifiant de PNJ dupliqué : ${npc.id}.`);
    npcIds.add(npc.id);

    if (npc.patrol.length === 0) {
      error(`Le PNJ ${npc.id} n'a aucun point de ronde.`);
      return;
    }
    if (npc.patrol.length === 1 && !npc.sweep && npc.archetype !== 'camera') {
      warn(`Le PNJ ${npc.id} est immobile et sans balayage.`);
    }
    npc.patrol.forEach((point, index) => {
      if (!insideBounds(point, level)) {
        error(`Point de ronde ${index} du PNJ ${npc.id} hors limites.`);
      }
      const blocking = insideObstacle(point, solids, 4);
      if (blocking) {
        error(`Point de ronde ${index} du PNJ ${npc.id} coincé dans un obstacle (${blocking.kind}).`);
      }
    });
  });

  const itemIds = new Set<string>();
  level.items.forEach((item) => {
    if (itemIds.has(item.id)) error(`Objet dupliqué dans le niveau : ${item.id}.`);
    itemIds.add(item.id);
    if (!insideBounds(item.at, level)) error(`L'objet ${item.id} est hors limites.`);
    if (insideObstacle(item.at, solids, 6)) error(`L'objet ${item.id} est inatteignable (dans un obstacle).`);
  });

  const lockedDoors = level.obstacles.filter((obstacle) => obstacle.lock);
  lockedDoors.forEach((door) => {
    if (!itemIds.has(door.lock!)) {
      error(`Porte verrouillée par « ${door.lock} » alors que cet objet n'existe pas dans le niveau.`);
    }
  });

  level.hidingSpots.forEach((spot) => {
    if (insideObstacle(spot.exit, solids, 4)) {
      error(`La sortie de la cachette ${spot.id} débouche dans un obstacle.`);
    }
  });

  const dialogueIds = new Set(level.dialogues.map((dialogue) => dialogue.id));
  let exitTriggers = 0;
  level.triggers.forEach((trigger) => {
    if (trigger.kind === 'exit') exitTriggers += 1;
    if (trigger.kind === 'dialogue') {
      if (!trigger.payload || !dialogueIds.has(trigger.payload)) {
        error(`Le déclencheur ${trigger.id} référence un dialogue inconnu (${trigger.payload}).`);
      }
    }
  });
  if (exitTriggers === 0) error('Aucun déclencheur de sortie : le niveau est infinissable.');
  if (exitTriggers > 1) warn('Plusieurs déclencheurs de sortie.');

  level.dialogues.forEach((dialogue) => {
    if (dialogue.choices.length === 0) error(`Le dialogue ${dialogue.id} n'offre aucun choix.`);
    const alwaysAvailable = dialogue.choices.filter((choice) => !choice.requiresItem);
    if (alwaysAvailable.length === 0) {
      error(`Le dialogue ${dialogue.id} peut devenir une impasse : tous les choix exigent un objet.`);
    }
    dialogue.choices.forEach((choice) => {
      if (choice.successChance < 0 || choice.successChance > 1) {
        error(`Probabilité invalide pour ${dialogue.id}/${choice.id}.`);
      }
    });

    // Un choix strictement dominé (pire coût moyen ET sans gain possible) n'est
    // jamais pris par un joueur qui compte : c'est un tiers d'écran mort.
    const cost = (choiceIndex: number) => {
      const choice = dialogue.choices[choiceIndex];
      return (1 - choice.successChance) * choice.penaltyMinutes + choice.successChance * choice.rewardMinutes;
    };
    alwaysAvailable.forEach((choice) => {
      const index = dialogue.choices.indexOf(choice);
      const dominated = alwaysAvailable.some((other) => {
        const otherIndex = dialogue.choices.indexOf(other);
        if (otherIndex === index) return false;
        const noUpside = choice.rewardMinutes >= other.rewardMinutes;
        return cost(otherIndex) < cost(index) && noUpside;
      });
      if (dominated) {
        warn(
          `Choix strictement dominé : ${dialogue.id}/${choice.id} (aucun joueur rationnel ne le prendra).`
        );
      }
    });
  });

  const tutorialIds = new Set<string>();
  level.tutorials.forEach((tutorial) => {
    if (tutorialIds.has(tutorial.id)) error(`Tutoriel dupliqué : ${tutorial.id}.`);
    tutorialIds.add(tutorial.id);
  });
  level.tutorials.forEach((tutorial) => {
    if (tutorial.when.after && !tutorialIds.has(tutorial.when.after)) {
      error(`Le tutoriel ${tutorial.id} dépend d'un tutoriel inconnu (${tutorial.when.after}).`);
    }
  });

  return issues;
}

export function assertLevelValid(level: LevelDef): void {
  const errors = validateLevel(level).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(`Niveau ${level.id} invalide :\n- ${errors.map((issue) => issue.message).join('\n- ')}`);
  }
}
