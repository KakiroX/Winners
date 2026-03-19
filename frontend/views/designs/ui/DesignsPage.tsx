'use client';

import { useAuthStore } from '@/features/auth';
import { useWalkthroughs } from '@/features/generate-panorama/api/listWalkthroughs';
import { PlanViewerWidget } from '@/widgets/plan-viewer';
import Link from 'next/link';
import { useState } from 'react';

export function DesignsPage() {
  const { user } = useAuthStore();
  const userId = user?.id || "guest";
  const { data: walkthroughs, isLoading } = useWalkthroughs(userId);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  return (
    <main className="min-h-screen pt-32 pb-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Designs</h1>
          <p className="text-slate-500 font-medium">Manage and explore your generated spaces.</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : !walkthroughs || walkthroughs.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div className="space-y-2">
               <h3 className="text-xl font-bold text-slate-900">No designs found</h3>
               <p className="text-slate-500 text-sm max-w-xs mx-auto">Start by creating a new interior design from the home page.</p>
            </div>
            <Link href="/" className="inline-block px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
               Create New Design
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {walkthroughs.map((wt: any) => (
              <div key={wt.id} className="group bg-white rounded-[32px] border border-slate-200 p-8 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col justify-between h-full text-slate-900">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">360 Walkthrough</span>
                     <span className="text-[10px] font-bold text-slate-400">{new Date(wt.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{wt.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                     <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {wt.room_count} Rooms
                     </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-3">
                   <Link 
                     href={`/walkthrough/${wt.id}`}
                     className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-200"
                   >
                     Go to 3D View
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </Link>
                   
                   {wt.floor_plan_metadata && (
                     <button 
                       onClick={() => setSelectedPlan(wt.floor_plan_metadata)}
                       className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-300"
                     >
                       Show Floor Plan
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.487V6a2 2 0 011.106-1.789l5.447-2.724a2 2 0 011.894 0l5.447 2.724A2 2 0 0118 6v9.487a2 2 0 01-1.106 1.789L11.447 20a2 2 0 01-1.894 0z" /></svg>
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floor Plan Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900">
           <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Floor Plan Layout</h2>
                    <p className="text-sm text-slate-500 font-medium">{selectedPlan.variant_label}</p>
                 </div>
                 <button 
                   onClick={() => setSelectedPlan(null)}
                   className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                 >
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center gap-10">
                 <PlanViewerWidget plan={selectedPlan} />
                 
                 <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Area</p>
                       <p className="text-xl font-black text-slate-900">{selectedPlan.total_area_sqm} m²</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rooms</p>
                       <p className="text-xl font-black text-slate-900">{selectedPlan.rooms.length}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grid Size</p>
                       <p className="text-xl font-black text-slate-900">{selectedPlan.grid_cols}x{selectedPlan.grid_rows}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Style</p>
                       <p className="text-lg font-black text-slate-900 truncate" title={selectedPlan.aesthetic_tags.join(', ')}>
                          {selectedPlan.aesthetic_tags[0] || 'Modern'}
                       </p>
                    </div>
                 </div>
              </div>
              <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button 
                   onClick={() => setSelectedPlan(null)}
                   className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                 >
                   Close Plan
                 </button>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
