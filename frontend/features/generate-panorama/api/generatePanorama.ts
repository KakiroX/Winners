import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { generateWalkthroughResponseSchema } from '@/shared/lib/zod/panoramaSchema';
import type { GenerateWalkthroughResponse } from '@/entities/panorama/model/types';
import type { FloorPlanSchema } from '@/entities/floor-plan/model/types';

interface GeneratePayload {
  floorPlan: FloorPlanSchema;
  userId: string;
}

const generateWalkthrough = async (
  payload: GeneratePayload,
): Promise<GenerateWalkthroughResponse> => {
  const { floorPlan, userId } = payload;

  const { data } = await apiClient.post('/panorama/generate-walkthrough', {
    floor_plan_id: floorPlan.id,
    user_id: userId,
    variant_label: floorPlan.variant_label,
    total_area_sqm: floorPlan.total_area_sqm,
    grid_cols: floorPlan.grid_cols,
    grid_rows: floorPlan.grid_rows,
    rooms: floorPlan.rooms,
    aesthetic_tags: floorPlan.aesthetic_tags,
    style_notes: floorPlan.style_notes,
  });

  return generateWalkthroughResponseSchema.parse(data);
};

export const useGenerateWalkthrough = () =>
  useMutation({ mutationFn: generateWalkthrough });
