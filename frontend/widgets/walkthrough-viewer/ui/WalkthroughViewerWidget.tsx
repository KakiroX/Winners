'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Walkthrough } from '@/entities/panorama/model/types';
import { PannellumViewer, useViewerStore } from '@/features/panorama-viewer';
import { useEditStore, EditPanel, VersionsModal } from '@/features/edit-panorama';
import { BOMModal } from '@/features/bom';
import { ds } from '@/shared/lib/ds';

interface Props {
  walkthrough: Walkthrough;
}

export function WalkthroughViewerWidget({ walkthrough }: Props) {
  const { currentSceneId, loadScene } = useViewerStore();
  const { setSelectedPoint } = useEditStore();
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentRoom = walkthrough.rooms.find((r) => r.room_id === currentSceneId);

  const handlePanoramaClick = (pitch: number, yaw: number, clientX: number, clientY: number) => {
    setSelectedPoint({ pitch, yaw, clientX, clientY });
  };

  return (
    <div className="relative w-full h-full">
      {/* Sidebar */}
      <div className={`absolute top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-12'}`}>
        <div className="flex-1 bg-black/70 backdrop-blur-xl border-r border-white/8 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Rooms</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`${ds.iconBtn} shrink-0`}
              title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
              </svg>
            </button>
          </div>

          {/* Room list */}
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto py-2">
              {walkthrough.rooms.map((room) => {
                const active = room.room_id === currentSceneId;
                return (
                  <button
                    key={room.room_id}
                    onClick={() => loadScene(room.room_id)}
                    className={`w-full text-left px-4 py-3 text-xs font-medium transition-all flex items-center gap-3 ${
                      active
                        ? 'text-white bg-white/10 border-l-2 border-white/50'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white/70' : 'bg-white/15'}`} />
                    <span className="uppercase tracking-widest truncate">{room.room_label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {sidebarOpen && (
            <div className="p-3 border-t border-white/8 space-y-2">
              <button
                onClick={() => setIsBOMOpen(true)}
                className={`${ds.btnGhost} w-full flex items-center justify-center gap-2`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Project BOM
              </button>
              <button
                onClick={() => setIsVersionsOpen(true)}
                className={`${ds.btnGhost} w-full flex items-center justify-center gap-2`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Room History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top bar — room label + home */}
      {currentRoom && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-5 py-2">
            <span className="text-white/70 text-xs font-bold tracking-widest uppercase">{currentRoom.room_label}</span>
          </div>
          <Link
            href="/designs"
            className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 text-white/40 hover:text-white/70 transition-colors"
            title="Back to Designs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
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

      {/* Modals */}
      {isBOMOpen && <BOMModal walkthroughId={walkthrough.id} onClose={() => setIsBOMOpen(false)} />}
      {isVersionsOpen && currentSceneId && (
        <VersionsModal walkthroughId={walkthrough.id} roomId={currentSceneId} onClose={() => setIsVersionsOpen(false)} />
      )}
    </div>
  );
}
