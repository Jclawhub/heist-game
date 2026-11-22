// The museum guards: their patrols, their chases, and how a thrown decoy
// coin distracts them. A guard has three modes — patrol (walking its route),
// chase (it saw the thief and is hunting), and investigate (it heard a
// coin clink and went to look). Only a patrolling guard can be fooled.

import { GUARD, PLAYER } from './config.js';
import { watcherSeesThief, circleHitsRect, distance, angleTo } from './vision.js';
import { sounds } from './audio.js';

export function makeGuard(route) {
  const start = route.waypoints[0];
  return {
    x: start.x,
    y: start.y,
    waypoints: route.waypoints,
    targetIndex: 1,
    forward: true,
    speed: route.speed,
    facing: angleTo(start.x, start.y, route.waypoints[1].x, route.waypoints[1].y),
    alerted: false,
    chaseTime: 0,
    unseenTime: 0,
    mode: 'patrol', // patrol | chase | investigate (distracted by a coin)
    investigateX: 0,
    investigateY: 0,
    investigateTime: 0,
    range: GUARD.visionRange,
    halfAngle: GUARD.visionHalfAngle,
  };
}

// Walk one step along the patrol route (ping-pong between its ends).
function patrolStep(guard, dt) {
  const target = guard.waypoints[guard.targetIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = target.x;
    guard.y = target.y;
    if (guard.forward) {
      if (guard.targetIndex === guard.waypoints.length - 1) {
        guard.forward = false;
        guard.targetIndex -= 1;
      } else {
        guard.targetIndex += 1;
      }
    } else if (guard.targetIndex === 0) {
      guard.forward = true;
      guard.targetIndex += 1;
    } else {
      guard.targetIndex -= 1;
    }
    const next = guard.waypoints[guard.targetIndex];
    guard.facing = angleTo(guard.x, guard.y, next.x, next.y);
  } else {
    guard.x += (dx / dist) * step;
    guard.y += (dy / dist) * step;
    guard.facing = angleTo(0, 0, dx, dy);
  }
}

// Chase the thief while the guard can see them; give up after losing sight.
function chaseStep(guard, player, dt) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = GUARD.chaseSpeed * dt;
  if (dist > step) {
    guard.x += (dx / dist) * step;
    guard.y += (dy / dist) * step;
  }
  guard.facing = angleTo(guard.x, guard.y, player.x, player.y);
  // A guard that reaches the thief ends the heist on the spot.
  if (dist < GUARD.radius + PLAYER.radius + 2) return true;
  return false;
}

// Walk to a thrown coin and look around it. The guard is distracted while
// investigating: it does not spot the thief. It stops if a display case or
// pillar blocks its path, and gives up when its time runs out, walking back
// to the nearest waypoint to resume its patrol.
function investigateStep(guard, dt, solids) {
  guard.investigateTime -= dt;
  const dx = guard.investigateX - guard.x;
  const dy = guard.investigateY - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 24) {
    const step = guard.speed * dt;
    const nx = guard.x + (dx / dist) * Math.min(step, dist);
    const ny = guard.y + (dy / dist) * Math.min(step, dist);
    const blocked = solids.some((solid) => circleHitsRect(nx, ny, GUARD.radius, solid));
    if (!blocked) {
      guard.x = nx;
      guard.y = ny;
    }
    guard.facing = angleTo(guard.x, guard.y, guard.investigateX, guard.investigateY);
  } else {
    // Arrived: scan the room slowly, as if looking for who dropped it.
    guard.facing += dt * 1.6;
  }
  if (guard.investigateTime <= 0) {
    guard.mode = 'patrol';
    guard.alerted = false;
    // Resume the patrol from the nearest waypoint.
    let nearest = 0;
    let nearestDist = Infinity;
    guard.waypoints.forEach((point, index) => {
      const d = distance(guard.x, guard.y, point.x, point.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = index;
      }
    });
    guard.targetIndex = nearest;
    guard.forward = nearest === 0;
  }
}

// Send the nearest patrolling guard to investigate a coin that just landed.
// An alerted guard is too focused on the thief to be fooled.
export function distractNearestGuard(guards, coinX, coinY, attractRange, investigateSeconds) {
  let nearestGuard = null;
  let nearestDist = attractRange;
  for (const guard of guards) {
    if (guard.mode !== 'patrol') continue;
    const d = distance(guard.x, guard.y, coinX, coinY);
    if (d < nearestDist) {
      nearestDist = d;
      nearestGuard = guard;
    }
  }
  if (nearestGuard) {
    nearestGuard.mode = 'investigate';
    nearestGuard.alerted = false;
    nearestGuard.investigateX = coinX;
    nearestGuard.investigateY = coinY;
    nearestGuard.investigateTime = investigateSeconds;
  }
  return nearestGuard;
}

// Advance every guard one frame. Returns true if any guard sees the thief.
// A distracted guard never spots anyone; a chasing guard that loses sight
// for long enough gives up and goes back to its patrol.
export function updateGuards(state, dt, solids) {
  const player = state.player;
  let anySpot = false;
  for (const guard of state.guards) {
    if (guard.mode === 'investigate') {
      investigateStep(guard, dt, solids);
      continue;
    }
    const sees = watcherSeesThief(guard, player.x, player.y, solids);
    if (sees) {
      if (!guard.alerted) {
        guard.alerted = true;
        guard.mode = 'chase';
        state.spotFlash = 0.6;
        sounds.spotted();
      }
      guard.unseenTime = 0;
      guard.chaseTime += dt;
      anySpot = true;
      if (chaseStep(guard, player, dt)) {
        state.alarm = 100;
      }
    } else if (guard.mode === 'chase') {
      guard.unseenTime += dt;
      if (guard.unseenTime >= GUARD.loseSightSeconds) {
        guard.mode = 'patrol';
        guard.alerted = false;
        guard.chaseTime = 0;
      } else {
        // Keep pushing toward the last seen spot briefly, then give up.
        chaseStep(guard, player, dt * 0.4);
      }
    } else {
      patrolStep(guard, dt);
    }
  }
  return anySpot;
}
