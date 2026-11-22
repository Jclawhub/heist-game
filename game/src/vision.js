// Sight math: whether a watcher (guard or camera) can see the thief.
// A watcher sees the thief only when the thief is inside its vision cone
// AND no solid rectangle stands between them.

export function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Shortest angular distance between two angles, in radians.
function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

// Is the target inside the watcher's cone (range + half-angle)?
export function insideCone(watcherX, watcherY, facing, range, halfAngle, targetX, targetY) {
  if (distance(watcherX, watcherY, targetX, targetY) > range) return false;
  return angleDifference(angleTo(watcherX, watcherY, targetX, targetY), facing) <= halfAngle;
}

// Does the segment from (x1,y1) to (x2,y2) cross the rectangle?
// Uses the slab test: the segment enters the rect only if the overlap of
// its x-range and y-range with the rect is non-empty.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const slabs = [
    { p: -dx, q: x1 - rect.x },
    { p: dx, q: rect.x + rect.width - x1 },
    { p: -dy, q: y1 - rect.y },
    { p: dy, q: rect.y + rect.height - y1 },
  ];
  for (const { p, q } of slabs) {
    if (p === 0) {
      if (q < 0) return false; // parallel and outside
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }
  return true;
}

// Is the line of sight between two points clear of every solid?
export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (const solid of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return false;
  }
  return true;
}

// The full detection test for one watcher.
export function watcherSeesThief(watcher, targetX, targetY, solids) {
  if (!insideCone(watcher.x, watcher.y, watcher.facing, watcher.range, watcher.halfAngle, targetX, targetY)) {
    return false;
  }
  return lineOfSightClear(watcher.x, watcher.y, targetX, targetY, solids);
}

// Distance from a point to a segment — used for the laser tripwires.
export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Circle (a walker) against a rectangle: true when they overlap.
export function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

// Push a circle out of a rectangle it overlaps (slide along the wall).
// Returns the corrected position.
export function resolveCircleRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius || distSq === 0) return { x: cx, y: cy };
  const dist = Math.sqrt(distSq);
  const push = radius - dist;
  return { x: cx + (dx / dist) * push, y: cy + (dy / dist) * push };
}
