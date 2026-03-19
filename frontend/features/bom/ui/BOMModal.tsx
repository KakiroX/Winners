'use client';

import { useWalkthroughBOM } from '../api/getBOM';

interface Props {
  walkthroughId: string;
  onClose: () => void;
}

export function BOMModal({ walkthroughId, onClose }: Props) {
  const { data, isLoading, isError } = useWalkthroughBOM(walkthroughId);

  const items = data?.items || [];
  const logs = data?.logs || {};
  const activeRooms = Object.keys(logs);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
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

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Logs Section (Agent Activity) */}
          {activeRooms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Agent Live Logs</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRooms.map(roomLabel => (
                  <div key={roomLabel} className="bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-slate-300 shadow-inner border border-slate-800 flex flex-col h-40">
                    <div className="text-blue-400 font-bold mb-2 border-b border-slate-800 pb-1 flex justify-between">
                       <span>{roomLabel}</span>
                       <span className="opacity-50">Sourcing Agent</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                      {logs[roomLabel].map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-600">[{i}]</span>
                          <span className={log.includes('Error') ? 'text-red-400' : log.includes('Success') || log.includes('complete') ? 'text-green-400' : ''}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Section */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">Items for Purchase</h3>
            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse">Initializing agents...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 bg-red-50 rounded-2xl">
                <p className="text-red-500 font-medium text-sm text-red-600">Failed to load BOM items.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                   </svg>
                </div>
                <p className="text-slate-500 font-medium text-sm font-semibold">Scanning rooms for furniture...</p>
                <p className="text-slate-400 text-[10px] px-12">New items will appear here automatically as soon as the agents find them.</p>
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
                    {items.map((item, idx) => (
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
