import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { editRoomResponseSchema } from '@/shared/lib/zod/panoramaSchema';
import type { EditRoomResponse } from '@/entities/panorama/model/types';

interface EditPayload {
  walkthroughId: string;
  roomId: string;
  prompt: string;
  pitch: number;
  yaw: number;
}

const editRoom = async (payload: EditPayload): Promise<EditRoomResponse> => {
  const { walkthroughId, roomId, ...body } = payload;
  const { data } = await apiClient.post(
    `/panorama/walkthrough/${walkthroughId}/room/${roomId}/edit`,
    body,
  );
  return editRoomResponseSchema.parse(data);
};

export const useEditRoom = () => useMutation({ mutationFn: editRoom });
