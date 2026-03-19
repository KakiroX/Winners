'use client';

import { useWalkthroughBOM } from '../api/getBOM';
import { ds } from '@/shared/lib/ds';

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl ${ds.modal} overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300`}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black uppercase tracking-widest text-white">Project Bill of Materials</h2>
            <p className={`${ds.label} mt-1`}>Sourced furniture and decor items</p>
          </div>
          <button onClick={onClose} className={ds.iconBtn}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Agent Live Logs */}
          {activeRooms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className={ds.label}>Agent Live Logs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRooms.map((roomLabel) => (
                  <div key={roomLabel} className="bg-black/60 border border-white/8 rounded-xl p-4 font-mono text-[10px] text-white/40 flex flex-col h-40">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/8">
                      <span className="text-white/70 font-bold uppercase tracking-widest">{roomLabel}</span>
                      <span className="text-white/20 uppercase tracking-widest">Sourcing Agent</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1">
                      {logs[roomLabel].map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-white/20">[{i}]</span>
                          <span className={
                            log.includes('Error') ? 'text-red-400/70' :
                            log.includes('Success') || log.includes('complete') ? 'text-green-400/70' :
                            'text-white/40'
                          }>
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

          {/* Items for Purchase */}
          <div className="space-y-3">
            <span className={ds.label}>Items for Purchase</span>

            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-4 bg-white/3 border border-dashed border-white/10 rounded-xl">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing agents...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-red-400/70 text-xs font-bold uppercase tracking-widest">Failed to load BOM items.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 bg-white/3 border border-dashed border-white/10 rounded-xl">
                <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Scanning rooms for furniture...</p>
                <p className="text-white/20 text-[10px] text-center px-12">Items appear here automatically as agents source them.</p>
              </div>
            ) : (
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/4 border-b border-white/8">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/25">Item Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/25 text-center">Room</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/25 text-right">Estimate</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/25 text-right">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white/70">{item.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={ds.tag}>{item.room_label}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-white/55">{item.price}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/8 flex justify-end shrink-0">
          <button onClick={onClose} className={ds.btnGhost}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
