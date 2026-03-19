'use client';

import type { Walkthrough } from '@/entities/panorama/model/types';
import { PannellumViewer, useViewerStore } from '@/features/panorama-viewer';
import { useEditStore } from '@/features/edit-panorama';
import { EditPanel } from '@/features/edit-panorama';
import { BOMModal } from '@/features/bom';
import { useState } from 'react';

interface Props {
  walkthrough: Walkthrough;
}

export function WalkthroughViewerWidget({ walkthrough }: Props) {
  const { currentSceneId, loadScene } = useViewerStore();
  const { setSelectedPoint } = useEditStore();
  const [isBOMOpen, setIsBOMOpen] = useState(false);

  const currentRoom = walkthrough.rooms.find((r) => r.room_id === currentSceneId);

  const handlePanoramaClick = (pitch: number, yaw: number, clientX: number, clientY: number) => {
    setSelectedPoint({ pitch, yaw, clientX, clientY });
  };

  return (
    <div className="relative w-full h-full font-sans text-slate-900">
      {/* Room navigation sidebar */}
      <div className="absolute top-6 left-6 z-50 w-64 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        <div className="px-5 py-4 text-sm font-bold text-slate-900 border-b border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Rooms
        </div>
        <div className="py-2 overflow-y-auto max-h-[60vh]">
          {walkthrough.rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => loadScene(room.room_id)}
              className={`w-full text-left px-5 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
                room.room_id === currentSceneId
                  ? 'bg-slate-100 text-blue-600 border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
              }`}
            >
              <span>{room.room_label}</span>
              {room.room_id === currentSceneId && (
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <button 
             onClick={() => setIsBOMOpen(true)}
             className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-100 active:scale-95 flex items-center justify-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
             </svg>
             View Project BOM
           </button>
        </div>
      </div>

      {/* Current room indicator (floating pill) */}
      {currentRoom && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full text-slate-900 text-sm font-bold shadow-lg border border-slate-200 flex items-center gap-3">
           <span className="text-slate-400 font-normal">Current view:</span>
           {currentRoom.room_label}
        </div>
      )}

      {/* Pannellum viewer */}
      <PannellumViewer
        config={walkthrough.pannellum_config}
        className="w-full h-full grayscale-[0.2] contrast-[1.05]"
        onPanoramaClick={handlePanoramaClick}
      />

      {/* Edit panel */}
      {currentSceneId && (
        <EditPanel
          walkthroughId={walkthrough.id}
          roomId={currentSceneId}
        />
      )}

      {/* BOM Modal */}
      {isBOMOpen && (
        <BOMModal 
          walkthroughId={walkthrough.id} 
          onClose={() => setIsBOMOpen(false)} 
        />
      )}
    </div>
  );
}
