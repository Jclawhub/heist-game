// Central tuning for Midnight at the Leonida Museum.
// One place holds every number that shapes how the heist feels, so the
// patrol speeds, vision ranges and alarm rates can be tuned together.

export const VIEW = { width: 960, height: 640 };
export const HUD_HEIGHT = 48;

// The playable gallery: the walls are the border of this rectangle.
export const ROOM = { x: 16, y: 64, width: 928, height: 560 };

export const PLAYER = {
  radius: 12,
  speed: 185, // pixels per second
  grabRange: 70, // press Space / click inside this to take the loot
  autoGrabRange: 40, // overlap this close and the loot is taken
  color: '#1f2937',
  maskColor: '#f8fafc',
};

export const LOOT = { x: 480, y: 118, radius: 16 };

export const EXIT = { x: 440, y: 616, width: 80, height: 10 };

export const GUARD = {
  radius: 13,
  patrolSpeed: 70,
  chaseSpeed: 170, // slower than the thief: a spotted thief can outrun a chase
  visionRange: 230,
  visionHalfAngle: (38 * Math.PI) / 180, // ~76 degree cone
  spotRate: 32, // alarm percent per second while a guard sees the thief
  loseSightSeconds: 1.5, // unseen this long and the guard gives up the chase
};

export const CAMERA = {
  range: 260,
  visionHalfAngle: (28 * Math.PI) / 180, // ~56 degree cone
  spotRate: 28, // alarm percent per second while a camera sees the thief
  sweepSpeed: 0.55, // radians per second of the sweep
  sweepHalfAngle: (42 * Math.PI) / 180,
};

export const ALARM = {
  max: 100,
  decayPerSecond: 8, // falls this fast while nobody sees the thief
};

// Laser tripwires: a beam raises the alarm fast while the thief touches it
// and it is switched on. Each beam cycles on/off so the crossing is a
// timing puzzle, never a wall.
export const LASER = {
  spotRate: 40, // alarm percent per second while touching a live beam
  touchDistance: 6, // how close the thief must be to the beam line
};

// The decoy coin: a tool with a cost. Throwing one costs a coin (3 a run);
// the nearest guard in range abandons its patrol to investigate the clink.
export const COIN = {
  uses: 3,
  throwDistance: 150,
  attractRange: 360, // only a guard this close hears the clink
  investigateSeconds: 5, // how long the guard stays distracted
};

// Palette: dark gallery floor, warm display cases, gold loot, and the
// yellow-to-red vision cones that tell the player where it is safe.
export const COLORS = {
  floor: '#232a35',
  floorTile: '#28303d',
  wall: '#4b5563',
  wallEdge: '#9ca3af',
  case: '#8b6f47',
  caseTop: '#a8875c',
  pillar: '#5b6472',
  pillarTop: '#6b7484',
  pedestal: '#3f4756',
  gold: '#fbbf24',
  goldGlow: '#fde68a',
  guard: '#1d4ed8',
  guardAlert: '#dc2626',
  camera: '#0f766e',
  cone: 'rgba(250, 204, 21, 0.28)',
  coneAlert: 'rgba(220, 38, 38, 0.38)',
  exit: '#16a34a',
  exitGlow: 'rgba(34, 197, 94, 0.35)',
  hud: '#111827',
  text: '#f9fafb',
  muted: '#9ca3af',
  red: '#ef4444',
};
