/**
 * Type definitions for Pannellum 2.5.7.
 *
 * Pannellum is loaded as a global via <script> tags from /pannellum/.
 * These types let us call it safely from React.
 */

export interface PannellumViewerInstance {
  destroy: () => void;
  getYaw: () => number;
  getPitch: () => number;
  getHfov: () => number;
  setYaw: (yaw: number) => void;
  setPitch: (pitch: number) => void;
  setHfov: (hfov: number) => void;
  loadScene: (sceneId: string) => void;
  getScene: () => string;
  addHotSpot: (hotspot: Record<string, unknown>) => void;
  removeHotSpot: (id: string) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  mouseEventToCoords: (event: MouseEvent) => [number, number];
}

export interface PannellumStatic {
  viewer: (
    container: string | HTMLElement,
    config: Record<string, unknown>,
  ) => PannellumViewerInstance;
}

declare global {
  interface Window {
    pannellum: PannellumStatic;
  }
}
