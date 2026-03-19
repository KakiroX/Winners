'use client';

import { useEditStore } from '../model/useEditStore';
import { useEditRoom } from '../api/editPanorama';
import { usePanoramaStore } from '@/features/generate-panorama';

interface Props {
  walkthroughId: string;
  roomId: string;
}

export function EditPanel({ walkthroughId, roomId }: Props) {
  const { selectedPoint, editPrompt, isEditing, setEditPrompt, setIsEditing, clearSelection } =
    useEditStore();
  const mutation = useEditRoom();
  const { walkthrough, updateWalkthrough } = usePanoramaStore();

  if (!selectedPoint) return null;

  const handleApply = () => {
    if (!editPrompt.trim()) return;

    setIsEditing(true);
    mutation.mutate(
      {
        walkthroughId,
        roomId,
        prompt: editPrompt,
        pitch: selectedPoint.pitch,
        yaw: selectedPoint.yaw,
      },
      {
        onSuccess: (data) => {
          // Update the walkthrough with new panorama URL
          if (walkthrough) {
            const updatedRooms = walkthrough.rooms.map((r) =>
              r.room_id === roomId
                ? { ...r, panorama_url: data.updated_panorama_url }
                : r,
            );
            const updatedConfig = JSON.parse(JSON.stringify(walkthrough.pannellum_config));
            const scenes = updatedConfig.scenes as Record<string, { panorama?: string }>;
            if (scenes[roomId]) {
              scenes[roomId] = { ...scenes[roomId], panorama: data.updated_panorama_url };
            }
            updateWalkthrough({
              ...walkthrough,
              rooms: updatedRooms,
              pannellum_config: updatedConfig,
            });
          }
          clearSelection();
        },
        onError: () => {
          setIsEditing(false);
        },
      },
    );
  };

  // Position panel near the click point
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(selectedPoint.clientX + 20, window.innerWidth - 360),
    top: Math.min(selectedPoint.clientY + 20, window.innerHeight - 340),
    zIndex: 100,
  };

  return (
    <div
      style={panelStyle}
      className="w-80 bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
    >
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="font-bold text-sm tracking-tight text-slate-900">Edit Area</span>
        <button 
          onClick={clearSelection}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Prompt
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Change this sofa to a red leather one..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>
        
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleApply}
            disabled={!editPrompt.trim() || isEditing}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying...
              </>
            ) : 'Apply Change'}
          </button>
          <button
            onClick={clearSelection}
            className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
