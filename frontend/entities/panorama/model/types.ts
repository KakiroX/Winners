export interface NavigationHotspot {
  id: string;
  target_room_id: string;
  pitch: number;
  yaw: number;
  label: string;
}

export interface EditHotspot {
  id: string;
  pitch: number;
  yaw: number;
  text: string;
  properties: Record<string, unknown>;
}

export interface RoomPanorama {
  room_id: string;
  room_label: string;
  room_type: string;
  panorama_url: string;
  navigation_hotspots: NavigationHotspot[];
  edit_hotspots: EditHotspot[];
  default_yaw: number;
  default_pitch: number;
}

export interface PannellumHotspot {
  id: string;
  pitch: number;
  yaw: number;
  type: 'scene' | 'info';
  text: string;
  sceneId?: string;
  cssClass?: string;
}

export interface PannellumScene {
  title: string;
  type: 'equirectangular';
  panorama: string;
  hfov: number;
  yaw: number;
  pitch: number;
  hotSpots: PannellumHotspot[];
}

export interface PannellumConfig {
  default: {
    firstScene: string;
    autoLoad: boolean;
    autoRotate: number;
    compass: boolean;
    showZoomCtrl: boolean;
    showFullscreenCtrl: boolean;
    mouseZoom: boolean;
    draggable: boolean;
  };
  scenes: Record<string, PannellumScene>;
  [key: string]: unknown;
}

export interface Walkthrough {
  id: string;
  floor_plan_id: string;
  generation_id: string;
  title: string;
  rooms: RoomPanorama[];
  pannellum_config: PannellumConfig;
}

export interface VersionSnapshot {
  id: string;
  room_id: string;
  image_path: string;
  created_at: number;
  prompt_used: string;
  edit_hotspots: EditHotspot[];
}

export interface GenerateWalkthroughResponse {
  walkthrough: Walkthrough;
}

export interface EditRoomResponse {
  version: VersionSnapshot;
  updated_panorama_url: string;
}
