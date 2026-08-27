import type { LightDef, TorchDef, Vec2 } from '../game/types';

/**
 * Ce que le joueur ÉCLAIRE, et donc ce qu'il voit.
 *
 * Module PUR (aucun Phaser) : la nuit du parking se teste sans navigateur,
 * comme le reste de `systems/`.
 *
 * Attention à ce que ce fichier n'est PAS : il ne dit rien sur ce que les PNJ
 * voient, eux. L'éclairage est du rendu, la détection est une règle — un
 * garde noyé dans le noir vous repère exactement comme en plein jour. Mélanger
 * les deux ferait de la lampe une mécanique, et ce n'est pas ce qu'on a
 * conçu : la lampe change ce que LE JOUEUR sait, pas ce que le niveau fait.
 */

/** Écart angulaire absolu entre deux angles, ramené dans [0, π]. */
export function angleDelta(a: number, b: number): number {
  let delta = (a - b) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Angle le plus court pour aller de `from` vers `to`, pondéré par `ratio`. */
export function approachAngle(from: number, to: number, ratio: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * clamp01(ratio);
}

export class Torch {
  private readonly halfAngle: number;

  constructor(
    private readonly def: TorchDef,
    /** Lampes fixes du niveau : elles éclairent aussi, en permanence. */
    private readonly lights: readonly LightDef[] = []
  ) {
    this.halfAngle = (def.halfAngleDeg * Math.PI) / 180;
  }

  /**
   * Quantité de lumière reçue par un point, dans [0, 1].
   *
   * Trois sources cumulées, on garde la plus forte :
   *  - la flaque autour des pieds du joueur, qui évite de marcher à l'aveugle ;
   *  - le faisceau, qui s'atténue avec la distance ET avec l'angle ;
   *  - les lampes fixes du niveau — un néon allumé révèle ce qu'il éclaire,
   *    ce qui fait des flaques de lumière autant de zones à surveiller.
   *
   * Les bords sont adoucis : une apparition franche clignoterait à chaque pas.
   */
  lightAt(at: Vec2, from: Vec2, facing: number): number {
    return Math.max(this.beamAt(at, from, facing), this.lampsAt(at));
  }

  private beamAt(at: Vec2, from: Vec2, facing: number): number {
    const dx = at.x - from.x;
    const dy = at.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= this.def.spill) return 1;
    if (distance > this.def.range) return 0;

    const delta = angleDelta(Math.atan2(dy, dx), facing);
    if (delta > this.halfAngle) return 0;

    const reach = clamp01((1 - (distance - this.def.spill) / (this.def.range - this.def.spill)) * 1.8);
    const aim = clamp01((1 - delta / this.halfAngle) * 2.4);
    return reach * aim;
  }

  private lampsAt(at: Vec2): number {
    let best = 0;
    for (let index = 0; index < this.lights.length; index += 1) {
      const lamp = this.lights[index];
      const distance = Math.hypot(at.x - lamp.x, at.y - lamp.y);
      if (distance >= lamp.radius) continue;
      best = Math.max(best, clamp01((1 - distance / lamp.radius) * 2.2));
    }
    return best;
  }
}
