'use client';

import { useWalkthroughBOM } from '../api/getBOM';

interface Props {
  walkthroughId: string;
  onClose: () => void;
}

export function BOMModal({ walkthroughId, onClose }: Props) {
  const { data, isLoading, isError } = useWalkthroughBOM(walkthroughId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Project Bill of Materials</h2>
            <p className="text-sm text-slate-500 font-medium">Sourced furniture and decor items</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium animate-pulse">Sourcing items with background agents...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-medium">Failed to load BOM.</p>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                 </svg>
              </div>
              <p className="text-slate-500 font-medium">No items detected yet.</p>
              <p className="text-slate-400 text-xs px-12">Our agents are scanning your rooms. This usually takes 10-20 seconds after generation or edit.</p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4 text-center">Room</th>
                    <th className="px-6 py-4 text-right">Estimate</th>
                    <th className="px-6 py-4 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{item.room_label}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">{item.price}</td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View Item
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
           >
             Close BOM
           </button>
        </div>
      </div>
    </div>
  );
}
