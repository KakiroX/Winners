'use client';

import { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { useWalkthroughs } from '@/features/generate-panorama/api/listWalkthroughs';
import { PlanViewerWidget } from '@/widgets/plan-viewer';
import { apiClient } from '@/shared/api/client';
import { ds } from '@/shared/lib/ds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const parsePrice = (p: string) => {
  const n = parseFloat(p.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

export function DesignsPage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? 'guest';
  const { data: walkthroughs, isLoading, isError, refetch } = useWalkthroughs(userId);
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isGlobalBOMOpen, setIsGlobalBOMOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isLoading) return;
      gsap.fromTo('.page-header', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo('.design-card', { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.09, duration: 0.55, ease: 'power3.out', delay: 0.2 });
    },
    { scope: containerRef, dependencies: [isLoading, walkthroughs] },
  );

  const handleRename = async (id: string, current: string) => {
    const title = window.prompt('Rename design:', current);
    if (!title || title === current) return;
    try {
      await apiClient.patch(`/panorama/walkthrough/${id}/rename`, { title });
      queryClient.invalidateQueries({ queryKey: ['walkthroughs', userId] });
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this design? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/panorama/walkthrough/${id}`);
      queryClient.invalidateQueries({ queryKey: ['walkthroughs', userId] });
    } catch { /* silent */ }
  };

  const globalBOM = useMemo(() =>
    (walkthroughs ?? []).flatMap((wt: any) =>
      (wt.bom ?? []).map((item: any) => ({ ...item, design_title: wt.title }))
    ), [walkthroughs]);

  const globalTotal = useMemo(() =>
    globalBOM.reduce((sum, item) => sum + parsePrice(item.price), 0), [globalBOM]);

  return (
    <div ref={containerRef} className={`${ds.page} pt-16`}>
      <div className={`${ds.container} py-16 space-y-12`}>

        {/* Header */}
        <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/8 pb-10">
          <div className="space-y-2">
            <p className={ds.label}>Your workspace</p>
            <h1 className={`${ds.h1} text-[clamp(2.5rem,5vw,4rem)]`}>Designs</h1>
          </div>
          <div className="flex items-center gap-3">
            {walkthroughs && walkthroughs.length > 0 && (
              <button
                onClick={() => setIsGlobalBOMOpen(true)}
                className={ds.btnGhost}
              >
                Global BOM
              </button>
            )}
            <Link href="/generate" className={ds.btnPrimary}>+ New Design</Link>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : !walkthroughs || walkthroughs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {walkthroughs.map((wt: any) => {
              const designTotal = (wt.bom ?? []).reduce((s: number, i: any) => s + parsePrice(i.price), 0);
              return (
                <DesignCard
                  key={wt.id}
                  wt={wt}
                  designTotal={designTotal}
                  onShowPlan={() => setSelectedPlan(wt.floor_plan_metadata)}
                  onRename={() => handleRename(wt.id, wt.title)}
                  onDelete={() => handleDelete(wt.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-10 flex items-center justify-between text-white/20 text-xs font-bold uppercase tracking-widest">
        <span>&copy; 2026 Dehabit AI</span>
        <Link href="/generate" className="hover:text-white/50 transition-colors">Generate →</Link>
      </footer>

      {/* Global BOM modal */}
      {isGlobalBOMOpen && (
        <GlobalBOMModal
          walkthroughs={walkthroughs}
          globalBOM={globalBOM}
          globalTotal={globalTotal}
          onClose={() => setIsGlobalBOMOpen(false)}
        />
      )}

      {/* Floor plan modal */}
      {selectedPlan && (
        <FloorPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`${ds.card} p-7 space-y-4 h-64`}>
          <div className={`${ds.skeleton} h-3 w-16 rounded-full`} />
          <div className={`${ds.skeleton} h-6 w-3/4`} />
          <div className={`${ds.skeleton} h-4 w-1/2`} />
          <div className="pt-6"><div className={`${ds.skeleton} h-10 w-full`} /></div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={`${ds.card} p-16 text-center space-y-6 max-w-lg mx-auto`}>
      <div className="w-12 h-12 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-white/50 font-bold text-sm uppercase tracking-widest">Could not load designs</p>
        <p className="text-white/25 text-xs">Check that the backend is running and try again.</p>
      </div>
      <button onClick={onRetry} className={ds.btnGhost}>Retry</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`${ds.card} p-20 text-center space-y-8 max-w-lg mx-auto`}>
      <div className="w-16 h-16 border border-white/12 rounded-2xl flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789l5.447-2.724a2 2 0 011.894 0l5.447 2.724A2 2 0 0118 6v9.487a2 2 0 01-1.106 1.789L11.447 20a2 2 0 01-1.894 0z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className={`${ds.h3} text-xl`}>No designs yet</h3>
        <p className={`${ds.body} text-sm max-w-xs mx-auto`}>Generate your first floor plan from a text description.</p>
      </div>
      <Link href="/generate" className={ds.btnPrimary}>Create First Design</Link>
    </div>
  );
}

function DesignCard({ wt, designTotal, onShowPlan, onRename, onDelete }: {
  wt: any; designTotal: number;
  onShowPlan: () => void; onRename: () => void; onDelete: () => void;
}) {
  return (
    <div className={`design-card ${ds.card} ${ds.cardHover} p-7 flex flex-col justify-between group`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={ds.tag}>360 Walkthrough</span>
          <div className="flex items-center gap-2">
            <span className={ds.caption}>
              {new Date(wt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 p-1"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <h3 className="text-white/85 text-xl font-bold leading-snug group-hover:text-white transition-colors flex-1">
            {wt.title}
          </h3>
          <button
            onClick={onRename}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-white/60 p-1 mt-0.5 shrink-0"
            title="Rename"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-white/30 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {wt.room_count} rooms
          </span>
          {designTotal > 0 && (
            <span className="text-white/40 text-xs font-bold tabular-nums">
              ~${designTotal.toLocaleString()}
            </span>
          )}
        </div>
      </div>

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

function GlobalBOMModal({ walkthroughs, globalBOM, globalTotal, onClose }: {
  walkthroughs: any; globalBOM: any[]; globalTotal: number; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${ds.modal} w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden`}>
        <div className="px-8 py-6 border-b border-white/8 flex items-center justify-between">
          <div className="space-y-1">
            <p className={ds.label}>Across {walkthroughs?.length} designs</p>
            <h2 className={`${ds.h2} text-2xl`}>Global BOM</h2>
          </div>
          <button onClick={onClose} className={ds.iconBtn}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Total banner */}
          <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="space-y-1">
              <p className={ds.label}>Total Estimated Cost</p>
              <p className="text-white font-black text-3xl tabular-nums">${globalTotal.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 border border-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="border border-white/8 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-6 py-4 text-xs font-bold text-white/25 uppercase tracking-widest">Item</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/25 uppercase tracking-widest">Design</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/25 uppercase tracking-widest text-right">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/25 uppercase tracking-widest text-right">Buy</th>
                </tr>
              </thead>
              <tbody>
                {globalBOM.map((item, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 text-white/75 text-sm font-semibold">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={ds.tag}>{item.design_title}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-white/60 text-sm font-bold tabular-nums">
                      ${parsePrice(item.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-white/8 flex justify-end">
          <button onClick={onClose} className={ds.btnGhost}>Dismiss</button>
        </div>
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
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${ds.modal} w-full max-w-4xl flex flex-col max-h-[88vh] overflow-hidden`}>
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
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <PlanViewerWidget plan={plan} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className={`${ds.card} p-5 space-y-1`}>
                <p className={ds.label}>{label}</p>
                <p className="text-white font-black text-lg">{value}</p>
              </div>
            ))}
          </div>
          {plan.aesthetic_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.aesthetic_tags.map((tag: string) => (
                <span key={tag} className={ds.tag}>{tag}</span>
              ))}
            </div>
          )}
          {plan.style_notes && (
            <p className={`${ds.body} border-l-2 border-white/15 pl-4`}>{plan.style_notes}</p>
          )}
        </div>
        <div className="px-8 py-5 border-t border-white/8 flex justify-end">
          <button onClick={onClose} className={ds.btnGhost}>Close</button>
        </div>
      </div>
    </div>
  );
}
