import type { ItemId, TutorialDef, Vec2 } from '../game/types';

/** Instantané du monde consulté par les conditions de tutoriel. */
export interface TutorialContext {
  player: Vec2;
  spawn: Vec2;
  hasRun: boolean;
  pendingItems: readonly ItemId[];
  heldItems: readonly ItemId[];
}

/**
 * Pilote les bulles d'aide à partir des `TutorialDef` du niveau.
 *
 * La chaîne de `if` imbriqués de la V0.7 devient une table de conditions :
 * chaque niveau déclare ses propres tutoriels, dans son propre fichier.
 */
export class TutorialDirector {
  private dismissed = new Set<string>();
  private currentId: string | null = null;

  constructor(
    private readonly tutorials: readonly TutorialDef[],
    private readonly disabled: boolean
  ) {}

  get current(): string | null {
    return this.currentId;
  }

  get allDismissed(): boolean {
    return this.tutorials.every((tutorial) => this.dismissed.has(tutorial.id));
  }

  /** Renvoie le tutoriel à afficher maintenant, ou `null`. */
  pick(context: TutorialContext): TutorialDef | null {
    if (this.disabled || this.currentId !== null) return null;

    const next = this.tutorials.find(
      (tutorial) => !this.dismissed.has(tutorial.id) && this.matches(tutorial, context)
    );
    if (!next) return null;
    this.currentId = next.id;
    return next;
  }

  dismiss(): string | null {
    const id = this.currentId;
    if (id) this.dismissed.add(id);
    this.currentId = null;
    return id;
  }

  /** Ferme la bulle courante seulement si elle porte cet identifiant. */
  dismissIf(id: string): boolean {
    if (this.currentId !== id) return false;
    this.dismiss();
    return true;
  }

  private matches(tutorial: TutorialDef, context: TutorialContext): boolean {
    const { when } = tutorial;

    if (when.after && !this.dismissed.has(when.after)) return false;
    if (when.hasRun && !context.hasRun) return false;
    if (when.itemPending && !context.pendingItems.includes(when.itemPending)) return false;
    if (when.hasItem && !context.heldItems.includes(when.hasItem)) return false;
    if (when.beyondY !== undefined && context.player.y > when.beyondY) return false;

    if (when.movedFromSpawn !== undefined) {
      const distance = Math.hypot(context.player.x - context.spawn.x, context.player.y - context.spawn.y);
      if (distance < when.movedFromSpawn) return false;
    }

    if (when.nearPoint) {
      const distance = Math.hypot(
        context.player.x - when.nearPoint.at.x,
        context.player.y - when.nearPoint.at.y
      );
      if (distance > when.nearPoint.radius) return false;
    }

    return true;
  }
}
