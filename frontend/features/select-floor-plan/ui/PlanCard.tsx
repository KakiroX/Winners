'use client';

import type { FloorPlanSchema } from '@/entities/floor-plan/model/types';
import { FloorPlanSVG } from '@/entities/floor-plan/ui/FloorPlanSVG';
import { ds } from '@/shared/lib/ds';

interface Props {
  plan: FloorPlanSchema;
  selected: boolean;
  onSelect: (plan: FloorPlanSchema) => void;
}

export function PlanCard({ plan, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(plan)}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 group ${
        selected
          ? 'border-white/40 bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]'
          : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/6'
      }`}
    >
      {/* SVG preview */}
      <div className={`w-full aspect-[4/3] mb-4 rounded-xl overflow-hidden border ${
        selected ? 'border-white/15' : 'border-white/8'
      }`}>
        <FloorPlanSVG plan={plan} className="w-full h-full" />
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white/80 font-bold text-sm group-hover:text-white transition-colors">
          {plan.variant_label}
        </p>
        {selected && (
          <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>

      {/* Style notes */}
      <p className="text-white/30 text-xs leading-relaxed line-clamp-2 mb-3">{plan.style_notes}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {plan.aesthetic_tags.slice(0, 3).map((tag) => (
          <span key={tag} className={ds.tag}>{tag}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/6 text-white/25 text-xs font-mono">
        <span>{plan.total_area_sqm} m²</span>
        <span>{plan.rooms.length} rooms</span>
        <span>{plan.grid_cols}×{plan.grid_rows}</span>
      </div>
    </button>
  );
}
