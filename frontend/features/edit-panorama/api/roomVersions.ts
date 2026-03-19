'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { usePanoramaStore } from '@/features/generate-panorama';

export interface RoomVersion {
  id: string;
  image_url: string;
  prompt_used: string;
  created_at: string;
}

export function useRoomVersions(walkthroughId: string, roomId: string) {
  return useQuery<RoomVersion[]>({
    queryKey: ['room-versions', walkthroughId, roomId],
    queryFn: async () => {
      const resp = await apiClient.get(`/panorama/walkthrough/${walkthroughId}/room/${roomId}/versions`);
      return resp.data;
    },
    enabled: !!walkthroughId && !!roomId,
  });
}

export function useRevertVersion() {
  const queryClient = useQueryClient();
  const { walkthrough, updateWalkthrough } = usePanoramaStore();

  return useMutation({
    mutationFn: async ({ walkthroughId, roomId, versionId }: { walkthroughId: string; roomId: string; versionId: string }) => {
      const resp = await apiClient.post(`/panorama/walkthrough/${walkthroughId}/room/${roomId}/revert/${versionId}`);
      return resp.data;
    },
    onSuccess: (data, variables) => {
        // Update the global store immediately
        if (walkthrough) {
            const updatedRooms = walkthrough.rooms.map((r) =>
              r.room_id === variables.roomId
                ? { ...r, panorama_url: data.new_panorama_url }
                : r,
            );
            const updatedConfig = JSON.parse(JSON.stringify(walkthrough.pannellum_config));
            const scenes = updatedConfig.scenes as Record<string, { panorama?: string }>;
            if (scenes[variables.roomId]) {
              scenes[variables.roomId] = { ...scenes[variables.roomId], panorama: data.new_panorama_url };
            }
            updateWalkthrough({
              ...walkthrough,
              rooms: updatedRooms,
              pannellum_config: updatedConfig,
            });
        }
        queryClient.invalidateQueries({ queryKey: ['walkthrough', variables.walkthroughId] });
    }
  });
}
