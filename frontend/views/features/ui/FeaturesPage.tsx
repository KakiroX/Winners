'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FEATURES = [
  {
    index: '01',
    title: 'AI Floor Planning',
    subtitle: 'From words to walls.',
    description:
      'Describe your dream space in plain language. Dehabit interprets your intent and generates 3–4 distinct, fully-structured floor plan variants in seconds — each with room dimensions, adjacency logic, and natural light scoring.',
    tags: ['2D Schema', 'Grid Layout', 'Room Intelligence'],
    visual: <FloorPlanVisual />,
    bg: 'bg-black',
    accent: 'text-white',
  },
  {
    index: '02',
    title: '360° Virtual Studio',
    subtitle: 'Step inside before you build.',
    description:
      'Select a floor plan and watch it come alive as a fully immersive 360° panorama. Every room is rendered with AI-generated spatial depth — ready to walk through, share, and iterate on.',
    tags: ['Panoramic AI', 'Spatial Depth', 'Real-time Preview'],
    visual: <PanoramaVisual />,
    bg: 'bg-neutral-950',
    accent: 'text-white',
  },
  {
    index: '03',
    title: 'Smart Sourcing',
    subtitle: 'Design to doorstep.',
    description:
      'Every generated room ships with a complete Bill of Materials — real furniture, finishes, and fixtures matched to your aesthetic. Direct product links included. No mood boards, no guesswork.',
    tags: ['BOM Generation', 'Product Matching', 'Style DNA'],
    visual: <BOMVisual />,
    bg: 'bg-black',
    accent: 'text-white',
  },
];

