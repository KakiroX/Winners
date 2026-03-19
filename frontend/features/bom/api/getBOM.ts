'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface BOMItem {
  name: string;
  price: string;
  url: string;
  room_label?: string;
}

export function useWalkthroughBOM(walkthroughId: string | null) {
  return useQuery<BOMItem[]>({
    queryKey: ['walkthrough-bom', walkthroughId],
    queryFn: async () => {
      const resp = await apiClient.get(`/panorama/walkthrough/${walkthroughId}/bom`);
      return resp.data;
    },
    enabled: !!walkthroughId,
    refetchInterval: (query) => {
      // If any items are missing or it's empty, refetch every 5s while modal is open
      const data = query.state.data;
      if (!data || data.length === 0) return 5000;
      return false;
    }
  });
}
