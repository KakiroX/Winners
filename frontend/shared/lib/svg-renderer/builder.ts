import type { FloorPlanSchema, Room, RoomFeature } from '@/entities/floor-plan/model/types';
import { CELL_SIZE, PADDING, planToSvgViewBox, roomToSvgRect, WALL_THICKNESS, INNER_WALL_THICKNESS, DOOR_RADIUS, WINDOW_LENGTH } from './layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SvgRoomData {
  key: string;
  room: Room;
  rect: { x: number; y: number; width: number; height: number };
  label: string;
  areaSqm: number;
  fill: string;
}

export interface SvgWallSegment {
  x1: number; y1: number; x2: number; y2: number;
  isOuter: boolean;
}

export interface SvgDoor {
  cx: number; cy: number;
  radius: number;
  startAngle: number;
  sweepAngle: number;
  wallX1: number; wallY1: number;
  wallX2: number; wallY2: number;
}

export interface SvgWindow {
  x: number; y: number;
  width: number; height: number;
  orientation: 'horizontal' | 'vertical';
}

export interface SvgDimension {
  x1: number; y1: number;
  x2: number; y2: number;
  label: string;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export interface SvgPlanData {
  viewBox: string;
  rooms: SvgRoomData[];
  walls: SvgWallSegment[];
  doors: SvgDoor[];
  windows: SvgWindow[];
  dimensions: SvgDimension[];
  outerRect: { x: number; y: number; width: number; height: number };
}

// ---------------------------------------------------------------------------
// Room fill — very subtle tints
// ---------------------------------------------------------------------------

const ROOM_FILLS: Record<string, string> = {
  living_room: '#FAFAFA',
  kitchen:     '#FFF9F0',
  bedroom:     '#F8F5FF',
  bathroom:    '#F0FAF5',
  office:      '#FFFBE6',
  dining_room: '#FFF5F5',
  hallway:     '#F5F5F5',
  balcony:     '#F0FAFA',
  storage:     '#F5F2EF',
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export const buildSvgData = (plan: FloorPlanSchema): SvgPlanData => {
  const rooms = plan.rooms.map((room) => ({
    key: room.id,
    room,
    rect: roomToSvgRect(room),
    label: room.label,
    areaSqm: room.area_sqm,
    fill: ROOM_FILLS[room.type] ?? '#FAFAFA',
  }));

  const outerRect = computeOuterRect(plan);
  const walls = computeWalls(plan, rooms);
  const doors = computeDoors(plan, rooms);
  const windows = computeWindows(rooms);
  const dimensions = computeDimensions(plan, rooms, outerRect);

  return {
    viewBox: planToSvgViewBox(plan.grid_cols, plan.grid_rows),
    rooms,
    walls,
    doors,
    windows,
    dimensions,
    outerRect,
  };
};

// ---------------------------------------------------------------------------
// Outer boundary
// ---------------------------------------------------------------------------

function computeOuterRect(plan: FloorPlanSchema) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const room of plan.rooms) {
    const r = roomToSvgRect(room);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ---------------------------------------------------------------------------
// Walls — detect shared edges between rooms
// ---------------------------------------------------------------------------

interface Edge {
  x1: number; y1: number; x2: number; y2: number;
  roomId: string;
}

function computeWalls(plan: FloorPlanSchema, rooms: SvgRoomData[]): SvgWallSegment[] {
  const outer = computeOuterRect(plan);
  const edges: Edge[] = [];

  for (const { key, rect } of rooms) {
    // top
    edges.push({ x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y, roomId: key });
    // bottom
    edges.push({ x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height, roomId: key });
    // left
    edges.push({ x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height, roomId: key });
    // right
    edges.push({ x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height, roomId: key });
  }

  const walls: SvgWallSegment[] = [];
  const processed = new Set<string>();

  for (const edge of edges) {
    const edgeKey = `${edge.x1},${edge.y1}-${edge.x2},${edge.y2}`;
    const reverseKey = `${edge.x2},${edge.y2}-${edge.x1},${edge.y1}`;
    if (processed.has(edgeKey) || processed.has(reverseKey)) continue;
    processed.add(edgeKey);

    // Check if this edge is on the outer boundary
    const isOuter = isOnOuterBoundary(edge, outer);

    walls.push({
      x1: edge.x1, y1: edge.y1,
      x2: edge.x2, y2: edge.y2,
      isOuter,
    });
  }

  return walls;
}

function isOnOuterBoundary(
  edge: { x1: number; y1: number; x2: number; y2: number },
  outer: { x: number; y: number; width: number; height: number },
): boolean {
  const eps = 1;
  // horizontal edge on top or bottom
  if (Math.abs(edge.y1 - edge.y2) < eps) {
    if (Math.abs(edge.y1 - outer.y) < eps || Math.abs(edge.y1 - (outer.y + outer.height)) < eps) return true;
  }
  // vertical edge on left or right
  if (Math.abs(edge.x1 - edge.x2) < eps) {
    if (Math.abs(edge.x1 - outer.x) < eps || Math.abs(edge.x1 - (outer.x + outer.width)) < eps) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Doors — place at connections between rooms
// ---------------------------------------------------------------------------

function computeDoors(plan: FloorPlanSchema, rooms: SvgRoomData[]): SvgDoor[] {
  const doors: SvgDoor[] = [];
  const roomMap = new Map(rooms.map(r => [r.key, r]));
  const placed = new Set<string>();

  for (const { key, room } of rooms) {
    for (const connId of room.connections) {
      const pairKey = [key, connId].sort().join('|');
      if (placed.has(pairKey)) continue;
      placed.add(pairKey);

      const other = roomMap.get(connId);
      if (!other) continue;

      // Skip open_to_next connections (no door needed)
      if (room.features.includes('open_to_next' as RoomFeature)) continue;

      const door = computeDoorBetween(rooms.find(r => r.key === key)!, other);
      if (door) doors.push(door);
    }
  }

  return doors;
}

function computeDoorBetween(a: SvgRoomData, b: SvgRoomData): SvgDoor | null {
  const ar = a.rect, br = b.rect;

  // Find shared edge
  // Horizontal adjacency (left-right)
  if (Math.abs((ar.x + ar.width) - br.x) < 2 || Math.abs((br.x + br.width) - ar.x) < 2) {
    const sharedX = Math.abs((ar.x + ar.width) - br.x) < 2 ? ar.x + ar.width : ar.x;
    const overlapTop = Math.max(ar.y, br.y);
    const overlapBottom = Math.min(ar.y + ar.height, br.y + br.height);
    if (overlapBottom - overlapTop < DOOR_RADIUS) return null;

    const midY = (overlapTop + overlapBottom) / 2;
    const isRight = sharedX === ar.x + ar.width;
    return {
      cx: sharedX,
      cy: midY - DOOR_RADIUS / 2,
      radius: DOOR_RADIUS,
      startAngle: isRight ? 180 : 0,
      sweepAngle: 90,
      wallX1: sharedX, wallY1: midY - DOOR_RADIUS / 2,
      wallX2: sharedX, wallY2: midY + DOOR_RADIUS / 2,
    };
  }

  // Vertical adjacency (top-bottom)
  if (Math.abs((ar.y + ar.height) - br.y) < 2 || Math.abs((br.y + br.height) - ar.y) < 2) {
    const sharedY = Math.abs((ar.y + ar.height) - br.y) < 2 ? ar.y + ar.height : ar.y;
    const overlapLeft = Math.max(ar.x, br.x);
    const overlapRight = Math.min(ar.x + ar.width, br.x + br.width);
    if (overlapRight - overlapLeft < DOOR_RADIUS) return null;

    const midX = (overlapLeft + overlapRight) / 2;
    const isBottom = sharedY === ar.y + ar.height;
    return {
      cx: midX - DOOR_RADIUS / 2,
      cy: sharedY,
      radius: DOOR_RADIUS,
      startAngle: isBottom ? 270 : 90,
      sweepAngle: 90,
      wallX1: midX - DOOR_RADIUS / 2, wallY1: sharedY,
      wallX2: midX + DOOR_RADIUS / 2, wallY2: sharedY,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Windows — placed based on room features
// ---------------------------------------------------------------------------

function computeWindows(rooms: SvgRoomData[]): SvgWindow[] {
  const windows: SvgWindow[] = [];

  for (const { room, rect } of rooms) {
    for (const feature of room.features) {
      if (!feature.startsWith('window_')) continue;
      const dir = feature.replace('window_', '');

      switch (dir) {
        case 'north':
          windows.push({
            x: rect.x + rect.width / 2 - WINDOW_LENGTH / 2,
            y: rect.y - 3,
            width: WINDOW_LENGTH,
            height: 6,
            orientation: 'horizontal',
          });
          break;
        case 'south':
          windows.push({
            x: rect.x + rect.width / 2 - WINDOW_LENGTH / 2,
            y: rect.y + rect.height - 3,
            width: WINDOW_LENGTH,
            height: 6,
            orientation: 'horizontal',
          });
          break;
        case 'west':
          windows.push({
            x: rect.x - 3,
            y: rect.y + rect.height / 2 - WINDOW_LENGTH / 2,
            width: 6,
            height: WINDOW_LENGTH,
            orientation: 'vertical',
          });
          break;
        case 'east':
          windows.push({
            x: rect.x + rect.width - 3,
            y: rect.y + rect.height / 2 - WINDOW_LENGTH / 2,
            width: 6,
            height: WINDOW_LENGTH,
            orientation: 'vertical',
          });
          break;
      }
    }
  }

  return windows;
}

// ---------------------------------------------------------------------------
// Dimension lines
// ---------------------------------------------------------------------------

function computeDimensions(
  plan: FloorPlanSchema,
  rooms: SvgRoomData[],
  outer: { x: number; y: number; width: number; height: number },
): SvgDimension[] {
  const dims: SvgDimension[] = [];
  const totalW = plan.grid_cols * CELL_SIZE;
  const totalH = plan.grid_rows * CELL_SIZE;

  // Overall top dimension
  dims.push({
    x1: outer.x, y1: outer.y - 30,
    x2: outer.x + outer.width, y2: outer.y - 30,
    label: `${(plan.grid_cols * 1.5).toFixed(1).replace(/\.0$/, '')} m`,
    side: 'top',
  });

  // Overall left dimension
  dims.push({
    x1: outer.x - 30, y1: outer.y,
    x2: outer.x - 30, y2: outer.y + outer.height,
    label: `${(plan.grid_rows * 1.5).toFixed(1).replace(/\.0$/, '')} m`,
    side: 'left',
  });

  // Per-room bottom dimensions for the bottom row
  const bottomEdge = outer.y + outer.height;
  const bottomRooms = rooms
    .filter(r => Math.abs((r.rect.y + r.rect.height) - bottomEdge) < 2)
    .sort((a, b) => a.rect.x - b.rect.x);

  for (const r of bottomRooms) {
    dims.push({
      x1: r.rect.x, y1: bottomEdge + 20,
      x2: r.rect.x + r.rect.width, y2: bottomEdge + 20,
      label: `${(r.room.width_units * 1.5).toFixed(1).replace(/\.0$/, '')}`,
      side: 'bottom',
    });
  }

  // Per-room right dimensions for the rightmost column
  const rightEdge = outer.x + outer.width;
  const rightRooms = rooms
    .filter(r => Math.abs((r.rect.x + r.rect.width) - rightEdge) < 2)
    .sort((a, b) => a.rect.y - b.rect.y);

  for (const r of rightRooms) {
    dims.push({
      x1: rightEdge + 20, y1: r.rect.y,
      x2: rightEdge + 20, y2: r.rect.y + r.rect.height,
      label: `${(r.room.height_units * 1.5).toFixed(1).replace(/\.0$/, '')}`,
      side: 'right',
    });
  }

  return dims;
}
