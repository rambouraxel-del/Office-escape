/**
 * Raycast AABB pour les cônes de vision.
 *
 * Deux contraintes de perf, sur mobile, à 60 fps :
 *  - zéro allocation par frame (les tableaux de sortie sont réutilisés) ;
 *  - broad-phase : un obstacle hors de portée n'est jamais testé finement.
 */

export interface PointLike {
  x: number;
  y: number;
}

/** Obstacle précalculé : bornes + cercle englobant pour le rejet rapide. */
export interface Blocker {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  radius: number;
}

export function makeBlocker(centerX: number, centerY: number, width: number, height: number): Blocker {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY - halfHeight,
    bottom: centerY + halfHeight,
    cx: centerX,
    cy: centerY,
    radius: Math.hypot(halfWidth, halfHeight)
  };
}

/**
 * Sélectionne les obstacles susceptibles de couper un rayon partant de `origin`
 * dans un rayon de `range`. Écrit dans `out` et renvoie le nombre d'éléments.
 */
export function cullBlockers(
  origin: PointLike,
  range: number,
  blockers: readonly Blocker[],
  out: Blocker[]
): number {
  let count = 0;
  for (let index = 0; index < blockers.length; index += 1) {
    const blocker = blockers[index];
    const dx = blocker.cx - origin.x;
    const dy = blocker.cy - origin.y;
    const reach = range + blocker.radius;
    if (dx * dx + dy * dy <= reach * reach) {
      out[count] = blocker;
      count += 1;
    }
  }
  return count;
}

/** Distance à la première intersection rayon/AABB, ou `null`. Méthode des slabs. */
function rayBlockerDistance(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  blocker: Blocker,
  maxDistance: number
): number | null {
  let near = 0;
  let far = maxDistance;

  if (Math.abs(dirX) < 0.00001) {
    if (originX < blocker.left || originX > blocker.right) return null;
  } else {
    const first = (blocker.left - originX) / dirX;
    const second = (blocker.right - originX) / dirX;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }

  if (Math.abs(dirY) < 0.00001) {
    if (originY < blocker.top || originY > blocker.bottom) return null;
  } else {
    const first = (blocker.top - originY) / dirY;
    const second = (blocker.bottom - originY) / dirY;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }

  return near >= 0 && near <= maxDistance ? near : null;
}

export function nearestObstacleDistance(
  origin: PointLike,
  angle: number,
  maxDistance: number,
  blockers: readonly Blocker[],
  count = blockers.length
): number {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let nearest = maxDistance;

  for (let index = 0; index < count; index += 1) {
    const hit = rayBlockerDistance(origin.x, origin.y, dirX, dirY, blockers[index], nearest);
    if (hit !== null && hit < nearest) nearest = hit;
  }

  return nearest;
}

/**
 * Remplit `out` (réutilisé d'une frame à l'autre) avec les sommets du polygone
 * de vision : origine puis `segments + 1` points d'arc. Renvoie le nombre de
 * sommets écrits.
 */
export function buildVisionPolygon(
  origin: PointLike,
  directionAngle: number,
  halfAngle: number,
  range: number,
  blockers: readonly Blocker[],
  out: PointLike[],
  segments = 30,
  blockerCount = blockers.length
): number {
  if (!out[0]) out[0] = { x: 0, y: 0 };
  out[0].x = origin.x;
  out[0].y = origin.y;

  for (let index = 0; index <= segments; index += 1) {
    const angle = directionAngle - halfAngle + (index / segments) * halfAngle * 2;
    const distance = nearestObstacleDistance(origin, angle, range, blockers, blockerCount);
    const slot = index + 1;
    if (!out[slot]) out[slot] = { x: 0, y: 0 };
    out[slot].x = origin.x + Math.cos(angle) * distance;
    out[slot].y = origin.y + Math.sin(angle) * distance;
  }

  return segments + 2;
}

/** Ramène un angle dans ]-PI, PI]. */
export function wrapAngle(angle: number): number {
  let wrapped = angle % (Math.PI * 2);
  if (wrapped > Math.PI) wrapped -= Math.PI * 2;
  if (wrapped <= -Math.PI) wrapped += Math.PI * 2;
  return wrapped;
}

export function isPointVisible(
  point: PointLike,
  origin: PointLike,
  directionAngle: number,
  halfAngle: number,
  range: number,
  blockers: readonly Blocker[],
  blockerCount = blockers.length
): boolean {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range || distance < 0.001) return false;

  const targetAngle = Math.atan2(dy, dx);
  if (Math.abs(wrapAngle(targetAngle - directionAngle)) > halfAngle) return false;

  // Tolérance : la cible est un disque, pas un point mathématique.
  return nearestObstacleDistance(origin, targetAngle, range, blockers, blockerCount) >= distance - 5;
}

export function rectContains(
  rect: { x: number; y: number; w: number; h: number },
  point: PointLike
): boolean {
  return (
    point.x >= rect.x - rect.w / 2 &&
    point.x <= rect.x + rect.w / 2 &&
    point.y >= rect.y - rect.h / 2 &&
    point.y <= rect.y + rect.h / 2
  );
}
