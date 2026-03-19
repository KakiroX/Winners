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
            const updatedConfig = { ...walkthrough.pannellum_config };
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
    left: Math.min(selectedPoint.clientX + 20, window.innerWidth - 340),
    top: Math.min(selectedPoint.clientY + 20, window.innerHeight - 300),
    zIndex: 100,
  };

  return (
    <div
      style={panelStyle}
      className="w-80 bg-slate-800 text-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden"
    >
      <div className="px-4 py-3 bg-slate-900 font-semibold text-sm">Edit Area</div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-400">
          What would you like to change or add here?
        </p>
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. Change this sofa to a red leather one..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
        />
        <button
          onClick={handleApply}
          disabled={!editPrompt.trim() || isEditing}
          className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isEditing ? 'Applying...' : 'Apply Change'}
        </button>
        <button
          onClick={clearSelection}
          className="w-full py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
