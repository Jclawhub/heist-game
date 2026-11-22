// The security cameras: bolted to the walls, sweeping their vision cone
// back and forth. A camera that spots the thief raises the alarm and
// flashes red; when the thief breaks line of sight it calms down again.

import { CAMERA } from './config.js';
import { watcherSeesThief } from './vision.js';
import { sounds } from './audio.js';

export function makeCamera(mount) {
  return {
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    phase: mount.phase,
    facing: mount.baseAngle,
    range: CAMERA.range,
    halfAngle: CAMERA.visionHalfAngle,
    alerted: false,
  };
}

// Sweep every camera through its arc and test whether any of them sees the
// thief. Returns true if at least one camera has the thief in its cone.
export function updateCameras(state, dt, solids) {
  const player = state.player;
  let anySpot = false;
  for (const camera of state.cameras) {
    camera.facing =
      camera.baseAngle + Math.sin(state.time * CAMERA.sweepSpeed + camera.phase) * CAMERA.sweepHalfAngle;
    const sees = watcherSeesThief(camera, player.x, player.y, solids);
    if (sees && !camera.alerted) {
      camera.alerted = true;
      state.spotFlash = 0.6;
      sounds.spotted();
    } else if (!sees) {
      camera.alerted = false;
    }
    if (sees) anySpot = true;
  }
  return anySpot;
}
