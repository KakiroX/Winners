'use client';

import { useState } from 'react';
import { useSelectionStore } from '@/features/select-floor-plan';
import { usePanoramaStore } from '../model/usePanoramaStore';
import { useStyleStore } from '../model/useStyleStore';
import { useAuthStore } from '@/features/auth';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/shared/config/env';

export function GenerateWalkthroughButton() {
  const { selectedSchema } = useSelectionStore();
  const { setLoading, setProgress, setSuccess, setError } = usePanoramaStore();
  const { stylePrompt } = useStyleStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!selectedSchema) return;

    const userId = user?.id || "guest";
    setIsPending(true);
    setLoading(selectedSchema.rooms.length);
    router.push('/walkthrough/generating');

    try {
      const response = await fetch(`${env.apiUrl}/panorama/generate-walkthrough/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor_plan_id: selectedSchema.id,
          user_id: userId,
          variant_label: selectedSchema.variant_label,
          total_area_sqm: selectedSchema.total_area_sqm,
          grid_cols: selectedSchema.grid_cols,
          grid_rows: selectedSchema.grid_rows,
          rooms: selectedSchema.rooms,
          floor_plan_metadata: selectedSchema,
          aesthetic_tags: selectedSchema.aesthetic_tags,
          style_notes: selectedSchema.style_notes,
          user_style_prompt: stylePrompt,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start generation');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          let eventType = '';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            if (line.startsWith('data: ')) data = line.slice(6);
          }

          if (!eventType || !data) continue;

          const parsed = JSON.parse(data);

          if (eventType === 'progress') {
            setProgress({
              current: parsed.current,
              total: parsed.total,
              roomLabel: parsed.room_label,
              phase: parsed.phase,
            });
          } else if (eventType === 'room_done') {
            setProgress({
              current: parsed.current,
              total: parsed.total,
              roomLabel: parsed.room_label,
              phase: 'generating',
            });
          } else if (eventType === 'complete') {
            setSuccess(parsed.walkthrough);
            queryClient.invalidateQueries({ queryKey: ['walkthroughs'] });
            router.replace(`/walkthrough/${parsed.walkthrough.id}`);
            return;
          } else if (eventType === 'error') {
            setError(parsed.message);
            return;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!selectedSchema || isPending}
      className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
    >
      {isPending ? 'Generating panoramas...' : 'Generate 360° Walkthrough'}
    </button>
  );
}
