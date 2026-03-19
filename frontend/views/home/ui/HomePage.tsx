'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuthStore } from '@/features/auth';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=2000',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=2000',
];

const FEATURES = [
  {
    index: '01',
    title: 'AI Floor\nPlanning',
    subtitle: 'From words to walls.',
    description:
      'Describe your space in plain language. Dehabit generates 3–4 distinct floor plan variants in seconds — complete with room dimensions, adjacency logic, and natural light scoring.',
    tags: ['2D Schema', 'Grid Layout', 'Room Intelligence'],
    visual: <FloorPlanVisual />,
  },
  {
    index: '02',
    title: '360°\nStudio',
    subtitle: 'Step inside before you build.',
    description:
      'Select a floor plan and watch it come alive as an immersive 360° panorama. Every room rendered with spatial AI depth — ready to walk through, share, and iterate on.',
    tags: ['Panoramic AI', 'Spatial Depth', 'Real-time Preview'],
    visual: <PanoramaVisual />,
  },
  {
    index: '03',
    title: 'Smart\nSourcing',
    subtitle: 'Design to doorstep.',
    description:
      'Every room ships with a complete Bill of Materials — real furniture matched to your aesthetic with direct product links. No mood boards. No guesswork.',
    tags: ['BOM Generation', 'Product Matching', 'Style DNA'],
    visual: <BOMVisual />,
  },
];