export function FeaturesPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero title stagger
      gsap.from('.hero-word', {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.12,
      });

      gsap.from('.hero-sub', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.6,
      });

      gsap.from('.hero-cta', {
        opacity: 0,
        y: 16,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.9,
      });

      // Horizontal rule expand
      gsap.from('.hero-line', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power4.inOut',
        delay: 0.3,
      });

      // Feature sections — scroll-triggered
      gsap.utils.toArray<HTMLElement>('.feature-section').forEach((section) => {
        const index = section.querySelector('.feat-index');
        const title = section.querySelector('.feat-title');
        const sub = section.querySelector('.feat-sub');
        const desc = section.querySelector('.feat-desc');
        const tags = section.querySelectorAll('.feat-tag');
        const visual = section.querySelector('.feat-visual');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        });

        tl.from(index, { xPercent: -30, opacity: 0, duration: 0.5, ease: 'power3.out' })
          .from(title, { yPercent: 60, opacity: 0, duration: 0.7, ease: 'power4.out' }, '-=0.2')
          .from(sub, { opacity: 0, y: 12, duration: 0.5, ease: 'power3.out' }, '-=0.3')
          .from(desc, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' }, '-=0.2')
          .from(tags, { opacity: 0, x: -12, stagger: 0.08, duration: 0.4, ease: 'power2.out' }, '-=0.3')
          .from(visual, { opacity: 0, scale: 0.94, duration: 0.9, ease: 'power3.out' }, '-=0.6');
      });

      // Footer CTA
      gsap.from('.cta-section', {
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Floating nav links
      gsap.from('.nav-item', {
        opacity: 0,
        y: -10,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="bg-black text-white overflow-x-hidden">
      {/* Inline nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-7 mix-blend-difference">
        <Link href="/" className="nav-item flex items-center gap-3">
          <div className="w-7 h-7 border border-white/40 rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 border border-white rounded-sm rotate-45" />
          </div>
          <span className="text-white text-xs font-bold tracking-widest uppercase">Dehabit</span>
        </Link>
        <div className="flex items-center gap-8 text-white/60 text-xs font-medium tracking-widest uppercase">
          <Link href="/" className="nav-item hover:text-white transition-colors">Home</Link>
          <Link href="/features" className="nav-item text-white">Features</Link>
          <Link href="/generate" className="nav-item hover:text-white transition-colors">Generate</Link>
        </div>
        <Link
          href="/generate"
          className="nav-item px-5 py-2 bg-white text-black text-xs font-bold tracking-widest uppercase rounded hover:bg-white/90 transition-all active:scale-95"
        >
          Try Free
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col justify-end px-10 pb-16 pt-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="overflow-hidden mb-6">
            <div className="flex flex-wrap gap-x-6">
              {['Every', 'Tool', 'You', 'Need.'].map((w) => (
                <span key={w} className="hero-word inline-block text-[clamp(4rem,12vw,10rem)] font-black uppercase tracking-tight leading-none">
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-line w-full h-px bg-white/20 mb-8" />

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <p className="hero-sub text-white/50 text-lg font-medium max-w-lg leading-relaxed">
              From first prompt to furnished room — Dehabit handles every step with generative AI built for spatial design.
            </p>
            <Link
              href="/generate"
              className="hero-cta inline-block px-8 py-4 bg-white text-black text-sm font-bold uppercase tracking-widest rounded hover:bg-white/90 transition-all active:scale-95 whitespace-nowrap"
            >
              Start Designing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Sections ── */}
      {FEATURES.map((feat, i) => (
        <section
          key={feat.index}
          className={`feature-section ${feat.bg} border-b border-white/10`}
        >
          <div className="max-w-7xl mx-auto px-10 py-28 grid lg:grid-cols-2 gap-16 items-center">
            {/* Text — alternates side */}
            <div className={`space-y-8 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
              <div className="feat-index text-white/20 text-sm font-bold tracking-widest uppercase">
                {feat.index} / 03
              </div>
              <div className="overflow-hidden">
                <h2 className="feat-title text-[clamp(2.5rem,6vw,5rem)] font-black uppercase tracking-tight leading-none text-white">
                  {feat.title}
                </h2>
              </div>
              <p className="feat-sub text-white/40 text-base font-semibold uppercase tracking-widest">
                {feat.subtitle}
              </p>
              <p className="feat-desc text-white/60 text-base leading-relaxed max-w-md">
                {feat.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {feat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="feat-tag px-4 py-2 border border-white/15 text-white/50 text-xs font-bold uppercase tracking-widest rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className={`feat-visual ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              {feat.visual}
            </div>
          </div>
        </section>
      ))}

      {/* ── CTA ── */}
      <section className="cta-section min-h-[60vh] flex items-center justify-center px-10 py-32">
        <div className="text-center space-y-8 max-w-3xl">
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase">Ready?</p>
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-black uppercase tracking-tight leading-none text-white">
            Design starts here.
          </h2>
          <p className="text-white/50 text-lg font-medium">
            Generate your first floor plan in under 30 seconds. No account needed.
          </p>
          <Link
            href="/generate"
            className="inline-block px-10 py-5 bg-white text-black text-sm font-black uppercase tracking-widest rounded hover:bg-white/90 transition-all active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-10 flex items-center justify-between text-white/20 text-xs font-bold uppercase tracking-widest">
        <span>&copy; 2026 Dehabit AI</span>
        <Link href="/" className="hover:text-white/50 transition-colors">Back to Home</Link>
      </footer>
    </div>
  );
}

// ── Visuals ────────────────────────────────────────────────

function FloorPlanVisual() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const rooms = ref.current.querySelectorAll('.room');
    const labels = ref.current.querySelectorAll('.room-label');

    gsap.from(rooms, {
      opacity: 0,
      scale: 0.85,
      transformOrigin: 'center center',
      stagger: 0.12,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });

    gsap.from(labels, {
      opacity: 0,
      duration: 0.4,
      stagger: 0.1,
      delay: 0.5,
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
  }, []);

  return (
    <div className="relative aspect-square max-w-lg mx-auto">
      <div className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10" />
      <svg ref={ref} viewBox="0 0 400 400" className="w-full h-full p-8">
        {/* Grid lines */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
        ))}

        {/* Rooms */}
        <rect className="room" x="20" y="20" width="160" height="120" rx="4" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
        <text className="room-label" x="100" y="90" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="11" fontFamily="monospace">LIVING ROOM</text>

        <rect className="room" x="200" y="20" width="180" height="120" rx="4" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <text className="room-label" x="290" y="90" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="11" fontFamily="monospace">KITCHEN</text>

        <rect className="room" x="20" y="160" width="100" height="100" rx="4" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <text className="room-label" x="70" y="217" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="10" fontFamily="monospace">BEDROOM</text>

        <rect className="room" x="140" y="160" width="80" height="100" rx="4" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" />
        <text className="room-label" x="180" y="217" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="9" fontFamily="monospace">BATH</text>

        <rect className="room" x="240" y="160" width="140" height="100" rx="4" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <text className="room-label" x="310" y="217" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="10" fontFamily="monospace">OFFICE</text>

        <rect className="room" x="20" y="280" width="360" height="100" rx="4" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" />
        <text className="room-label" x="200" y="337" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="11" fontFamily="monospace">DINING ROOM</text>

        {/* Connection dots */}
        <circle cx="140" cy="80" r="3" fill="white" fillOpacity="0.4" />
        <circle cx="200" cy="80" r="3" fill="white" fillOpacity="0.4" />
        <circle cx="100" cy="160" r="3" fill="white" fillOpacity="0.4" />
      </svg>

      {/* Corner badge */}
      <div className="absolute top-4 right-4 text-white/20 text-xs font-mono tracking-widest">
        85 m²
      </div>
    </div>
  );
}

function PanoramaVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const lines = ref.current.querySelectorAll('.perspective-line');
    gsap.from(lines, {
      scaleX: 0,
      transformOrigin: 'center center',
      stagger: 0.05,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
  }, []);

  return (
    <div ref={ref} className="relative aspect-video max-w-lg mx-auto overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Pseudo-panorama perspective grid */}
      <svg viewBox="0 0 560 315" className="w-full h-full">
        {/* Gradient fill */}
        <defs>
          <radialGradient id="panoGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.07" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.03" />
            <stop offset="100%" stopColor="white" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <rect width="560" height="315" fill="url(#panoGrad)" />

        {/* Floor */}
        <polygon points="0,315 560,315 420,200 140,200" fill="url(#floorGrad)" />

        {/* Ceiling */}
        <polygon points="0,0 560,0 420,115 140,115" fill="white" fillOpacity="0.02" />

        {/* Left wall */}
        <polygon points="0,0 140,115 140,200 0,315" fill="white" fillOpacity="0.03" />
        {/* Right wall */}
        <polygon points="560,0 420,115 420,200 560,315" fill="white" fillOpacity="0.03" />

        {/* Perspective lines */}
        {[
          [0, 0, 140, 115], [0, 63, 140, 138], [0, 126, 140, 160],
          [0, 189, 140, 183], [0, 252, 140, 200],
          [560, 0, 420, 115], [560, 63, 420, 138], [560, 126, 420, 160],
          [560, 189, 420, 183], [560, 252, 420, 200],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            className="perspective-line"
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white" strokeOpacity="0.08" strokeWidth="1"
          />
        ))}

        {/* Window */}
        <rect x="200" y="120" width="160" height="75" rx="2" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
        <line x1="280" y1="120" x2="280" y2="195" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
        <line x1="200" y1="157" x2="360" y2="157" stroke="white" strokeOpacity="0.1" strokeWidth="1" />

        {/* 360 badge */}
        <text x="280" y="160" textAnchor="middle" fill="white" fillOpacity="0.15" fontSize="40" fontWeight="900" fontFamily="Arial">360°</text>
      </svg>

      {/* Hotspot dots */}
      {[
        { top: '40%', left: '30%' },
        { top: '55%', left: '65%' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 rounded-full border border-white/40 flex items-center justify-center"
          style={pos}
        >
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-ping" />
        </div>
      ))}

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-white/30 text-xs font-mono tracking-widest">PANORAMIC VIEW</div>
    </div>
  );
}

function BOMVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const rows = ref.current.querySelectorAll('.bom-row');
    gsap.from(rows, {
      x: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
  }, []);

  const items = [
    { name: 'Modular Sofa', brand: 'Poliform', price: '$4,200', tag: 'Living' },
    { name: 'Marble Dining Table', brand: 'Minotti', price: '$6,800', tag: 'Dining' },
    { name: 'Pendant Light', brand: 'Flos', price: '$1,100', tag: 'Kitchen' },
    { name: 'Platform Bed Frame', brand: 'B&B Italia', price: '$3,500', tag: 'Bedroom' },
    { name: 'Lounge Chair', brand: 'Knoll', price: '$2,900', tag: 'Office' },
  ];

  return (
    <div ref={ref} className="max-w-lg mx-auto space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-white/25 text-xs font-bold uppercase tracking-widest">
        <span>Item</span>
        <div className="flex gap-12">
          <span>Brand</span>
          <span>Price</span>
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.name}
          className="bom-row flex items-center justify-between px-4 py-4 rounded-lg border border-white/8 bg-white/4 hover:bg-white/8 transition-all cursor-default group"
        >
          <div className="space-y-1">
            <p className="text-white/80 text-sm font-semibold">{item.name}</p>
            <span className="inline-block px-2 py-0.5 bg-white/10 text-white/40 text-xs rounded-full font-mono">
              {item.tag}
            </span>
          </div>
          <div className="flex items-center gap-10 text-sm">
            <span className="text-white/30 font-medium">{item.brand}</span>
            <span className="text-white/70 font-bold tabular-nums">{item.price}</span>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-white/15 mt-4">
        <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Total Estimate</span>
        <span className="text-white font-black text-lg tabular-nums">$18,500</span>
      </div>
    </div>
  );
}
