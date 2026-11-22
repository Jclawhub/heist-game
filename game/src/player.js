// The thief: movement, grabbing the diamond, and throwing decoy coins.
// The thief moves with WASD or the arrow keys and slides along walls and
// display cases instead of sticking to them.

import { ROOM, PLAYER, LOOT, COIN } from './config.js';
import { moveDirection, wasPressed, takeMouseClick } from './input.js';
import { circleHitsRect, resolveCircleRect, distance } from './vision.js';
import { distractNearestGuard } from './guards.js';
import { sounds } from './audio.js';

export function movePlayer(state, dt, solids) {
  const dir = moveDirection();
  if (dir.x === 0 && dir.y === 0) return;
  const player = state.player;
  player.facing = Math.atan2(dir.y, dir.x);
  let nx = player.x + dir.x * PLAYER.speed * dt;
  let ny = player.y + dir.y * PLAYER.speed * dt;
  // Stay inside the gallery.
  nx = Math.max(ROOM.x + PLAYER.radius, Math.min(ROOM.x + ROOM.width - PLAYER.radius, nx));
  ny = Math.max(ROOM.y + PLAYER.radius, Math.min(ROOM.y + ROOM.height - PLAYER.radius, ny));
  // Slide along display cases and pillars instead of sticking to them.
  for (const solid of solids) {
    if (circleHitsRect(nx, ny, PLAYER.radius, solid)) {
      const fixed = resolveCircleRect(nx, ny, PLAYER.radius, solid);
      nx = fixed.x;
      ny = fixed.y;
    }
  }
  player.x = nx;
  player.y = ny;
}

// Take the diamond: press SPACE (or click near it) while close, or simply
// walk into it.
export function tryGrabLoot(state) {
  if (state.lootTaken) return;
  const player = state.player;
  const click = takeMouseClick();
  const nearEnough = distance(player.x, player.y, LOOT.x, LOOT.y) <= PLAYER.grabRange;
  const clickedLoot =
    click && distance(click.x, click.y, LOOT.x, LOOT.y) <= PLAYER.grabRange + 30;
  const pressedGrab = wasPressed(' ', 'Spacebar');
  const touching = distance(player.x, player.y, LOOT.x, LOOT.y) <= PLAYER.autoGrabRange;
  if ((nearEnough && (pressedGrab || clickedLoot)) || touching) {
    state.lootTaken = true;
    sounds.grab();
  }
}

// Throw a decoy coin in the direction the thief is facing. It costs one of
// the run's limited coins and lands on open floor, never inside a case or
// pillar. The nearest patrolling guard in earshot goes to investigate it.
export function tryThrowCoin(state, solids) {
  if (!wasPressed('e', 'E') || state.coinsLeft <= 0 || state.coin) return;
  const player = state.player;
  state.coinsLeft -= 1;
  let cx = player.x + Math.cos(player.facing) * COIN.throwDistance;
  let cy = player.y + Math.sin(player.facing) * COIN.throwDistance;
  cx = Math.max(ROOM.x + 16, Math.min(ROOM.x + ROOM.width - 16, cx));
  cy = Math.max(ROOM.y + 16, Math.min(ROOM.y + ROOM.height - 16, cy));
  // Never land inside a display case or pillar: slide out to open floor.
  for (const solid of solids) {
    if (circleHitsRect(cx, cy, 12, solid)) {
      const fixed = resolveCircleRect(cx, cy, 12, solid);
      cx = fixed.x;
      cy = fixed.y;
    }
  }
  state.coin = { x: cx, y: cy, ttl: COIN.investigateSeconds + 1 };
  sounds.coin();
  distractNearestGuard(state.guards, cx, cy, COIN.attractRange, COIN.investigateSeconds);
}
