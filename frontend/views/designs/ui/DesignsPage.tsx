'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuthStore } from '@/features/auth';
import { useWalkthroughs } from '@/features/generate-panorama/api/listWalkthroughs';
import { PlanViewerWidget } from '@/widgets/plan-viewer';
import { ds } from '@/shared/lib/ds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function DesignsPage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? 'guest';
  const { data: walkthroughs, isLoading } = useWalkthroughs(userId);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.page-header', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      });

      gsap.from('.design-card', {
        opacity: 0, y: 28, stagger: 0.1, duration: 0.55, ease: 'power3.out', delay: 0.15,
      });
    },
    { scope: containerRef, dependencies: [isLoading] },
  );

  return (
    <div ref={containerRef} className={`${ds.page} pt-16`}>
      <div className={`${ds.container} py-16 space-y-12`}>

        {/* Header row */}
        <div className="page-header flex items-end justify-between border-b border-white/8 pb-10">
          <div className="space-y-2">
            <p className={ds.label}>Your workspace</p>
            <h1 className={`${ds.h1} text-[clamp(2.5rem,5vw,4rem)]`}>Designs</h1>
          </div>
          <Link href="/generate" className={ds.btnPrimary}>
            + New Design
          </Link>
        </div>

        {/* States */}
        {isLoading ? (
          <SkeletonGrid />
        ) : !walkthroughs || walkthroughs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {walkthroughs.map((wt: any) => (
              <DesignCard
                key={wt.id}
                wt={wt}
                onShowPlan={() => setSelectedPlan(wt.floor_plan_metadata)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-10 flex items-center justify-between text-white/20 text-xs font-bold uppercase tracking-widest">
        <span>&copy; 2026 Inhabit AI</span>
        <Link href="/generate" className="hover:text-white/50 transition-colors">Generate →</Link>
      </footer>

      {/* Floor plan modal */}
      {selectedPlan && (
        <FloorPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`${ds.card} p-7 space-y-4 h-64`}>
          <div className={`${ds.skeleton} h-3 w-16 rounded-full`} />
          <div className={`${ds.skeleton} h-6 w-3/4`} />
          <div className={`${ds.skeleton} h-4 w-1/2`} />
          <div className="pt-6 space-y-2">
            <div className={`${ds.skeleton} h-10 w-full`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`${ds.card} p-20 text-center space-y-8 max-w-lg mx-auto`}>
      {/* Icon */}
      <div className="w-16 h-16 border border-white/12 rounded-2xl flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789l5.447-2.724a2 2 0 011.894 0l5.447 2.724A2 2 0 0118 6v9.487a2 2 0 01-1.106 1.789L11.447 20a2 2 0 01-1.894 0z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className={`${ds.h3} text-xl`}>No designs yet</h3>
        <p className={`${ds.body} text-sm max-w-xs mx-auto`}>
          Start by generating a floor plan from a text description.
        </p>
      </div>
      <Link href="/generate" className={ds.btnPrimary}>
        Create First Design
      </Link>
    </div>
  );
}

function DesignCard({ wt, onShowPlan }: { wt: any; onShowPlan: () => void }) {
  return (
    <div className={`design-card ${ds.card} ${ds.cardHover} p-7 flex flex-col justify-between h-full group`}>
      <div className="space-y-4">
        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className={ds.tag}>360 Walkthrough</span>
          <span className={ds.caption}>
            {new Date(wt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white/85 text-xl font-bold leading-snug group-hover:text-white transition-colors">
          {wt.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-white/30 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {wt.room_count} rooms
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-7 flex flex-col gap-2.5">
        <Link
          href={`/walkthrough/${wt.id}`}
          className={`${ds.btnPrimary} w-full text-center flex items-center justify-center gap-2`}
        >
          Open 360° View
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>

        {wt.floor_plan_metadata && (
          <button onClick={onShowPlan} className={`${ds.btnGhost} w-full flex items-center justify-center gap-2`}>
            Floor Plan
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789l5.447-2.724a2 2 0 011.894 0l5.447 2.724A2 2 0 0118 6v9.487a2 2 0 01-1.106 1.789L11.447 20a2 2 0 01-1.894 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function FloorPlanModal({ plan, onClose }: { plan: any; onClose: () => void }) {
  const stats = [
    { label: 'Total Area', value: `${plan.total_area_sqm} m²` },
    { label: 'Rooms', value: plan.rooms.length },
    { label: 'Grid', value: `${plan.grid_cols}×${plan.grid_rows}` },
    { label: 'Style', value: plan.aesthetic_tags?.[0] ?? 'Modern' },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${ds.modal} w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden`}>
        {/* Modal header */}
        <div className="px-8 py-6 border-b border-white/8 flex items-center justify-between">
          <div className="space-y-1">
            <p className={ds.label}>Floor Plan</p>
            <h2 className={`${ds.h2} text-2xl`}>{plan.variant_label}</h2>
          </div>
          <button onClick={onClose} className={ds.iconBtn}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <PlanViewerWidget plan={plan} />

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className={`${ds.card} p-5 space-y-1`}>
                <p className={ds.label}>{label}</p>
                <p className="text-white font-black text-lg">{value}</p>
              </div>
            ))}
          </div>

          {/* Style tags */}
          {plan.aesthetic_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.aesthetic_tags.map((tag: string) => (
                <span key={tag} className={ds.tag}>{tag}</span>
              ))}
            </div>
          )}

          {/* Style notes */}
          {plan.style_notes && (
            <p className={`${ds.body} border-l-2 border-white/15 pl-4`}>{plan.style_notes}</p>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-8 py-5 border-t border-white/8 flex justify-end">
          <button onClick={onClose} className={ds.btnGhost}>Close</button>
        </div>
      </div>
    </div>
  );
}
