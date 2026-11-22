// The museum gallery itself: walls, display cases, pillars, the loot
// pedestal, the exit door, and the patrol routes the guards walk.
// Everything is data here; game.js moves the actors, render.js draws them.

import { ROOM, LOOT, EXIT } from './config.js';

// Solid rectangles the thief and the guards cannot walk through, and that
// block a guard's or camera's line of sight. x/y are the top-left corner.
export const OBSTACLES = [
  // Two display cases on the upper floor, left and right of the loot lane.
  { x: 170, y: 160, width: 130, height: 60, kind: 'case' },
  { x: 660, y: 160, width: 130, height: 60, kind: 'case' },
  // Two pillars mid-room, making a left route and a right route.
  { x: 300, y: 320, width: 64, height: 64, kind: 'pillar' },
  { x: 596, y: 320, width: 64, height: 64, kind: 'pillar' },
];

// The four border walls, as rectangles (the exit door cuts the bottom one).
export function wallRects() {
  return [
    { x: ROOM.x - 16, y: ROOM.y - 16, width: ROOM.width + 32, height: 16, kind: 'wall' },
    { x: ROOM.x - 16, y: ROOM.y + ROOM.height, width: ROOM.width + 32, height: 16, kind: 'wall' },
    { x: ROOM.x - 16, y: ROOM.y, width: 16, height: ROOM.height, kind: 'wall' },
    { x: ROOM.x + ROOM.width, y: ROOM.y, width: 16, height: ROOM.height, kind: 'wall' },
  ];
}

// Every solid rectangle in the room, walls included, for collision and sight.
export function allSolids() {
  return [...wallRects(), ...OBSTACLES];
}

// Where the guards walk. Each route is a list of waypoints the guard walks
// between, turning around at the ends (ping-pong). The start point is the
// first waypoint, so no guard begins near the thief's entrance.
// Routes are laid out to clear every obstacle with room to spare.
export const GUARD_ROUTES = [
  // Upper patrol, sweeping the floor below the loot.
  { waypoints: [{ x: 140, y: 250 }, { x: 820, y: 250 }], speed: 65 },
  // Lower patrol, guarding the approach from the entrance. It walks high
  // enough that the bottom lane stays a fair crossing, not a death trap.
  { waypoints: [{ x: 820, y: 480 }, { x: 140, y: 480 }], speed: 78 },
  // Centre patrol, walking the direct lane between loot and exit.
  { waypoints: [{ x: 480, y: 180 }, { x: 480, y: 560 }], speed: 55 },
];

// Cameras bolted to the walls, sweeping their cone across the room.
export const CAMERA_MOUNTS = [
  // Left wall, high up, looking right across the upper floor.
  { x: ROOM.x, y: 120, baseAngle: 0, phase: 0 },
  // Right wall, low down, looking left across the lower floor.
  { x: ROOM.x + ROOM.width, y: 500, baseAngle: Math.PI, phase: 1.6 },
];

// Laser tripwires. Each beam is a segment with its own on/off cycle; the
// phase staggers them so the two mid-room beams are never live together.
// Beam A guards the loot lane; B and C guard the mid-room crossings, with
// the open middle lane (where the centre guard walks) left as the third way.
export const LASERS = [
  { x1: 330, y1: 150, x2: 630, y2: 150, onSeconds: 3, offSeconds: 2, phase: 0 },
  { x1: 120, y1: 400, x2: 340, y2: 400, onSeconds: 2, offSeconds: 2, phase: 0 },
  { x1: 620, y1: 400, x2: 840, y2: 400, onSeconds: 2, offSeconds: 2, phase: 2 },
];

export const LOOT_SPOT = { x: LOOT.x, y: LOOT.y };
export const EXIT_DOOR = { x: EXIT.x, y: EXIT.y, width: EXIT.width, height: EXIT.height };

// The thief slips in through the exit door at the bottom of the room.
export const PLAYER_START = { x: 480, y: 595 };
