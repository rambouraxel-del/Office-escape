import { INVENTORY_SLOTS } from '../game/constants';
import type { ItemId } from '../game/types';

export type PickupResult = 'ok' | 'full' | 'duplicate';

/**
 * Deux poches, pas une de plus. Logique pure : aucun objet Phaser ici, ce qui
 * la rend testable et réutilisable par l'UI comme par la scène.
 */
export class Inventory {
  private slots: (ItemId | null)[] = Array.from({ length: INVENTORY_SLOTS }, () => null);
  private collectedCount = 0;

  get items(): readonly (ItemId | null)[] {
    return this.slots;
  }

  get collected(): number {
    return this.collectedCount;
  }

  get isFull(): boolean {
    return this.slots.every((slot) => slot !== null);
  }

  has(item: ItemId): boolean {
    return this.slots.includes(item);
  }

  add(item: ItemId): PickupResult {
    if (this.has(item)) return 'duplicate';
    const free = this.slots.indexOf(null);
    if (free < 0) return 'full';
    this.slots[free] = item;
    this.collectedCount += 1;
    return 'ok';
  }

  remove(item: ItemId): boolean {
    const index = this.slots.indexOf(item);
    if (index < 0) return false;
    this.slots[index] = null;
    return true;
  }

  at(slot: number): ItemId | null {
    return this.slots[slot] ?? null;
  }

  clear(): void {
    this.slots = this.slots.map(() => null);
    this.collectedCount = 0;
  }
}
