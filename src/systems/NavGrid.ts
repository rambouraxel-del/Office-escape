import type { RectDef, Vec2 } from '../game/types';

/**
 * Grille de navigation d'un niveau.
 *
 * Pourquoi une grille et pas un navmesh : les niveaux font 500 × 2200 unités
 * et tous les obstacles sont des rectangles alignés. À 25 unités par cellule,
 * un niveau tient dans 1 760 cases — un parcours en largeur d'abord les
 * traverse toutes en moins d'une milliseconde, sans dépendance ni maillage à
 * maintenir. Un navmesh serait plus élégant et complètement disproportionné.
 *
 * Le module est PUR (aucun Phaser) : la navigation se teste sans navigateur,
 * comme le reste de `systems/`.
 */

/** Côté d'une cellule, en unités de monde. */
export const NAV_CELL = 25;

/**
 * Marge ajoutée autour de chaque obstacle, en unités de monde.
 *
 * C'est elle qui empêche un PNJ de raser un mur : son corps fait 17 unités de
 * rayon, on bloque donc les cellules qui le feraient frotter. Sans cette
 * marge, le chemin passe pile sur l'arête et le moteur physique met le PNJ en
 * butée — c'est exactement ce qui se produisait au niveau 3.
 */
export const NAV_CLEARANCE = 20;

/** Rayon d'arrivée sur un point de passage, en unités de monde. */
export const NAV_WAYPOINT_RADIUS = 18;

const UNVISITED = -1;

export class NavGrid {
  readonly cols: number;
  readonly rows: number;

  private readonly blocked: Uint8Array;
  /** Tampons du parcours, alloués une fois : la recherche n'alloue jamais. */
  private readonly cameFrom: Int32Array;
  private readonly queue: Int32Array;

  constructor(
    private readonly width: number,
    private readonly height: number,
    obstacles: readonly RectDef[],
    private readonly clearance = NAV_CLEARANCE,
    private readonly cell = NAV_CELL
  ) {
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    const size = this.cols * this.rows;
    this.blocked = new Uint8Array(size);
    this.cameFrom = new Int32Array(size);
    this.queue = new Int32Array(size);

    obstacles.forEach((obstacle) => this.block(obstacle, clearance));
  }

