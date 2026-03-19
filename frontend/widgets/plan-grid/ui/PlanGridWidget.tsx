'use client';

import type { FloorPlanSchema } from '@/entities/floor-plan/model/types';
import { PlanCard, useSelectionStore } from '@/features/select-floor-plan';
import { GenerateWalkthroughButton } from '@/features/generate-panorama';

interface Props {
  schemas: FloorPlanSchema[];
  interpretation: string;
}

export function PlanGridWidget({ schemas, interpretation }: Props) {
  const { selectedId, select } = useSelectionStore();

  return (
    <div className="w-full max-w-4xl space-y-6">
      <p className="text-sm text-slate-600 italic">{interpretation}</p>
      <div className="grid grid-cols-2 gap-4">
        {schemas.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedId === plan.id}
            onSelect={select}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 pt-4">
        <GenerateWalkthroughButton />
        {!selectedId && (
          <p className="text-xs text-slate-400">Select a layout above to continue</p>
        )}
      </div>
    </div>
  );
}
