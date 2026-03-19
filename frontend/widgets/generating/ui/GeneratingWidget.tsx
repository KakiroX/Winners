'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ds } from '@/shared/lib/ds';

gsap.registerPlugin(useGSAP);

export function GeneratingWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to('.gen-dot', { y: -8, stagger: 0.12, repeat: -1, yoyo: true, duration: 0.45, ease: 'power2.inOut' });
    gsap.from('.gen-card', { opacity: 0, y: 16, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
  }, { scope: ref });

  return (
    <div ref={ref} className="w-full max-w-2xl mx-auto space-y-12 text-center">
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="gen-dot w-2 h-2 bg-white/40 rounded-full" />
          ))}
        </div>
        <p className="text-white/35 text-xs font-bold tracking-widest uppercase">Generating your floor plans</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`gen-card ${ds.card} p-5 space-y-3`}>
            <div className="w-full aspect-[4/3] bg-white/6 rounded-xl animate-pulse" />
            <div className="h-3 bg-white/6 rounded w-2/5 animate-pulse" />
            <div className="h-2.5 bg-white/4 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
