'use client';

import { useRoomVersions, useRevertVersion } from '../api/roomVersions';
import { useViewerStore } from '@/features/panorama-viewer';

interface Props {
  walkthroughId: string;
  roomId: string;
  onClose: () => void;
}

export function VersionsModal({ walkthroughId, roomId, onClose }: Props) {
  const { data: versions, isLoading } = useRoomVersions(walkthroughId, roomId);
  const revertMutation = useRevertVersion();
  const { currentSceneId } = useViewerStore();

  const handleRevert = async (versionId: string) => {
    if (!confirm('Revert to this version? Current changes for this room will be replaced.')) return;
    
    await revertMutation.mutateAsync({
      walkthroughId,
      roomId,
      versionId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Room History</h2>
            <p className="text-sm text-slate-500 font-medium">Track and revert to previous versions</p>
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

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium animate-pulse">Loading version history...</p>
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium text-sm">No versions found for this room.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((v, idx) => (
                <div 
                  key={v.id} 
                  className="group relative flex gap-6 p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <img src={v.image_url} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md uppercase tracking-wider">
                         Version {versions.length - idx}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                         {v.id.split('_')[0]}
                       </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{v.prompt_used || 'Initial Generation'}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleRevert(v.id)}
                      disabled={revertMutation.isPending}
                      className="px-4 py-2 bg-white border-2 border-slate-900 text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
           >
             Close History
           </button>
        </div>
      </div>
    </div>
  );
}
