'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';

export interface BOMItem {
  name: string;
  price: string;
  url: string;
  room_label?: string;
}

export interface BOMResponse {
  items: BOMItem[];
  logs: Record<string, string[]>;
}

export function useWalkthroughBOM(walkthroughId: string | null) {
  return useQuery<BOMResponse>({
    queryKey: ['walkthrough-bom', walkthroughId],
    queryFn: async () => {
      const resp = await apiClient.get(`/panorama/walkthrough/${walkthroughId}/bom`);
      return resp.data;
    },
    enabled: !!walkthroughId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // If there are still active logs, keep polling every 3 seconds
      if (data && Object.keys(data.logs).length > 0) {
        // Check if any log doesn't end with "Task complete" or "Error"
        const isStillWorking = Object.values(data.logs).some(roomLogs => {
            const lastLog = roomLogs[roomLogs.length - 1];
            return !lastLog.includes('Task complete') && !lastLog.includes('Error');
        });
        if (isStillWorking) return 3000;
      }
      // If we have items but no logs, or logs are done, stop polling
      return false;
    }
  });
}
