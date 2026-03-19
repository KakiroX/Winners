'use client';

import { useStyleStore } from '../model/useStyleStore';
import { ds } from '@/shared/lib/ds';

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

  const toggle = (preset: string) => {
    const lower = preset.toLowerCase();
    const current = stylePrompt.trim();
    if (current.toLowerCase().includes(lower)) {
      setStylePrompt(current.replace(new RegExp(`,?\\s*${preset}`, 'i'), '').replace(/^,\s*/, '').trim());
    } else {
      setStylePrompt(current ? `${current}, ${lower}` : lower);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={stylePrompt}
        onChange={(e) => setStylePrompt(e.target.value)}
        placeholder="Warm wood tones, large windows, soft ambient lighting..."
        rows={3}
        className={ds.input}
      />
      <div className="flex flex-wrap gap-2">
        {STYLE_PRESETS.map((preset) => {
          const active = stylePrompt.toLowerCase().includes(preset.toLowerCase());
          return (
            <button
              key={preset}
              type="button"
              onClick={() => toggle(preset)}
              className={active ? ds.tagActive : ds.tag}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
}
