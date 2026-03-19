'use client';

import { usePanoramaStore } from '@/features/generate-panorama';
import { WalkthroughViewerWidget } from '@/widgets/walkthrough-viewer';
import { GeneratingPanoramaWidget } from '@/widgets/generating-panorama';

export function WalkthroughPage() {
  const { status, walkthrough, errorMessage } = usePanoramaStore();

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <GeneratingPanoramaWidget />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="text-red-500 text-sm">Panorama generation failed.</p>
          <p className="text-slate-400 text-xs">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (!walkthrough) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">No walkthrough loaded.</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <WalkthroughViewerWidget walkthrough={walkthrough} />
    </main>
  );
}
