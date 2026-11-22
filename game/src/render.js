// Everything the player sees: the gallery, the vision cones, the actors,
// the HUD, and the start / win / caught screens. Pure drawing, no logic.

import { VIEW, HUD_HEIGHT, ROOM, PLAYER, LOOT, EXIT, GUARD, CAMERA, COIN, COLORS } from './config.js';
import { OBSTACLES, wallRects, LOOT_SPOT, EXIT_DOOR } from './level.js';
import { PHASE } from './game.js';

function drawCone(ctx, x, y, facing, range, halfAngle, alerted) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = alerted ? COLORS.coneAlert : COLORS.cone;
  ctx.fill();
  ctx.strokeStyle = alerted ? 'rgba(220,38,38,0.7)' : 'rgba(250,204,21,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLasers(ctx, state, time) {
  for (const beam of state.lasers) {
    // Emitter boxes at both ends of the beam.
    for (const [ex, ey] of [[beam.x1, beam.y1], [beam.x2, beam.y2]]) {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(ex - 6, ey - 6, 12, 12);
      ctx.fillStyle = beam.on ? '#ef4444' : '#450a0a';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (beam.on) {
      // A live beam: a bright red line with a soft glow, pulsing slightly.
      const pulse = 0.75 + Math.sin(time * 6) * 0.15;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.35 * pulse})`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(254, 202, 202, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
    } else {
      // A dark beam: a faint dashed line, so the player can read the timing.
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawCoin(ctx, state, time) {
  if (!state.coin) return;
  const pulse = 1 + Math.sin(time * 5) * 0.15;
  ctx.beginPath();
  ctx.arc(state.coin.x, state.coin.y, 16 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(state.coin.x, state.coin.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  ctx.fillStyle = COLORS.goldGlow;
  ctx.beginPath();
  ctx.arc(state.coin.x, state.coin.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// After the diamond is taken, the exit door becomes the getaway van: a
// lit van waiting at the kerb, the run's payoff for the whole plan.
function drawGetaway(ctx, state, time) {
  if (!state.lootTaken) return;
  const glowPulse = 0.3 + Math.sin(time * 4) * 0.12;
  ctx.fillStyle = `rgba(34, 197, 94, ${glowPulse})`;
  ctx.fillRect(EXIT_DOOR.x - 26, ROOM.y + ROOM.height - 52, EXIT_DOOR.width + 52, 52);
  // Van body.
  ctx.fillStyle = '#14532d';
  ctx.fillRect(EXIT_DOOR.x - 16, ROOM.y + ROOM.height - 44, EXIT_DOOR.width + 32, 30);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(EXIT_DOOR.x - 16, ROOM.y + ROOM.height - 44, EXIT_DOOR.width + 32, 8);
  // Van cab window and wheels.
  ctx.fillStyle = '#bbf7d0';
  ctx.fillRect(EXIT_DOOR.x + EXIT_DOOR.width - 14, ROOM.y + ROOM.height - 38, 12, 12);
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(EXIT_DOOR.x - 4, ROOM.y + ROOM.height - 12, 6, 0, Math.PI * 2);
  ctx.arc(EXIT_DOOR.x + EXIT_DOOR.width + 4, ROOM.y + ROOM.height - 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY VAN — GO!', EXIT_DOOR.x + EXIT_DOOR.width / 2, ROOM.y + ROOM.height - 58);
  ctx.textAlign = 'left';
}

function drawRoom(ctx) {
  // Floor with a subtle checker of tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  ctx.fillStyle = COLORS.floorTile;
  const tile = 58;
  for (let ty = ROOM.y; ty < ROOM.y + ROOM.height; ty += tile) {
    for (let tx = ROOM.x; tx < ROOM.x + ROOM.width; tx += tile) {
      if (((tx - ROOM.x) / tile + (ty - ROOM.y) / tile) % 2 === 0) {
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
  }
  // Walls.
  for (const wall of wallRects()) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.fillStyle = COLORS.wallEdge;
    if (wall.height < wall.width) ctx.fillRect(wall.x, wall.y + wall.height - 3, wall.width, 3);
    else ctx.fillRect(wall.x + wall.width - 3, wall.y, 3, wall.height);
  }
  // Display cases and pillars.
  for (const obstacle of OBSTACLES) {
    if (obstacle.kind === 'case') {
      ctx.fillStyle = COLORS.case;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = COLORS.caseTop;
      ctx.fillRect(obstacle.x + 6, obstacle.y + 6, obstacle.width - 12, obstacle.height - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(obstacle.x + 10, obstacle.y + 10, obstacle.width - 20, 8);
    } else {
      ctx.fillStyle = COLORS.pillar;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = COLORS.pillarTop;
      ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
    }
  }
  // Exit door: a green gap in the bottom wall with a glowing mat.
  ctx.fillStyle = COLORS.exitGlow;
  ctx.fillRect(EXIT_DOOR.x - 10, ROOM.y + ROOM.height - 26, EXIT_DOOR.width + 20, 26);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(EXIT_DOOR.x, EXIT_DOOR.y - 8, EXIT_DOOR.width, 10);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT_DOOR.x + EXIT_DOOR.width / 2, ROOM.y + ROOM.height - 30);
}

function drawLoot(ctx, state, time) {
  if (state.lootTaken) return;
  const pulse = 1 + Math.sin(time * 4) * 0.12;
  // Pedestal.
  ctx.fillStyle = COLORS.pedestal;
  ctx.fillRect(LOOT_SPOT.x - 22, LOOT_SPOT.y + 6, 44, 22);
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(LOOT_SPOT.x - 22, LOOT_SPOT.y + 6, 44, 5);
  // Glow.
  const glow = ctx.createRadialGradient(LOOT_SPOT.x, LOOT_SPOT.y - 8, 4, LOOT_SPOT.x, LOOT_SPOT.y - 8, 46 * pulse);
  glow.addColorStop(0, 'rgba(251,191,36,0.55)');
  glow.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(LOOT_SPOT.x, LOOT_SPOT.y - 8, 46 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // The diamond.
  ctx.save();
  ctx.translate(LOOT_SPOT.x, LOOT_SPOT.y - 8);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = COLORS.gold;
  const s = 13 * pulse;
  ctx.fillRect(-s, -s, s * 2, s * 2);
  ctx.fillStyle = COLORS.goldGlow;
  ctx.fillRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
  ctx.restore();
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIAMOND', LOOT_SPOT.x, LOOT_SPOT.y - 38);
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    drawCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle, guard.alerted);
  }
  for (const guard of state.guards) {
    // Body: a blue circle with a white direction tick; red when alerted.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fillStyle = guard.alerted ? COLORS.guardAlert : COLORS.guard;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#dbeafe';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 7), guard.y + Math.sin(guard.facing) * (GUARD.radius + 7));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (guard.alerted) {
      ctx.fillStyle = COLORS.red;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - GUARD.radius - 8);
    }
  }
}

function drawCameras(ctx, state) {
  for (const camera of state.cameras) {
    drawCone(ctx, camera.x, camera.y, camera.facing, camera.range, camera.halfAngle, camera.alerted);
  }
  for (const camera of state.cameras) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.facing);
    ctx.fillStyle = COLORS.camera;
    ctx.fillRect(-4, -7, 18, 14);
    ctx.fillStyle = camera.alerted ? COLORS.red : '#5eead4';
    ctx.beginPath();
    ctx.arc(14, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = COLORS.camera;
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, state) {
  const player = state.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fillStyle = PLAYER.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e5e7eb';
  ctx.stroke();
  // The mask: a white band across the face, pointing where the thief looks.
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius - 5, player.facing - 0.9, player.facing + 0.9);
  ctx.lineTo(player.x, player.y);
  ctx.closePath();
  ctx.fillStyle = PLAYER.maskColor;
  ctx.fill();
  // "Press SPACE" hint when the loot is in reach.
  if (!state.lootTaken) {
    const dist = Math.hypot(player.x - LOOT.x, player.y - LOOT.y);
    if (dist <= PLAYER.grabRange + 10) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE to grab!', player.x, player.y - PLAYER.radius - 12);
    }
  }
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  // Alarm meter.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ALARM', 16, HUD_HEIGHT / 2);
  const meterX = 84;
  const meterWidth = 180;
  const meterY = 14;
  const meterHeight = 20;
  ctx.fillStyle = '#374151';
  ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
  const fillWidth = (meterWidth * state.alarm) / 100;
  ctx.fillStyle = state.alarm < 50 ? '#facc15' : state.alarm < 75 ? '#f97316' : COLORS.red;
  ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.floor(state.alarm)}%`, meterX + meterWidth + 10, HUD_HEIGHT / 2);
  // Loot status.
  const lootText = state.lootTaken ? 'LOOT: 1/1 — GET TO THE VAN!' : 'LOOT: 0/1';
  ctx.fillStyle = state.lootTaken ? COLORS.gold : COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(lootText, 320, HUD_HEIGHT / 2);
  // Decoy coins left — a tool with a cost, shown on the HUD.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`COINS: ${state.coinsLeft}`, 600, HUD_HEIGHT / 2);
  for (let i = 0; i < COIN.uses; i++) {
    ctx.beginPath();
    ctx.arc(668 + i * 20, HUD_HEIGHT / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < state.coinsLeft ? COLORS.gold : '#374151';
    ctx.fill();
  }
  // Timer.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatTime(state.time), VIEW.width - 16, HUD_HEIGHT / 2 - 10);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD move • SPACE grab • E coin', VIEW.width - 16, HUD_HEIGHT / 2 + 12);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawStartScreen(ctx) {
  ctx.fillStyle = 'rgba(10, 12, 18, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('MIDNIGHT AT THE', VIEW.width / 2, 190);
  ctx.fillText('LEONIDA MUSEUM', VIEW.width / 2, 244);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  ctx.fillText('One thief. One diamond. Three guards, two cameras, one alarm.', VIEW.width / 2, 300);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '17px sans-serif';
  ctx.fillText('WASD or arrow keys — move   •   SPACE or click — grab the loot   •   E — throw a decoy coin', VIEW.width / 2, 348);
  ctx.fillText('Sneak behind the guards. Time the camera sweeps. Mind the lasers.', VIEW.width / 2, 378);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press ENTER or click to start', VIEW.width / 2, 440);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px sans-serif';
  ctx.fillText('Steal the diamond. Dodge the cones. Mind the lasers. R restarts.', VIEW.width / 2, 480);
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, state) {
  const won = state.phase === PHASE.WON;
  ctx.fillStyle = won ? 'rgba(6, 40, 20, 0.88)' : 'rgba(50, 8, 8, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.gold : COLORS.red;
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(won ? 'CLEAN GETAWAY!' : 'CAUGHT!', VIEW.width / 2, 240);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  ctx.fillText(
    won ? 'You stole the Leonida Diamond and vanished into the night.' : 'The alarm hit 100% — the museum is crawling with security.',
    VIEW.width / 2,
    296,
  );
  ctx.fillStyle = COLORS.muted;
  ctx.font = '18px sans-serif';
  ctx.fillText(`Time: ${formatTime(state.time)}    •    Peak alarm: ${Math.floor(state.peakAlarm)}%`, VIEW.width / 2, 340);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press R to run it again', VIEW.width / 2, 400);
  ctx.textAlign = 'left';
}

export function render(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (state.phase === PHASE.START) {
    // Show the room behind the title so the first frame already sells it.
    drawRoom(ctx);
    drawLasers(ctx, state, time);
    drawLoot(ctx, state, time);
    drawGuards(ctx, state);
    drawCameras(ctx, state);
    drawHud(ctx, state);
    drawStartScreen(ctx);
    return;
  }
  drawRoom(ctx);
  drawLasers(ctx, state, time);
  drawCoin(ctx, state, time);
  drawLoot(ctx, state, time);
  drawGuards(ctx, state);
  drawCameras(ctx, state);
  drawGetaway(ctx, state, time);
  drawPlayer(ctx, state);
  drawHud(ctx, state);
  // A red flash across the screen the moment a watcher spots the thief.
  if (state.spotFlash > 0 && state.phase === PHASE.PLAYING) {
    ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.25, state.spotFlash * 0.4)})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  if (state.phase === PHASE.WON || state.phase === PHASE.CAUGHT) {
    drawEndScreen(ctx, state);
  }
}
