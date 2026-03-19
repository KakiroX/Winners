'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PannellumConfig } from '@/entities/panorama/model/types';
import type { PannellumViewerInstance } from '../lib/pannellum';
import { useViewerStore } from '../model/useViewerStore';

interface Props {
  config: PannellumConfig;
  className?: string;
  onPanoramaClick?: (pitch: number, yaw: number, clientX: number, clientY: number) => void;
  onSceneChange?: (sceneId: string) => void;
}

export function PannellumViewer({ config, className = '', onPanoramaClick, onSceneChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewerInstance | null>(null);
  const { setCurrentScene, setView } = useViewerStore();

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!viewerRef.current || !onPanoramaClick) return;

      // Don't intercept clicks on hotspots
      const target = event.target as HTMLElement;
      if (target.closest('.pnlm-hotspot')) return;

      const coords = viewerRef.current.mouseEventToCoords(event);
      if (coords) {
        onPanoramaClick(coords[0], coords[1], event.clientX, event.clientY);
      }
    },
    [onPanoramaClick],
  );

  useEffect(() => {
    if (!containerRef.current || !window.pannellum) return;

    // Destroy previous instance
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    // Resolve panorama URLs to absolute backend URLs
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';
    const resolvedConfig = resolveImageUrls(config, apiBase);

    const viewer = window.pannellum.viewer(containerRef.current, resolvedConfig as unknown as Record<string, unknown>);
    viewerRef.current = viewer;

    // Track scene changes
    viewer.on('scenechange', (sceneId: unknown) => {
      const id = sceneId as string;
      setCurrentScene(id);
      onSceneChange?.(id);
    });

    // Track view changes
    viewer.on('mouseup', () => {
      if (viewerRef.current) {
        setView(viewerRef.current.getPitch(), viewerRef.current.getYaw());
      }
    });

    // Set initial scene
    if (config.default.firstScene) {
      setCurrentScene(config.default.firstScene);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Attach click handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    return () => container.removeEventListener('mousedown', handleMouseDown);
  }, [handleMouseDown]);

  return <div ref={containerRef} id="panorama" className={className} />;
}

function resolveImageUrls(config: PannellumConfig, apiBase: string): PannellumConfig {
  const resolved = structuredClone(config);
  for (const scene of Object.values(resolved.scenes)) {
    if (scene.panorama.startsWith('/')) {
      scene.panorama = `${apiBase}${scene.panorama}`;
    }
  }
  return resolved;
}
