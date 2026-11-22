# Midnight at the Leonida Museum

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Jclawhub/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Jclawhub/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game for the [make.fun](https://make.fun) best heist game bounty. One thief, one diamond, three patrolling guards with vision cones, two sweeping security cameras, and one alarm meter standing between you and a clean getaway.

## How to play

- **Move:** WASD or arrow keys
- **Grab the loot:** SPACE (or click) when close to the diamond — or just walk into it
- **Decoy coin:** E throws a coin in the direction you face (3 per run) — the nearest patrolling guard goes to investigate it, giving you a window to slip past
- **Lasers:** red beams cycle on and off — cross while they are dark, or go around; touching a live beam raises the alarm fast
- **Goal:** steal the Leonida Diamond from its pedestal at the top of the gallery, then slip out through the green GETAWAY VAN at the bottom — it lights up once the loot is yours
- **Guards:** patrol fixed routes. Their yellow vision cone turns red when they spot you — break line of sight behind a display case or pillar and they give up the chase
- **Cameras:** sweep back and forth on the walls; their cone works the same way
- **Alarm:** rises fast while any guard or camera sees you, falls slowly while you stay hidden. At 100% the heist is over
- **Restart:** R

## How to run

No build step. Either open `game/index.html` directly in a desktop browser, or serve it:

```sh
node serve.ts
# then open http://localhost:8080
```

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` — the playable game (canvas, no network requests)
- `game/src/config.js` — all tuning numbers (speeds, vision ranges, alarm rates, palette)
- `game/src/level.js` — the gallery: walls, display cases, pillars, guard routes, camera mounts, lasers
- `game/src/vision.js` — cone + line-of-sight detection and collision helpers
- `game/src/player.js` — the thief: movement, grabbing the loot, throwing decoy coins
- `game/src/guards.js` — the guards: patrols, chases, and coin investigations
- `game/src/cameras.js` — the security cameras and their sweeping cones
- `game/src/lasers.js` — the laser tripwires and their on/off cycles
- `game/src/alarm.js` — the alarm meter: what raises it, what lets it fall
- `game/src/game.js` — the state machine that wires the systems together
- `game/src/render.js` — all canvas drawing: room, cones, actors, HUD, screens
- `game/src/audio.js` — WebAudio beeps (grab, spotted, win, caught)
- `game/src/input.js` — keyboard and mouse state
- `game/src/main.js` — bootstrap and the `?shot=` screenshot scenes
- `screenshots/` — real renders of the game in a browser (1-start is the cover)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
