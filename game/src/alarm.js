// The alarm meter: the run's fail state. It climbs fast while any guard,
// camera or laser has the thief, and falls slowly while the thief stays
// hidden — so a brief mistake costs alarm, not the run, but a long exposure
// ends it. The meter remembers its peak for the end screen.

import { GUARD, CAMERA, LASER, ALARM } from './config.js';

// spotted: whether a guard or camera sees the thief this frame.
// laserTouch: whether the thief is touching a live laser beam this frame.
export function updateAlarm(state, dt, spotted, laserTouch) {
  if (spotted || laserTouch) {
    let rate = 0;
    if (state.guards.some((guard) => guard.alerted)) rate += GUARD.spotRate;
    if (state.cameras.some((camera) => camera.alerted)) rate += CAMERA.spotRate;
    if (laserTouch) rate += LASER.spotRate;
    state.alarm = Math.min(ALARM.max, state.alarm + rate * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  }
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
}
