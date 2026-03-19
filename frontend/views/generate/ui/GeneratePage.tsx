'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useGenerateFloorPlan, useGenerationStore } from '@/features/generate-floor-plan';
import { PlanCard, useSelectionStore } from '@/features/select-floor-plan';
import { GenerateWalkthroughButton } from '@/features/generate-panorama';
import { ds } from '@/shared/lib/ds';

gsap.registerPlugin(useGSAP);

const SUGGESTIONS = [
  '3-bed apartment, open kitchen, home office, natural light',
  'Studio loft, exposed brick, mezzanine sleeping area',
  'Family home, 4 bedrooms, large garden entrance, 2 bathrooms',
  'Penthouse, panoramic views, open plan, master en-suite',
];

export function GeneratePage() {
  const router = useRouter();
  const { prompt, status, schemas, promptInterpretation, setPrompt, setLoading, setSuccess, setError } = useGenerationStore();
  const { selectedId, select } = useSelectionStore();
  const { mutate, isPending } = useGenerateFloorPlan();

  const handleGenerate = () => {
    if (prompt.trim().length < 10) return;
    setLoading();
    mutate({ prompt }, {
      onSuccess: (data) => setSuccess(data.schemas, data.prompt_interpretation, data.generation_id),
      onError: () => setError(),
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  if (status === 'loading' || isPending) return <LoadingState />;
  if (status === 'error') return <ErrorState onRetry={() => { setPrompt(''); window.location.reload(); }} />;
  if (status === 'success' && schemas.length > 0) return (
    <ResultState
      schemas={schemas}
      interpretation={promptInterpretation}
      selectedId={selectedId}
      onSelect={select}
    />
  );

  // Idle — prompt input
  return <IdleState prompt={prompt} setPrompt={setPrompt} onGenerate={handleGenerate} onKeyDown={handleKeyDown} />;
}

// ── States ───────────────────────────────────────────────

function IdleState({ prompt, setPrompt, onGenerate, onKeyDown }: {
  prompt: string;
  setPrompt: (v: string) => void;
  onGenerate: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.gen-title span', { yPercent: 100, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power4.out' });
    gsap.from('.gen-input-wrap', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 0.4 });
    gsap.from('.gen-suggestions', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out', delay: 0.65 });
  }, { scope: ref });

  const charCount = prompt.length;
  const isReady = charCount >= 10;

  return (
    <div ref={ref} className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-24">
      {/* Title */}
      <div className="gen-title overflow-hidden mb-12 text-center">
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black uppercase tracking-tight leading-none text-white flex flex-wrap justify-center gap-x-5">
          {['What', 'will', 'you', 'build?'].map((w) => (
            <span key={w} className="inline-block">{w}</span>
          ))}
        </h1>
      </div>

      {/* Input */}
      <div className="gen-input-wrap w-full max-w-2xl space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="3-bedroom apartment, open kitchen, home office, natural light from the south..."
            rows={5}
            maxLength={500}
            className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-5 text-white placeholder-white/20 text-base resize-none focus:outline-none transition-colors leading-relaxed"
          />
          <div className="absolute bottom-4 right-5 flex items-center gap-4">
            <span className={`text-xs font-mono tabular-nums ${charCount > 450 ? 'text-red-400/60' : 'text-white/20'}`}>
              {charCount}/500
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/20 text-xs font-mono">⌘↵ to generate</span>
          <button
            onClick={onGenerate}
            disabled={!isReady}
            className={`${ds.btnPrimary} disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100`}
          >
            Generate Plans
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="gen-suggestions mt-10 w-full max-w-2xl space-y-3">
        <p className={`${ds.label} text-center`}>Try these</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="text-left px-4 py-3 bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 rounded-xl text-white/45 text-xs leading-relaxed transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to('.load-dot', { y: -8, stagger: 0.12, repeat: -1, yoyo: true, duration: 0.5, ease: 'power2.inOut' });
    gsap.from('.load-card', { opacity: 0, y: 16, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
  }, { scope: ref });

  return (
    <div ref={ref} className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-24 space-y-16">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="load-dot w-2 h-2 bg-white/50 rounded-full" />
          ))}
        </div>
        <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Generating your plans</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="load-card bg-white/4 border border-white/8 rounded-2xl p-5 space-y-3">
            <div className="w-full aspect-[4/3] bg-white/6 rounded-xl animate-pulse" />
            <div className="h-3 bg-white/6 rounded w-1/2 animate-pulse" />
            <div className="h-2.5 bg-white/4 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 space-y-6 text-center">
      <div className="w-14 h-14 border border-red-500/30 rounded-2xl flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div className="space-y-2">
        <p className="text-white/60 font-bold uppercase tracking-widest text-sm">Generation failed</p>
        <p className="text-white/30 text-xs max-w-xs">The AI couldn&apos;t process your request. Please try a different prompt.</p>
      </div>
      <button onClick={onRetry} className={ds.btnPrimary}>Try Again</button>
    </div>
  );
}

function ResultState({ schemas, interpretation, selectedId, onSelect }: {
  schemas: any[]; interpretation: string; selectedId: string | null; onSelect: (plan: any) => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.result-header', { opacity: 0, y: 16, duration: 0.5, ease: 'power3.out' });
    gsap.from('.plan-card-item', { opacity: 0, y: 20, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.2 });
    gsap.from('.result-cta', { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out', delay: 0.5 });
  }, { scope: ref });

  return (
    <div ref={ref} className="min-h-screen bg-black px-6 py-24">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="result-header space-y-3 border-b border-white/8 pb-8">
          <p className={ds.label}>Choose your layout</p>
          <h2 className={`${ds.h2} text-[clamp(2rem,4vw,3.5rem)]`}>Pick a Floor Plan</h2>
          {interpretation && (
            <p className="text-white/35 text-sm leading-relaxed max-w-2xl italic">{interpretation}</p>
          )}
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {schemas.map((plan) => (
            <div key={plan.id} className="plan-card-item">
              <PlanCard plan={plan} selected={selectedId === plan.id} onSelect={onSelect} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="result-cta flex flex-col items-center gap-4 pt-4">
          <GenerateWalkthroughButton />
          {!selectedId && (
            <p className="text-white/25 text-xs font-mono tracking-wider uppercase">Select a layout above to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}
