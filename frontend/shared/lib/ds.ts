/**
 * Inhabit Design System — token map for Tailwind class strings.
 * Import `ds` and compose class strings from these tokens to stay consistent.
 */
export const ds = {
  // ── Layout ──────────────────────────────────────────────────────
  page:       'bg-black text-white min-h-screen',
  container:  'max-w-7xl mx-auto px-10',
  section:    'py-20 border-t border-white/8',

  // ── Typography ──────────────────────────────────────────────────
  label:      'text-xs font-bold tracking-widest uppercase text-white/25',
  h1:         'font-black uppercase tracking-tight leading-none text-white',
  h2:         'font-black uppercase tracking-tight leading-none text-white',
  h3:         'font-bold uppercase tracking-tight text-white',
  body:       'text-white/55 text-base leading-relaxed',
  caption:    'text-white/25 text-xs font-mono tracking-wider',

  // ── Surfaces ────────────────────────────────────────────────────
  card:       'bg-white/4 border border-white/8 rounded-2xl',
  cardHover:  'hover:bg-white/7 hover:border-white/14 transition-all duration-300',
  modal:      'bg-[#111] border border-white/10 rounded-2xl',
  divider:    'border-t border-white/8',

  // ── Buttons ─────────────────────────────────────────────────────
  btnPrimary: 'px-7 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded hover:bg-white/90 transition-all active:scale-95',
  btnGhost:   'px-5 py-2.5 border border-white/20 text-white/70 text-xs font-bold uppercase tracking-widest rounded hover:bg-white/8 hover:text-white transition-all',
  btnDanger:  'px-5 py-2.5 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-500/10 transition-all',
  iconBtn:    'w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all',

  // ── Tags / Pills ─────────────────────────────────────────────────
  tag:        'px-3 py-1.5 border border-white/12 text-white/40 text-xs font-bold uppercase tracking-widest rounded-full',
  tagActive:  'px-3 py-1.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full',

  // ── Form ─────────────────────────────────────────────────────────
  input:      'w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors',

  // ── Skeleton ─────────────────────────────────────────────────────
  skeleton:   'bg-white/6 animate-pulse rounded-xl',

  // ── Nav ──────────────────────────────────────────────────────────
  navLink:    'text-white/50 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors',
  navLinkActive: 'text-white text-xs font-bold tracking-widest uppercase',
} as const;
