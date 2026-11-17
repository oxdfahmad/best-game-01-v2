// Tidekeeper — keyboard and mouse.
// Tracks held keys, the mouse position in canvas coordinates, clicks as a
// queue the screens consume, and the hotkeys the HUD shows (1/2/3, Space).

export function createInput(canvas) {
  const input = {
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    keys: new Set(),
    clickQueue: [],
    wheelDelta: 0,
  };

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
    input.clickQueue.push({ x: p.x, y: p.y, button: event.button });
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseDown = false;
  });
  return input;
}

export function keyDown(input, code) {
  return input.keys.has(code);
}

export function hotkeyPressed(input, digit) {
  return input.keys.has('Digit' + digit) || input.keys.has('Numpad' + digit);
}

// Pull the oldest unconsumed click, or null. Screens consume clicks so one
// click never fires two buttons.
export function takeClick(input) {
  return input.clickQueue.shift() ?? null;
}

export function clearClicks(input) {
  input.clickQueue.length = 0;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
