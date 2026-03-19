'use client';

import { useRoomVersions, useRevertVersion } from '../api/roomVersions';
import { ds } from '@/shared/lib/ds';

interface Props {
  walkthroughId: string;
  roomId: string;
  onClose: () => void;
}

export function VersionsModal({ walkthroughId, roomId, onClose }: Props) {
  const { data: versions, isLoading } = useRoomVersions(walkthroughId, roomId);
  const revertMutation = useRevertVersion();

  const handleRevert = async (versionId: string) => {
    if (!confirm('Revert to this version? Current changes for this room will be replaced.')) return;
    await revertMutation.mutateAsync({ walkthroughId, roomId, versionId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl ${ds.modal} overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300`}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black uppercase tracking-widest text-white">Room History</h2>
            <p className={`${ds.label} mt-1`}>Track and revert to previous versions</p>
          </div>
          <button onClick={onClose} className={ds.iconBtn}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest animate-pulse">Loading history...</p>
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 bg-white/3 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No versions found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v, idx) => (
                <div
                  key={v.id}
                  className={`${ds.card} ${ds.cardHover} flex gap-5 p-4`}
                >
                  {/* Thumbnail */}
                  <div className="w-28 h-18 rounded-lg overflow-hidden border border-white/8 bg-white/4 flex-shrink-0">
                    <img src={v.image_url} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded">
                        Version {versions.length - idx}
                      </span>
                      <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest truncate">
                        {v.id.split('_')[0]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white/70 line-clamp-1">{v.prompt_used || 'Initial Generation'}</p>
                    <p className="text-[10px] text-white/25 font-medium">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => handleRevert(v.id)}
                      disabled={revertMutation.isPending}
                      className={`${ds.btnGhost} disabled:opacity-40`}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
