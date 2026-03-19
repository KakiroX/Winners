'use client';

import { useEffect, useState } from 'react';
import { usePanoramaStore } from '@/features/generate-panorama';

const FUN_MESSAGES = [
  'Arranging furniture with telekinesis...',
  'Convincing the AI that walls should be straight...',
  'Calibrating sunbeam angles...',
  'Debating minimalism vs maximalism...',
  'Placing throw pillows with surgical precision...',
  'Rendering dust particles for extra realism...',
  'Teaching the AI about feng shui...',
  'Photoshopping out the construction crew...',
  'Adjusting the golden ratio of your living room...',
  'Choosing between 347 shades of white...',
  'Making sure the toilet faces the right way...',
  'Adding that "lived-in but not messy" vibe...',
  'Hanging art at exactly eye level...',
  'Simulating natural light from a star 93M miles away...',
  'Triple-checking the panorama doesn\'t look like a fever dream...',
  'Whispering sweet nothings to the GPU...',
  'Bribing the render engine with extra VRAM...',
  'Aligning chakras of the floor plan...',
  'Manifesting your dream space into pixels...',
  'Asking Gemini to please not hallucinate extra doors...',
];

export function GeneratingPanoramaWidget() {
  const { progress } = usePanoramaStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate fun messages every 3.5 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((i) => (i + 1) % FUN_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const pct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const phaseLabel = progress.phase === 'linking'
    ? 'Connecting rooms...'
    : progress.phase === 'done'
      ? 'Done!'
      : progress.roomLabel
        ? `Generating ${progress.roomLabel}...`
        : 'Warming up...';

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 text-center">
      {/* Counter */}
      <div className="space-y-1">
        <div className="text-6xl font-bold text-slate-900 tabular-nums">
          {progress.current}/{progress.total}
        </div>
        <p className="text-sm font-medium text-slate-600">rooms generated</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm font-medium text-slate-700">{phaseLabel}</p>
      </div>

      {/* Fun rotating message */}
      <p
        className={`text-sm text-slate-400 italic h-5 transition-opacity duration-300 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {FUN_MESSAGES[messageIndex]}
      </p>

      {/* Room cards skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: progress.total || 4 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-video rounded-lg border-2 transition-all duration-500 ${
              i < progress.current
                ? 'bg-slate-900 border-slate-900'
                : 'bg-slate-50 border-slate-200 animate-pulse'
            }`}
          >
            {i < progress.current && (
              <div className="flex items-center justify-center h-full">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
