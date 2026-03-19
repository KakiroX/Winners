'use client';

import { useAuthStore } from '@/features/auth';
import { PromptInputWidget } from '@/widgets/prompt-input';

export function HomePage() {
  const { openSignup } = useAuthStore();

  return (
    <main className="min-h-screen pt-20 bg-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Design your space <br />
            <span className="text-blue-600 italic font-medium">in seconds.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 font-medium">
            Generate 2D floor plans and 360° virtual rooms using advanced AI. Real furniture sourcing included.
          </p>
          <div className="pt-4 max-w-md mx-auto lg:mx-0">
             <PromptInputWidget />
          </div>
        </div>
        <div className="hidden lg:block relative group">
           <div className="absolute -inset-4 bg-blue-100 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
           <div className="relative aspect-square rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200" 
                alt="AI Design" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
           </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">
           {[
             { title: 'AI Planning', desc: 'Create complex floor plans from simple text prompts.', icon: 'M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789l5.447-2.724a2 2 0 011.894 0l5.447 2.724A2 2 0 0118 6v9.487a2 2 0 01-1.106 1.789L11.447 20a2 2 0 01-1.894 0z' },
             { title: '360° Studio', desc: 'Immersive virtual walkthroughs with surgical in-context editing.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
             { title: 'Smart Sourcing', desc: 'Automatic BOM generation with real-world product links.', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }
           ].map((f, i) => (
             <div key={i} className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{f.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
         <h2 className="text-4xl font-black text-slate-900">Ready to design?</h2>
         <p className="text-slate-500 text-lg font-medium">Join thousands of architects and homeowners building with Inhabit.</p>
         <button onClick={openSignup} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95">Get Started Free</button>
      </section>

      <footer className="border-t border-slate-100 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
         &copy; 2026 INHABIT AI DESIGN.
      </footer>
    </main>
  );
}
