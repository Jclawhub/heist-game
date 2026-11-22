// The heist itself: the state machine (start / playing / won / caught) and
// the one update that wires the thief, the guards, the cameras, the lasers
// and the alarm together. Each system lives in its own module; this file
// only holds the shared state and the order the systems run in.

import { EXIT, ROOM, ALARM, COIN } from './config.js';
import { GUARD_ROUTES, CAMERA_MOUNTS, LASERS, PLAYER_START, allSolids } from './level.js';
import { makeGuard, updateGuards } from './guards.js';
import { makeCamera, updateCameras } from './cameras.js';
import { updateLasers } from './lasers.js';
import { updateAlarm } from './alarm.js';
import { movePlayer, tryGrabLoot, tryThrowCoin } from './player.js';
import { wasPressed, endFrame } from './input.js';
import { sounds, unlockAudio } from './audio.js';

export const PHASE = { START: 'start', PLAYING: 'playing', WON: 'won', CAUGHT: 'caught' };

export function createGame() {
  return {
    phase: PHASE.START,
    time: 0,
    alarm: 0,
    peakAlarm: 0,
    lootTaken: false,
    frozen: false, // screenshot mode: draw the scene, never advance it
    coinsLeft: COIN.uses, // decoy coins left this run
    coin: null, // the coin lying on the floor, if one was thrown
    lasers: LASERS.map((beam) => ({ ...beam, on: true, zapped: false })),
    laserTouch: false, // the thief is touching a live beam this frame
    player: { x: PLAYER_START.x, y: PLAYER_START.y, facing: -Math.PI / 2 },
    guards: GUARD_ROUTES.map((route) => makeGuard(route)),
    cameras: CAMERA_MOUNTS.map((mount) => makeCamera(mount)),
    spotFlash: 0, // counts down after a fresh detection, for the red flash
  };
}

export function startRun(state) {
  const fresh = createGame();
  Object.assign(state, fresh, { phase: PHASE.PLAYING });
  unlockAudio();
}

// The getaway: once the diamond is taken, the exit door is the run's goal.
// The thief wins by reaching the bottom of the room inside the exit lane.
function checkWin(state) {
  if (!state.lootTaken) return;
  const player = state.player;
  const inExitLane = player.x >= EXIT.x && player.x <= EXIT.x + EXIT.width;
  const atBottom = player.y >= ROOM.y + ROOM.height - 24;
  if (inExitLane && atBottom) {
    state.phase = PHASE.WON;
    sounds.win();
  }
}

export function update(state, dt) {
  if (state.phase === PHASE.PLAYING && !state.frozen) {
    state.time += dt;
    if (state.spotFlash > 0) state.spotFlash -= dt;
    const solids = allSolids();
    movePlayer(state, dt, solids);
    tryGrabLoot(state);
    tryThrowCoin(state, solids);
    const guardSpot = updateGuards(state, dt, solids);
    const cameraSpot = updateCameras(state, dt, solids);
    const laserTouch = updateLasers(state, dt);
    updateAlarm(state, dt, guardSpot || cameraSpot, laserTouch);
    if (state.coin) {
      state.coin.ttl -= dt;
      if (state.coin.ttl <= 0) state.coin = null;
    }
    if (state.alarm >= ALARM.max) {
      state.phase = PHASE.CAUGHT;
      sounds.caught();
    } else {
      checkWin(state);
    }
  }
  endFrame();
}

// Keys handled outside the playing update: start, restart.
export function handleGlobalKeys(state) {
  if (wasPressed('Enter', 'r', 'R') && state.phase !== PHASE.PLAYING) {
    startRun(state);
    return;
  }
  if (wasPressed('r', 'R') && state.phase === PHASE.PLAYING) {
    startRun(state);
  }
}
