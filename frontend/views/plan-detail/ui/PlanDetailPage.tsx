'use client';

import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSelectionStore } from '@/features/select-floor-plan';
import { GenerateWalkthroughButton, StylePromptInput } from '@/features/generate-panorama';
import { PlanViewerWidget } from '@/widgets/plan-viewer';
import { ds } from '@/shared/lib/ds';

gsap.registerPlugin(useGSAP);

export function PlanDetailPage() {
  const { selectedSchema } = useSelectionStore();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.pd-plan', { opacity: 0, scale: 0.97, duration: 0.7, ease: 'power3.out' });
    gsap.from('.pd-meta > *', { opacity: 0, y: 16, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.2 });
    gsap.from('.pd-style', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out', delay: 0.4 });
    gsap.from('.pd-cta', { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out', delay: 0.55 });
  }, { scope: ref, dependencies: [!!selectedSchema] });

  if (!selectedSchema) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-5">
      <p className="text-white/25 text-sm font-mono tracking-widest uppercase">No plan selected</p>
      <Link href="/generate" className={ds.btnPrimary}>← Back to Generate</Link>
    </div>
  );

  const stats = [
    { label: 'Area', value: `${selectedSchema.total_area_sqm} m²` },
    { label: 'Rooms', value: selectedSchema.rooms.length },
    { label: 'Grid', value: `${selectedSchema.grid_cols}×${selectedSchema.grid_rows}` },
  ];

  return (
    <div ref={ref} className="min-h-screen bg-black text-white pt-16">
      <div className={`${ds.container} py-16`}>
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">

          {/* Left — floor plan viewer */}
          <div className="pd-plan space-y-6">
            <div className="space-y-1">
              <p className={ds.label}>Selected layout</p>
              <h1 className={`${ds.h1} text-[clamp(2rem,4vw,3rem)]`}>{selectedSchema.variant_label}</h1>
            </div>
            <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/3">
              <PlanViewerWidget plan={selectedSchema} />
            </div>
            {selectedSchema.style_notes && (
              <p className="text-white/35 text-sm leading-relaxed italic border-l-2 border-white/12 pl-4">
                {selectedSchema.style_notes}
              </p>
            )}
          </div>

          {/* Right — metadata + style + CTA */}
          <div className="space-y-8 lg:sticky lg:top-24">
            {/* Stats */}
            <div className="pd-meta grid grid-cols-3 gap-3">
              {stats.map(({ label, value }) => (
                <div key={label} className={`${ds.card} p-4 text-center space-y-1`}>
                  <p className={ds.label}>{label}</p>
                  <p className="text-white font-black text-lg">{value}</p>
                </div>
              ))}
            </div>

            {/* Aesthetic tags */}
            {selectedSchema.aesthetic_tags.length > 0 && (
              <div className="pd-meta flex flex-wrap gap-2">
                {selectedSchema.aesthetic_tags.map((tag) => (
                  <span key={tag} className={ds.tag}>{tag}</span>
                ))}
              </div>
            )}

            {/* Style input */}
            <div className="pd-style space-y-2">
              <p className={ds.label}>Style & atmosphere</p>
              <StylePromptInput />
            </div>

            {/* Generate CTA */}
            <div className="pd-cta space-y-3 pt-2">
              <GenerateWalkthroughButton />
              <p className="text-white/20 text-xs font-mono text-center">
                Generates a 360° panorama for each room
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
