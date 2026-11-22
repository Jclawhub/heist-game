// Bootstrap: wires the canvas, the input and the game loop together, and
// adds deterministic screenshot scenes (?shot=start|play|loot|win) so the
// maker can capture the same frame every time.

import { VIEW } from './config.js';
import { createGame, update, handleGlobalKeys, startRun, PHASE } from './game.js';
import { render } from './render.js';
import { initInput, takeMouseClick } from './input.js';
import { unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

initInput(canvas);
const state = createGame();

// A tiny debug handle the maker uses to play-test in a headless browser:
// window.__heist exposes the live state and lets a test move the thief.
window.__heist = {
  state,
  PHASE,
  start: () => startRun(state),
  setPlayer: (x, y) => {
    state.player.x = x;
    state.player.y = y;
  },
  setAlarm: (value) => {
    state.alarm = value;
  },
};

// Screenshot scenes, chosen with ?shot= in the page URL. Each one sets the
// game up in a fixed, readable state and freezes the simulation so the
// captured frame never changes between loads.
function applyShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'start') {
    state.phase = PHASE.START;
    return;
  }
  if (shot === 'play') {
    startRun(state);
    state.player.x = 300;
    state.player.y = 500;
    state.player.facing = -Math.PI / 2;
    state.time = 42;
    state.alarm = 35;
    state.peakAlarm = 35;
    // A decoy coin on the floor with the lower guard walking to it, so the
    // frame shows the gadget, a distracted guard, the lasers and the loot.
    state.coinsLeft = 2;
    state.coin = { x: 430, y: 430, ttl: 5 };
    state.guards[1].mode = 'investigate';
    state.guards[1].x = 560;
    state.guards[1].y = 470;
    state.guards[1].facing = Math.PI;
    state.guards[1].investigateX = 430;
    state.guards[1].investigateY = 430;
    state.guards[1].investigateTime = 4;
    state.frozen = true;
    return;
  }
  if (shot === 'loot') {
    startRun(state);
    state.player.x = 480;
    state.player.y = 150;
    state.player.facing = -Math.PI / 2;
    state.lootTaken = true;
    state.time = 68;
    state.alarm = 55;
    state.peakAlarm = 55;
    state.guards[2].alerted = true;
    state.guards[2].x = 480;
    state.guards[2].y = 260;
    state.guards[2].facing = -Math.PI / 2;
    state.frozen = true;
    return;
  }
  if (shot === 'win') {
    startRun(state);
    state.lootTaken = true;
    state.time = 83;
    state.alarm = 12;
    state.peakAlarm = 61;
    state.phase = PHASE.WON;
    state.frozen = true;
  }
}

applyShotMode();

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  // Clicking the start screen starts the run; clicking mid-game is the
  // mouse grab, handled inside the update.
  if (state.phase === PHASE.START) {
    const click = takeMouseClick();
    if (click) {
      startRun(state);
    } else {
      handleGlobalKeys(state);
    }
  } else if (state.phase === PHASE.WON || state.phase === PHASE.CAUGHT) {
    handleGlobalKeys(state);
  } else {
    handleGlobalKeys(state);
    update(state, dt);
  }
  render(ctx, state, now / 1000);
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown', unlockAudio);
requestAnimationFrame(frame);
