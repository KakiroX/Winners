import { z } from 'zod';

const navigationHotspotSchema = z.object({
  id: z.string(),
  target_room_id: z.string(),
  pitch: z.number(),
  yaw: z.number(),
  label: z.string(),
});

const editHotspotSchema = z.object({
  id: z.string(),
  pitch: z.number(),
  yaw: z.number(),
  text: z.string().default(''),
  properties: z.record(z.string(), z.unknown()).default({}),
});

const roomPanoramaSchema = z.object({
  room_id: z.string(),
  room_label: z.string(),
  room_type: z.string(),
  panorama_url: z.string(),
  navigation_hotspots: z.array(navigationHotspotSchema).default([]),
  edit_hotspots: z.array(editHotspotSchema).default([]),
  default_yaw: z.number().default(0),
  default_pitch: z.number().default(0),
});

const pannellumConfigSchema = z.object({
  default: z.object({
    firstScene: z.string(),
    autoLoad: z.boolean(),
    autoRotate: z.number(),
    compass: z.boolean(),
    showZoomCtrl: z.boolean(),
    showFullscreenCtrl: z.boolean(),
    mouseZoom: z.boolean(),
    draggable: z.boolean(),
  }),
  scenes: z.record(z.string(), z.any()),
});

const walkthroughSchema = z.object({
  id: z.string(),
  floor_plan_id: z.string(),
  generation_id: z.string(),
  title: z.string(),
  rooms: z.array(roomPanoramaSchema),
  pannellum_config: pannellumConfigSchema,
});

export const generateWalkthroughResponseSchema = z.object({
  walkthrough: walkthroughSchema,
});

const versionSnapshotSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  image_path: z.string(),
  created_at: z.number(),
  prompt_used: z.string().default(''),
  edit_hotspots: z.array(editHotspotSchema).default([]),
});

export const editRoomResponseSchema = z.object({
  version: versionSnapshotSchema,
  updated_panorama_url: z.string(),
});
