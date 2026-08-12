import Phaser from 'phaser';

export interface PointLike {
  x: number;
  y: number;
}

function rayRectangleDistance(
  origin: PointLike,
  direction: PointLike,
  rectangle: Phaser.Geom.Rectangle,
  maxDistance: number
) {
  let near = 0;
  let far = maxDistance;

  const axes = [
    { origin: origin.x, direction: direction.x, min: rectangle.left, max: rectangle.right },
    { origin: origin.y, direction: direction.y, min: rectangle.top, max: rectangle.bottom }
  ];

  for (const axis of axes) {
    if (Math.abs(axis.direction) < 0.00001) {
      if (axis.origin < axis.min || axis.origin > axis.max) return null;
      continue;
    }

    const first = (axis.min - axis.origin) / axis.direction;
    const second = (axis.max - axis.origin) / axis.direction;
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
  blockers: Phaser.Geom.Rectangle[]
) {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let nearest = maxDistance;

  for (const blocker of blockers) {
    const hit = rayRectangleDistance(origin, direction, blocker, maxDistance);
    if (hit !== null && hit < nearest) nearest = hit;
  }

  return nearest;
}

export function buildVisionPolygon(
  origin: PointLike,
  directionAngle: number,
  halfAngle: number,
  range: number,
  blockers: Phaser.Geom.Rectangle[],
  segments = 34
) {
  const points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(origin.x, origin.y)];

  for (let index = 0; index <= segments; index += 1) {
    const ratio = index / segments;
    const angle = directionAngle - halfAngle + ratio * halfAngle * 2;
    const distance = nearestObstacleDistance(origin, angle, range, blockers);
    points.push(new Phaser.Math.Vector2(
      origin.x + Math.cos(angle) * distance,
      origin.y + Math.sin(angle) * distance
    ));
  }

  return points;
}

export function isPointVisible(
  point: PointLike,
  origin: PointLike,
  directionAngle: number,
  halfAngle: number,
  range: number,
  blockers: Phaser.Geom.Rectangle[]
) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range || distance < 0.001) return false;

  const targetAngle = Math.atan2(dy, dx);
  const angleDifference = Phaser.Math.Angle.Wrap(targetAngle - directionAngle);
  if (Math.abs(angleDifference) > halfAngle) return false;

  const obstacleDistance = nearestObstacleDistance(origin, targetAngle, range, blockers);
  return obstacleDistance >= distance - 5;
}
