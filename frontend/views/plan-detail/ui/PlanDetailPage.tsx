'use client';

import { useSelectionStore } from '@/features/select-floor-plan';
import { GenerateWalkthroughButton, StylePromptInput } from '@/features/generate-panorama';
import { PlanViewerWidget } from '@/widgets/plan-viewer';

export function PlanDetailPage() {
  const { selectedSchema } = useSelectionStore();

  if (!selectedSchema) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">No plan selected.</p>
    </main>
  );

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 gap-8">
      <PlanViewerWidget plan={selectedSchema} />
      <div className="w-full max-w-2xl border-t border-slate-100 pt-8">
        <StylePromptInput />
      </div>
      <div className="flex flex-col items-center gap-3">
        <GenerateWalkthroughButton />
        <p className="text-xs text-slate-400">
          Generate 360° panoramas for each room and walk through them
        </p>
      </div>
    </main>
  );
}
