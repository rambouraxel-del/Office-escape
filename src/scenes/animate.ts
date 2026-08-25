import type Phaser from 'phaser';
import {
  FACING_FLIP,
  FACING_VIEW,
  characterAnimKey,
  facingFromVector,
  type CharacterState,
  type Facing
} from '../game/animations';

/**
 * Pilotage des animations, côté rendu.
 *
 * Deux règles qui expliquent la forme de ce fichier :
 *
 * 1. **L'état vit sur le sprite**, pas dans une table partagée. Phaser
 *    réutilise l'instance de scène : un `Map` de sprites survivrait d'une
 *    partie à l'autre et pointerait vers des objets détruits. Ce piège a déjà
 *    causé un crash réel.
 * 2. **On ne rejoue une animation que si elle change.** Appeler `play()` à
 *    chaque frame la redémarrerait indéfiniment sur sa première image.
 */

const FACING_KEY = 'facing';
const ANIM_KEY = 'anim';

/**
 * Applique l'état et l'orientation d'un personnage.
 * Sans animation déclarée pour cette texture (la caméra de surveillance, par
 * exemple), la fonction ne fait rien : aucune condition à écrire côté scène.
 */
export function playCharacter(
  sprite: Phaser.GameObjects.Sprite,
  texture: string,
  state: CharacterState,
  dx: number,
  dy: number
): void {
  const previous = (sprite.getData(FACING_KEY) as Facing | undefined) ?? 'down';
  const facing = facingFromVector(dx, dy, previous);
  if (facing !== previous) sprite.setData(FACING_KEY, facing);
  sprite.setFlipX(FACING_FLIP[facing]);

  const key = characterAnimKey(texture, state, FACING_VIEW[facing]);
  if (sprite.getData(ANIM_KEY) === key) return;
  sprite.setData(ANIM_KEY, key);
  if (!sprite.anims.animationManager.exists(key)) return;
  sprite.play(key);
}

/** Joue une animation en boucle, sans la redémarrer si elle tourne déjà. */
export function playLoop(sprite: Phaser.GameObjects.Sprite, key: string | null): void {
  if (sprite.getData(ANIM_KEY) === key) return;
  sprite.setData(ANIM_KEY, key);
  if (key === null) {
    sprite.stop();
    sprite.setVisible(false);
    return;
  }
  sprite.setVisible(true);
  sprite.play(key);
}
