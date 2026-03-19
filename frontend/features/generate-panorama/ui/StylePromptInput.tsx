'use client';

import { useStyleStore } from '../model/useStyleStore';

const STYLE_PRESETS = [
  'Scandinavian minimalist',
  'Warm japandi',
  'Industrial loft',
  'Mid-century modern',
  'Coastal Mediterranean',
  'Dark luxury',
  'Bohemian eclectic',
  'Contemporary clean',
];

export function StylePromptInput() {
  const { stylePrompt, setStylePrompt } = useStyleStore();

  return (
    <div className="w-full max-w-2xl space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Style & atmosphere
        <span className="text-slate-400 font-normal ml-1">(optional)</span>
      </label>
      <textarea
        value={stylePrompt}
        onChange={(e) => setStylePrompt(e.target.value)}
        placeholder="Describe the style you want... e.g. 'Warm wood tones, large windows with city view, soft ambient lighting, plants everywhere'"
        rows={3}
        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none"
      />
      <div className="flex flex-wrap gap-2">
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              const current = stylePrompt.trim();
              if (current.toLowerCase().includes(preset.toLowerCase())) return;
              setStylePrompt(current ? `${current}, ${preset.toLowerCase()}` : preset.toLowerCase());
            }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              stylePrompt.toLowerCase().includes(preset.toLowerCase())
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
