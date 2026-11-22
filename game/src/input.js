// Keyboard and mouse state, kept in one place so the game logic never
// touches DOM events directly. Also exposes the "pressed" edge: a key that
// went down since the last frame, for start / grab / restart actions.

const keysDown = new Set();
const keysPressed = new Set();
let mouse = { x: 0, y: 0, clicked: false };
let anyKeyCallback = null;

export function initInput(canvas) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!keysDown.has(event.key)) keysPressed.add(event.key);
    keysDown.add(event.key);
    if (anyKeyCallback) anyKeyCallback(event.key);
  });
  window.addEventListener('keyup', (event) => {
    keysDown.delete(event.key);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse = {
      x: ((event.clientX - rect.left) / rect.width) * 960,
      y: ((event.clientY - rect.top) / rect.height) * 640,
      clicked: true,
    };
  });
  window.addEventListener('blur', () => {
    keysDown.clear();
    keysPressed.clear();
  });
}

// Called by the game when it wants a callback for any key press.
export function onAnyKey(callback) {
  anyKeyCallback = callback;
}

export function isDown(...keys) {
  return keys.some((key) => keysDown.has(key));
}

export function wasPressed(...keys) {
  return keys.some((key) => keysPressed.has(key));
}

export function takeMouseClick() {
  const click = mouse.clicked ? { x: mouse.x, y: mouse.y } : null;
  mouse.clicked = false;
  return click;
}

// The movement direction from WASD or the arrow keys, normalised.
export function moveDirection() {
  let dx = 0;
  let dy = 0;
  if (isDown('a', 'A', 'ArrowLeft')) dx -= 1;
  if (isDown('d', 'D', 'ArrowRight')) dx += 1;
  if (isDown('w', 'W', 'ArrowUp')) dy -= 1;
  if (isDown('s', 'S', 'ArrowDown')) dy += 1;
  if (dx === 0 && dy === 0) return { x: 0, y: 0 };
  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length };
}

// Clear the "pressed this frame" edges at the end of each update.
export function endFrame() {
  keysPressed.clear();
}
