import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { Walkthrough } from '@/entities/panorama/model/types';

const fetchWalkthrough = async (id: string): Promise<Walkthrough> => {
  const { data } = await apiClient.get(`/panorama/walkthrough/${id}`);
  return data as Walkthrough;
};

export const useWalkthrough = (id: string | null) =>
  useQuery({
    queryKey: ['walkthrough', id],
    queryFn: () => fetchWalkthrough(id!),
    enabled: !!id,
    retry: 1,
  });