export function HomePage() {
  const { user, openLogin, openSignup } = useAuthStore();
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Feature sections
      gsap.utils.toArray<HTMLElement>('.feature-section').forEach((section) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        });

        tl.from(section.querySelector('.feat-index'), {
          x: -20, opacity: 0, duration: 0.45, ease: 'power3.out',
        })
          .from(section.querySelector('.feat-title'), {
            yPercent: 50, opacity: 0, duration: 0.65, ease: 'power4.out',
          }, '-=0.2')
          .from(section.querySelector('.feat-sub'), {
            opacity: 0, y: 10, duration: 0.45, ease: 'power2.out',
          }, '-=0.3')
          .from(section.querySelector('.feat-desc'), {
            opacity: 0, y: 14, duration: 0.5, ease: 'power2.out',
          }, '-=0.2')
          .from(section.querySelectorAll('.feat-tag'), {
            opacity: 0, x: -10, stagger: 0.07, duration: 0.35, ease: 'power2.out',
          }, '-=0.3')
          .from(section.querySelector('.feat-visual'), {
            opacity: 0, scale: 0.95, duration: 0.75, ease: 'power3.out',
          }, '-=0.55');
      });

      // Divider lines expand
      gsap.utils.toArray<HTMLElement>('.section-line').forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: line, start: 'top 85%' },
        });
      });

      // CTA
      gsap.from('.home-cta', {
        scrollTrigger: { trigger: '.home-cta', start: 'top 75%' },
        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
      });
    },
    { scope: containerRef },
  );

  return (
    <main ref={containerRef} className="bg-black text-white">
      {/* ── Hero ── */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES[0]}
            alt="Luxury Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        {/* Navbar */}
        <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-10 py-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/30 rounded flex items-center justify-center">
              <div className="w-3 h-3 border border-white rounded-sm rotate-45" />
            </div>
            <span className="text-white text-sm font-bold tracking-widest uppercase">Dehabit</span>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-white/60 text-xs font-medium tracking-widest uppercase">
            <Link href="/designs" className="hover:text-white transition-colors">Designs</Link>
            <Link href="/generate" className="hover:text-white transition-colors">Generate</Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => router.push('/designs')}
                className="px-5 py-2 border border-white/30 text-white text-xs font-bold tracking-widest uppercase rounded hover:bg-white/10 transition-all"
              >
                My Designs
              </button>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="text-white/60 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignup}
                  className="px-5 py-2 bg-white text-black text-xs font-bold tracking-widest uppercase rounded hover:bg-white/90 transition-all active:scale-95"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Bottom content */}
        <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
          <div className="space-y-5 max-w-xl">
            <p className="text-white/50 text-xs font-semibold tracking-widest uppercase">Dehabit AI</p>
            <h1 className="text-white text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.05]">
              Design Your Space<br />In Seconds.
            </h1>
            <Link
              href="/generate"
              className="inline-block px-7 py-3 bg-white text-black text-xs font-bold tracking-widest uppercase rounded hover:bg-white/90 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center gap-1">
            <div className="w-px h-8 bg-white/30" />
            <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Image thumbnails */}
          <div className="flex items-center gap-2">
            {HERO_IMAGES.map((src, i) => (
              <div
                key={i}
                className={`rounded overflow-hidden transition-all ${i === 0 ? 'w-12 h-9 opacity-100' : 'w-10 h-8 opacity-40'}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-10 pt-24 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-16">
            <p className="text-white/25 text-xs font-bold tracking-widest uppercase">What we do</p>
            <div className="section-line flex-1 mx-8 h-px bg-white/10" />
            <p className="text-white/25 text-xs font-bold tracking-widest uppercase">03 Features</p>
          </div>
        </div>
      </section>

      {FEATURES.map((feat, i) => (
        <section
          key={feat.index}
          className="feature-section px-10 py-20 border-t border-white/8"
        >
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div className={`space-y-7 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
              <span className="feat-index text-white/20 text-xs font-bold tracking-widest uppercase">
                {feat.index} / 03
              </span>
              <div className="overflow-hidden">
                <h2 className="feat-title text-[clamp(2.8rem,5.5vw,4.5rem)] font-black uppercase tracking-tight leading-none whitespace-pre-line text-white">
                  {feat.title}
                </h2>
              </div>
              <p className="feat-sub text-white/35 text-sm font-semibold uppercase tracking-widest">
                {feat.subtitle}
              </p>
              <p className="feat-desc text-white/55 text-base leading-relaxed max-w-md">
                {feat.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {feat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="feat-tag px-4 py-1.5 border border-white/12 text-white/40 text-xs font-bold uppercase tracking-widest rounded-full"
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
      <section className="home-cta px-10 py-32 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <h2 className="text-[clamp(3rem,8vw,6.5rem)] font-black uppercase tracking-tight leading-none text-white">
            Start<br />Designing.
          </h2>
          <div className="space-y-5 max-w-sm">
            <p className="text-white/50 text-base leading-relaxed">
              Generate your first floor plan in under 30 seconds. No account needed to try.
            </p>
            <Link
              href="/generate"
              className="inline-block px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded hover:bg-white/90 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-10 flex items-center justify-between text-white/20 text-xs font-bold uppercase tracking-widest">
        <span>&copy; 2026 Dehabit AI</span>
        <Link href="/generate" className="hover:text-white/50 transition-colors">Generate a design →</Link>
      </footer>
    </main>
  );
}

// ── Visuals ─────────────────────────────────────────────

function FloorPlanVisual() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const rooms = ref.current.querySelectorAll('.room');
    const labels = ref.current.querySelectorAll('.room-label');
    gsap.from(rooms, {
      opacity: 0, scale: 0.88, transformOrigin: 'center center',
      stagger: 0.1, duration: 0.55, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
    gsap.from(labels, {
      opacity: 0, duration: 0.4, stagger: 0.08, delay: 0.4,
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
  }, []);

  return (
    <div className="relative aspect-square max-w-lg mx-auto">
      <div className="absolute inset-0 bg-white/4 rounded-2xl border border-white/8" />
      <svg ref={ref} viewBox="0 0 400 400" className="w-full h-full p-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
        ))}
        <rect className="room" x="20" y="20" width="160" height="120" rx="3" fill="white" fillOpacity="0.07" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" />
        <text className="room-label" x="100" y="88" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="10" fontFamily="monospace">LIVING ROOM</text>
        <rect className="room" x="200" y="20" width="180" height="120" rx="3" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        <text className="room-label" x="290" y="88" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="10" fontFamily="monospace">KITCHEN</text>
        <rect className="room" x="20" y="160" width="100" height="100" rx="3" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        <text className="room-label" x="70" y="217" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="9" fontFamily="monospace">BEDROOM</text>
        <rect className="room" x="140" y="160" width="80" height="100" rx="3" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.14" strokeWidth="1.5" />
        <text className="room-label" x="180" y="217" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="9" fontFamily="monospace">BATH</text>
        <rect className="room" x="240" y="160" width="140" height="100" rx="3" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        <text className="room-label" x="310" y="217" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="9" fontFamily="monospace">OFFICE</text>
        <rect className="room" x="20" y="280" width="360" height="100" rx="3" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.14" strokeWidth="1.5" />
        <text className="room-label" x="200" y="337" textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="10" fontFamily="monospace">DINING ROOM</text>
        <circle cx="140" cy="80" r="3" fill="white" fillOpacity="0.35" />
        <circle cx="200" cy="80" r="3" fill="white" fillOpacity="0.35" />
        <circle cx="100" cy="160" r="3" fill="white" fillOpacity="0.35" />
      </svg>
      <div className="absolute top-4 right-4 text-white/18 text-xs font-mono tracking-widest">85 m²</div>
    </div>
  );
}

function PanoramaVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current.querySelectorAll('.p-line'), {
      scaleX: 0, transformOrigin: 'center center',
      stagger: 0.04, duration: 0.55, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 75%' },
    });
  }, []);

  return (
    <div ref={ref} className="relative aspect-video max-w-lg mx-auto overflow-hidden rounded-2xl border border-white/8 bg-white/4">
      <svg viewBox="0 0 560 315" className="w-full h-full">
        <defs>
          <radialGradient id="pg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.02" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect width="560" height="315" fill="url(#pg)" />
        <polygon points="0,315 560,315 420,200 140,200" fill="url(#fg)" />
        <polygon points="0,0 560,0 420,115 140,115" fill="white" fillOpacity="0.02" />
        <polygon points="0,0 140,115 140,200 0,315" fill="white" fillOpacity="0.025" />
        <polygon points="560,0 420,115 420,200 560,315" fill="white" fillOpacity="0.025" />
        {[
          [0,0,140,115],[0,63,140,138],[0,126,140,160],[0,189,140,183],[0,252,140,200],
          [560,0,420,115],[560,63,420,138],[560,126,420,160],[560,189,420,183],[560,252,420,200],
        ].map(([x1,y1,x2,y2],i)=>(
          <line key={i} className="p-line" x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.07" strokeWidth="1"/>
        ))}
        <rect x="200" y="120" width="160" height="75" rx="2" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
        <line x1="280" y1="120" x2="280" y2="195" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
        <line x1="200" y1="157" x2="360" y2="157" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
        <text x="280" y="170" textAnchor="middle" fill="white" fillOpacity="0.1" fontSize="38" fontWeight="900" fontFamily="Arial">360°</text>
      </svg>
      {[{top:'38%',left:'28%'},{top:'54%',left:'62%'}].map((pos,i)=>(
        <div key={i} className="absolute w-4 h-4 rounded-full border border-white/35 flex items-center justify-center" style={pos}>
          <div className="w-1.5 h-1.5 bg-white/55 rounded-full animate-ping"/>
        </div>
      ))}
      <div className="absolute bottom-4 left-4 text-white/25 text-xs font-mono tracking-widest">PANORAMIC VIEW</div>
    </div>
  );
}

function BOMVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current.querySelectorAll('.bom-row'), {
      x: 24, opacity: 0, stagger: 0.09, duration: 0.45, ease: 'power3.out',
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
    <div ref={ref} className="max-w-lg mx-auto space-y-1.5">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 text-white/22 text-xs font-bold uppercase tracking-widest mb-1">
        <span>Item</span>
        <div className="flex gap-10"><span>Brand</span><span>Price</span></div>
      </div>
      {items.map((item) => (
        <div key={item.name} className="bom-row flex items-center justify-between px-4 py-3.5 rounded-lg border border-white/7 bg-white/3 hover:bg-white/7 transition-all cursor-default">
          <div className="space-y-1">
            <p className="text-white/75 text-sm font-semibold">{item.name}</p>
            <span className="inline-block px-2 py-0.5 bg-white/8 text-white/35 text-xs rounded-full font-mono">{item.tag}</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <span className="text-white/28 font-medium">{item.brand}</span>
            <span className="text-white/65 font-bold tabular-nums">{item.price}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-4 border-t border-white/12 mt-2">
        <span className="text-white/25 text-xs font-bold uppercase tracking-widest">Total Estimate</span>
        <span className="text-white font-black text-lg tabular-nums">$18,500</span>
      </div>
    </div>
  );
}
