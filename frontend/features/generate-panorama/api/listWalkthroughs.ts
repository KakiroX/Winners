'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth';

export interface WalkthroughSummary {
  id: string;
  title: string;
  created_at: string;
  room_count: number;
  floor_plan_metadata?: any;
  bom?: any[];
}

export function useWalkthroughs(userId: string = "guest") {
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  return useQuery<WalkthroughSummary[]>({
    queryKey: ['walkthroughs', userId],
    queryFn: async () => {
      const resp = await apiClient.get(`/panorama/walkthroughs?user_id=${userId}`);
      return resp.data;
    },
    enabled: !!userId && isAuthReady,
  });
}
