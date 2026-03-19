'use client';

import { useEditStore } from '../model/useEditStore';
import { useEditRoom } from '../api/editPanorama';
import { usePanoramaStore } from '@/features/generate-panorama';
import { ds } from '@/shared/lib/ds';

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
            updateWalkthrough({ ...walkthrough, rooms: updatedRooms, pannellum_config: updatedConfig });
          }
          clearSelection();
        },
        onError: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(selectedPoint.clientX + 20, window.innerWidth - 340),
    top: Math.min(selectedPoint.clientY + 20, window.innerHeight - 300),
    zIndex: 100,
  };

  return (
    <div
      style={panelStyle}
      className={`w-72 ${ds.modal} overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-white">Edit Area</span>
        <button onClick={clearSelection} className={ds.iconBtn}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <label className={ds.label}>Prompt</label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Change this sofa to a red leather one..."
            className={ds.input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleApply}
            disabled={!editPrompt.trim() || isEditing}
            className={`${ds.btnPrimary} w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isEditing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Applying...
              </>
            ) : 'Apply Change'}
          </button>
          <button onClick={clearSelection} className={`${ds.btnGhost} w-full`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
