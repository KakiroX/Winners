'use client';

import Link from 'next/link';
import type { Walkthrough } from '@/entities/panorama/model/types';
import { PannellumViewer, useViewerStore } from '@/features/panorama-viewer';
import { useEditStore } from '@/features/edit-panorama';
import { EditPanel } from '@/features/edit-panorama';
import { BOMModal } from '@/features/bom';
import { VersionsModal } from '@/features/edit-panorama';
import { useState } from 'react';

interface Props {
  walkthrough: Walkthrough;
}

export function WalkthroughViewerWidget({ walkthrough }: Props) {
  const { currentSceneId, loadScene } = useViewerStore();
  const { setSelectedPoint } = useEditStore();
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  const currentRoom = walkthrough.rooms.find((r) => r.room_id === currentSceneId);

  const handlePanoramaClick = (pitch: number, yaw: number, clientX: number, clientY: number) => {
    setSelectedPoint({ pitch, yaw, clientX, clientY });
  };

  return (
    <div className="relative w-full h-full font-sans text-slate-900">
      {/* Room navigation sidebar */}
      <div className="absolute top-6 left-6 z-50 w-64 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all duration-300">
        <div className="px-5 py-4 text-sm font-bold text-slate-900 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Rooms
          </div>
          <Link href="/" className="text-[10px] uppercase font-black bg-slate-100 px-2 py-1 rounded hover:bg-slate-900 hover:text-white transition-all">
            Home
          </Link>
        </div>
        <div className="py-2 overflow-y-auto max-h-[50vh]">
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
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 text-[10px]">
           <button 
             onClick={() => setIsBOMOpen(true)}
             className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
           >
             Project BOM
           </button>
           <button 
             onClick={() => setIsVersionsOpen(true)}
             className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
           >
             Room History
           </button>
        </div>
      </div>

      {/* Current room indicator */}
      {currentRoom && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full text-slate-900 text-xs font-bold shadow-lg border border-slate-200">
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
      {currentSceneId && <EditPanel walkthroughId={walkthrough.id} roomId={currentSceneId} />}

      {/* BOM Modal */}
      {isBOMOpen && <BOMModal walkthroughId={walkthrough.id} onClose={() => setIsBOMOpen(false)} />}

      {/* Versions Modal */}
      {isVersionsOpen && currentSceneId && (
        <VersionsModal walkthroughId={walkthrough.id} roomId={currentSceneId} onClose={() => setIsVersionsOpen(false)} />
      )}
    </div>
  );
}
