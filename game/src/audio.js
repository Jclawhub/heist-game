// Tiny WebAudio sound effects: no audio files, just oscillator beeps.
// The context is created lazily on the first user gesture, so the game
// stays silent (and error-free) in a screenshot run with no input.

let context = null;

function getContext() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

// Unlock the audio context from a key or mouse gesture.
export function unlockAudio() {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function beep(frequency, durationSeconds, type, volume, when = 0) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + durationSeconds);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + when);
    oscillator.stop(ctx.currentTime + when + durationSeconds + 0.02);
  } catch {
    // Sound is decoration; a failure here must never break the game.
  }
}

export const sounds = {
  // A bright two-note chime when the diamond is taken.
  grab() {
    beep(880, 0.12, 'sine', 0.18);
    beep(1318, 0.2, 'sine', 0.15, 0.09);
  },
  // A harsh two-tone siren blip when a watcher spots the thief.
  spotted() {
    beep(620, 0.16, 'square', 0.08);
    beep(465, 0.16, 'square', 0.08, 0.14);
  },
  // A rising three-note win jingle for the clean getaway.
  win() {
    beep(523, 0.14, 'triangle', 0.18);
    beep(659, 0.14, 'triangle', 0.18, 0.12);
    beep(784, 0.28, 'triangle', 0.2, 0.24);
  },
  // A low buzz when the heist fails.
  caught() {
    beep(180, 0.4, 'sawtooth', 0.12);
    beep(120, 0.5, 'sawtooth', 0.1, 0.15);
  },
  // A bright clink when a decoy coin lands on the floor.
  coin() {
    beep(1568, 0.08, 'sine', 0.14);
    beep(2093, 0.14, 'sine', 0.1, 0.06);
  },
  // A sharp zap when the thief touches a live laser beam.
  laser() {
    beep(2200, 0.09, 'square', 0.07);
    beep(1800, 0.09, 'square', 0.06, 0.07);
  },
};