  private block(obstacle: RectDef, clearance: number): void {
    const left = obstacle.x - obstacle.w / 2 - clearance;
    const right = obstacle.x + obstacle.w / 2 + clearance;
    const top = obstacle.y - obstacle.h / 2 - clearance;
    const bottom = obstacle.y + obstacle.h / 2 + clearance;

    const firstCol = Math.max(0, Math.floor(left / this.cell));
    const lastCol = Math.min(this.cols - 1, Math.floor(right / this.cell));
    const firstRow = Math.max(0, Math.floor(top / this.cell));
    const lastRow = Math.min(this.rows - 1, Math.floor(bottom / this.cell));

    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let col = firstCol; col <= lastCol; col += 1) this.blocked[row * this.cols + col] = 1;
    }
  }

  /**
   * Recalcule la grille à partir des obstacles ENCORE solides — typiquement
   * après l'ouverture d'une porte.
   *
   * On repart de zéro plutôt que de « déboucher » le rectangle de la porte :
   * sa marge de dégagement est partagée avec le mur voisin, et la rouvrir à la
   * main laisserait soit un bouchon, soit un trou dans le mur. À 1 760
   * cellules et une poignée d'obstacles, le recalcul est instantané.
   */
  rebuild(obstacles: readonly RectDef[], clearance = this.clearance): void {
    this.blocked.fill(0);
    obstacles.forEach((obstacle) => this.block(obstacle, clearance));
  }

  private index(x: number, y: number): number {
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cell)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cell)));
    return row * this.cols + col;
  }

  private centreX(index: number): number {
    return ((index % this.cols) + 0.5) * this.cell;
  }

  private centreY(index: number): number {
    return (Math.floor(index / this.cols) + 0.5) * this.cell;
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x > this.width || y > this.height) return false;
    return this.blocked[this.index(x, y)] === 0;
  }

  /**
   * Cellule libre la plus proche, en spirale carrée.
   *
   * Indispensable : un PNJ peut naître dans la marge d'un obstacle, et une
   * destination tirée au hasard peut tomber dans un mur. Sans ce recalage, la
   * recherche partirait d'une case bloquée et échouerait toujours.
   */
  nearestWalkable(x: number, y: number, out: Vec2): Vec2 {
    if (this.isWalkable(x, y)) {
      out.x = x;
      out.y = y;
      return out;
    }

    const startIndex = this.index(x, y);
    const startCol = startIndex % this.cols;
    const startRow = Math.floor(startIndex / this.cols);

    for (let ring = 1; ring < Math.max(this.cols, this.rows); ring += 1) {
      for (let row = startRow - ring; row <= startRow + ring; row += 1) {
        for (let col = startCol - ring; col <= startCol + ring; col += 1) {
          // Seulement le contour de l'anneau : l'intérieur a déjà été vu.
          const onRing = Math.abs(row - startRow) === ring || Math.abs(col - startCol) === ring;
          if (!onRing || row < 0 || col < 0 || row >= this.rows || col >= this.cols) continue;
          const index = row * this.cols + col;
          if (this.blocked[index] === 1) continue;
          out.x = this.centreX(index);
          out.y = this.centreY(index);
          return out;
        }
      }
    }

    out.x = x;
    out.y = y;
    return out;
  }

  /**
   * Chemin de `from` à `to`, écrit dans `out` (réutilisé). Renvoie le nombre
   * de points de passage, sans le point de départ ; 0 si aucun chemin.
   *
   * Parcours en largeur d'abord, puis lissage : on supprime tout point de
   * passage que l'on peut sauter en ligne droite. Sans ce lissage, le PNJ
   * suivrait l'escalier de la grille et donnerait l'impression de tituber.
   */
  findPath(from: Vec2, to: Vec2, out: Vec2[]): number {
    const start = this.index(from.x, from.y);
    const goal = this.index(to.x, to.y);
    if (this.blocked[start] === 1 || this.blocked[goal] === 1) return 0;
    if (start === goal) return this.writePoint(out, 0, to.x, to.y);

    this.cameFrom.fill(UNVISITED);
    this.cameFrom[start] = start;

    let head = 0;
    let tail = 0;
    this.queue[tail] = start;
    tail += 1;
    let found = false;

    while (head < tail) {
      const current = this.queue[head];
      head += 1;
      if (current === goal) {
        found = true;
        break;
      }

      const col = current % this.cols;
      const row = Math.floor(current / this.cols);
      // Quatre voisins seulement : le lissage se charge des diagonales, et un
      // voisinage à huit laisserait couper les angles au ras des murs.
      if (col > 0 && this.open(current - 1)) {
        this.cameFrom[current - 1] = current;
        this.queue[tail] = current - 1;
        tail += 1;
      }
      if (col < this.cols - 1 && this.open(current + 1)) {
        this.cameFrom[current + 1] = current;
        this.queue[tail] = current + 1;
        tail += 1;
      }
      if (row > 0 && this.open(current - this.cols)) {
        this.cameFrom[current - this.cols] = current;
        this.queue[tail] = current - this.cols;
        tail += 1;
      }
      if (row < this.rows - 1 && this.open(current + this.cols)) {
        this.cameFrom[current + this.cols] = current;
        this.queue[tail] = current + this.cols;
        tail += 1;
      }
    }

    if (!found) return 0;

    // Remontée depuis l'arrivée, puis inversion en écrivant dans `out`.
    let length = 0;
    let node = goal;
    while (node !== start) {
      length += 1;
      node = this.cameFrom[node];
    }

    let count = length;
    node = goal;
    while (node !== start) {
      count -= 1;
      this.writePoint(out, count, this.centreX(node), this.centreY(node));
      node = this.cameFrom[node];
    }
    // Le dernier point de passage vise la destination exacte, pas le centre
    // de sa cellule : sinon un PNJ s'arrête toujours à 12 unités de sa cible.
    this.writePoint(out, length - 1, to.x, to.y);

    return this.smooth(from, out, length);
  }

  /** Cellule libre et pas encore atteinte. */
  private open(index: number): boolean {
    return this.blocked[index] === 0 && this.cameFrom[index] === UNVISITED;
  }

  private writePoint(out: Vec2[], slot: number, x: number, y: number): number {
    if (!out[slot]) out[slot] = { x: 0, y: 0 };
    out[slot].x = x;
    out[slot].y = y;
    return slot + 1;
  }

  /** Supprime les points de passage que l'on peut sauter en ligne droite. */
  private smooth(from: Vec2, path: Vec2[], length: number): number {
    let write = 0;
    let anchorX = from.x;
    let anchorY = from.y;
    let index = 0;

    while (index < length) {
      // On avance tant que la ligne droite reste dégagée, puis on garde le
      // dernier point atteignable.
      let furthest = index;
      for (let probe = index; probe < length; probe += 1) {
        if (!this.hasLineOfSight(anchorX, anchorY, path[probe].x, path[probe].y)) break;
        furthest = probe;
      }
      const keep = path[furthest];
      anchorX = keep.x;
      anchorY = keep.y;
      this.writePoint(path, write, keep.x, keep.y);
      write += 1;
      index = furthest + 1;
    }

    return write;
  }

  /** Vrai si le segment ne traverse aucune cellule bloquée. */
  hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const steps = Math.ceil(Math.hypot(dx, dy) / (this.cell * 0.5));
    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      if (!this.isWalkable(fromX + dx * ratio, fromY + dy * ratio)) return false;
    }
    return true;
  }
}
