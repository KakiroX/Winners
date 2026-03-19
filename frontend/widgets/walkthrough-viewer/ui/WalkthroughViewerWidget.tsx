'use client';

import type { Walkthrough } from '@/entities/panorama/model/types';
import { PannellumViewer, useViewerStore } from '@/features/panorama-viewer';
import { useEditStore } from '@/features/edit-panorama';
import { EditPanel } from '@/features/edit-panorama';

interface Props {
  walkthrough: Walkthrough;
}

export function WalkthroughViewerWidget({ walkthrough }: Props) {
  const { currentSceneId } = useViewerStore();
  const { setSelectedPoint } = useEditStore();

  const currentRoom = walkthrough.rooms.find((r) => r.room_id === currentSceneId);

  const handlePanoramaClick = (pitch: number, yaw: number, clientX: number, clientY: number) => {
    setSelectedPoint({ pitch, yaw, clientX, clientY });
  };

  return (
    <div className="relative w-full h-full">
      {/* Room navigation sidebar */}
      <div className="absolute top-4 left-4 z-50 bg-slate-900/90 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
          Rooms
        </div>
        <div className="py-1">
          {walkthrough.rooms.map((room) => (
            <div
              key={room.room_id}
              className={`px-3 py-2 text-sm cursor-default ${
                room.room_id === currentSceneId
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300'
              }`}
            >
              {room.room_label}
            </div>
          ))}
        </div>
      </div>

      {/* Current room label */}
      {currentRoom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-medium">
          {currentRoom.room_label}
        </div>
      )}

      {/* Pannellum viewer */}
      <PannellumViewer
        config={walkthrough.pannellum_config}
        className="w-full h-full"
        onPanoramaClick={handlePanoramaClick}
      />

      {/* Edit panel */}
      {currentSceneId && (
        <EditPanel
          walkthroughId={walkthrough.id}
          roomId={currentSceneId}
        />
      )}
    </div>
  );
}
