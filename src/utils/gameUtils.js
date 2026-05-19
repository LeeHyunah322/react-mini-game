export const BOARD_WIDTH = 420;
export const BOARD_HEIGHT = 520;
export const PLAYER_SIZE = 36;
export const OBSTACLE_SIZE = 28;
export const ITEM_SIZE = 30;
export const PLAYER_Y = BOARD_HEIGHT - PLAYER_SIZE - 18;

export function getRandomHole(current = -1) {
  let next = Math.floor(Math.random() * 9);

  while (next === current) {
    next = Math.floor(Math.random() * 9);
  }

  return next;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}