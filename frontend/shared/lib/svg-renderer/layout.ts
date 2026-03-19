import type { Room } from '@/entities/floor-plan/model/types';

export const CELL_SIZE = 60;
export const PADDING = 60; // extra padding for dimension lines
export const WALL_THICKNESS = 6;
export const INNER_WALL_THICKNESS = 3;
export const WINDOW_LENGTH = 20;
export const DOOR_RADIUS = 24;

export const gridToPx = (units: number): number => units * CELL_SIZE;

export const roomToSvgRect = (room: Room) => ({
  x: PADDING + room.position.x * CELL_SIZE,
  y: PADDING + room.position.y * CELL_SIZE,
  width: room.width_units * CELL_SIZE,
  height: room.height_units * CELL_SIZE,
});

export const planToSvgViewBox = (gridCols: number, gridRows: number): string => {
  const w = PADDING * 2 + gridCols * CELL_SIZE;
  const h = PADDING * 2 + gridRows * CELL_SIZE;
  return `0 0 ${w} ${h}`;
};
