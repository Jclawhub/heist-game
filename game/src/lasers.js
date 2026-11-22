// The laser tripwires: red beams across the gallery that cycle on and off.
// Touching a live beam raises the alarm fast and zaps. Each beam has its
// own on/off rhythm, so the crossing is a timing puzzle with a safe moment.

import { PLAYER, LASER } from './config.js';
import { distanceToSegment } from './vision.js';
import { sounds } from './audio.js';

// Advance every beam through its on/off cycle and test whether the thief is
// touching a live one. Returns true when a live beam is being touched.
export function updateLasers(state, dt) {
  const player = state.player;
  let touching = false;
  for (const beam of state.lasers) {
    const cycle = (state.time + beam.phase) % (beam.onSeconds + beam.offSeconds);
    const wasOn = beam.on;
    beam.on = cycle < beam.onSeconds;
    if (!beam.on) {
      beam.zapped = false;
      continue;
    }
    const close = distanceToSegment(player.x, player.y, beam.x1, beam.y1, beam.x2, beam.y2);
    if (close <= PLAYER.radius + LASER.touchDistance) {
      touching = true;
      if (!wasOn || !beam.zapped) {
        beam.zapped = true;
        sounds.laser();
      }
    } else {
      beam.zapped = false;
    }
  }
  state.laserTouch = touching;
  return touching;
}
