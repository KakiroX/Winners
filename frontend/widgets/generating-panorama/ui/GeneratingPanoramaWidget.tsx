'use client';

import { useEffect, useState } from 'react';
import { usePanoramaStore } from '@/features/generate-panorama';
import { ds } from '@/shared/lib/ds';

const MESSAGES = [
  'Arranging furniture with telekinesis...',
  'Convincing the AI that walls should be straight...',
  'Calibrating sunbeam angles...',
  'Debating minimalism vs maximalism...',
  'Placing throw pillows with surgical precision...',
  'Rendering dust particles for extra realism...',
  'Teaching the AI about feng shui...',
  'Adjusting the golden ratio of your living room...',
  'Choosing between 347 shades of white...',
  'Simulating natural light from a star 93M miles away...',
  'Whispering sweet nothings to the GPU...',
  'Manifesting your dream space into pixels...',
  'Asking Gemini to please not hallucinate extra doors...',
];

export function GeneratingPanoramaWidget() {
  const { progress } = usePanoramaStore();
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setMsgIdx((i) => (i + 1) % MESSAGES.length); setFade(true); }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const phase = progress.phase === 'linking'
    ? 'Connecting rooms...'
    : progress.phase === 'done'
      ? 'Done!'
      : progress.roomLabel
        ? `Generating ${progress.roomLabel}...`
        : 'Warming up...';

  return (
    <div className="w-full max-w-lg mx-auto space-y-10 text-center">
      {/* Counter */}
      <div className="space-y-2">
        <div className="text-6xl font-black text-white tabular-nums">
          {progress.current}<span className="text-white/20">/{progress.total}</span>
        </div>
        <p className={ds.label}>rooms generated</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="h-px bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-white/40 text-xs font-mono tracking-wider">{phase}</p>
      </div>

      {/* Rotating message */}
      <p className={`text-white/25 text-xs italic h-4 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {MESSAGES[msgIdx]}
      </p>

      {/* Room tiles */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: progress.total || 4 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-video rounded-lg border transition-all duration-500 flex items-center justify-center ${
              i < progress.current
                ? 'bg-white/15 border-white/20'
                : 'bg-white/4 border-white/8 animate-pulse'
            }`}
          >
            {i < progress.current && (
              <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
