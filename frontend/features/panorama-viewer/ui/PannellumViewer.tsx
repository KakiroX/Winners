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
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const { setCurrentScene, sceneToLoad, clearSceneToLoad } = useViewerStore();

  // Track current view state to restore it after config updates
  const viewStateRef = useRef({
    pitch: 0,
    yaw: 0,
    hfov: 110,
    sceneId: '',
  });

  // Track drag start to distinguish clicks from drags
  const handleMouseDown = useCallback((event: MouseEvent) => {
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!viewerRef.current || !onPanoramaClick) return;

      // Don't intercept clicks on hotspots
      const target = event.target as HTMLElement;
      if (target.closest('.pnlm-hotspot')) return;

      // Ignore drags (moved more than 5px)
      if (dragStartRef.current) {
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) return;
      }

      try {
        const coords = viewerRef.current.mouseEventToCoords(event);
        if (coords) {
          onPanoramaClick(coords[0], coords[1], event.clientX, event.clientY);
        }
      } catch {
        // Pannellum renderer not ready yet — ignore
      }
    },
    [onPanoramaClick],
  );

  // Handle programmatic scene changes
  useEffect(() => {
    if (viewerRef.current && sceneToLoad) {
      viewerRef.current.loadScene(sceneToLoad);
      clearSceneToLoad();
    }
  }, [sceneToLoad, clearSceneToLoad]);

  useEffect(() => {
    if (!containerRef.current || !window.pannellum) return;

    // Capture current state if viewer already exists
    if (viewerRef.current) {
      try {
        viewStateRef.current = {
          pitch: viewerRef.current.getPitch(),
          yaw: viewerRef.current.getYaw(),
          hfov: viewerRef.current.getHfov(),
          sceneId: viewerRef.current.getScene(),
        };
      } catch (e) {
        console.warn('Could not capture current view state:', e);
      }

      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    // Merge captured state into config for the new instance
    const finalConfig = JSON.parse(JSON.stringify(config));

    // If we're staying in the same scene, restore the view parameters
    if (viewStateRef.current.sceneId) {
      // Ensure we start at the scene we were just looking at
      finalConfig.default = {
        ...finalConfig.default,
        firstScene: viewStateRef.current.sceneId,
      };

      // Override scene-specific initial view parameters if they exist
      const scenes = finalConfig.scenes as Record<string, any>;
      if (scenes && scenes[viewStateRef.current.sceneId]) {
        scenes[viewStateRef.current.sceneId] = {
          ...scenes[viewStateRef.current.sceneId],
          pitch: viewStateRef.current.pitch,
          yaw: viewStateRef.current.yaw,
          hfov: viewStateRef.current.hfov,
          autoLoad: true, // Ensure it loads immediately
        };
      }
    }

    const viewer = window.pannellum.viewer(containerRef.current, finalConfig as unknown as Record<string, unknown>);
    viewerRef.current = viewer;

    // Track scene changes
    viewer.on('scenechange', (sceneId: unknown) => {
      const id = sceneId as string;
      viewStateRef.current.sceneId = id;
      setCurrentScene(id);
      onSceneChange?.(id);
    });

    // Set initial scene in store
    const initialScene = viewStateRef.current.sceneId || config.default.firstScene;
    if (initialScene) {
      setCurrentScene(initialScene);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Attach click handlers — mousedown for drag tracking, mouseup for actual clicks
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseUp]);

  return <div ref={containerRef} id="panorama" className={className} />;
}
