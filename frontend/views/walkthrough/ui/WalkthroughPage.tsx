'use client';

import { useEffect } from 'react';
import { usePanoramaStore, useWalkthrough } from '@/features/generate-panorama';
import { WalkthroughViewerWidget } from '@/widgets/walkthrough-viewer';
import { GeneratingPanoramaWidget } from '@/widgets/generating-panorama';

interface Props {
  walkthroughId?: string;
}

export function WalkthroughPage({ walkthroughId }: Props) {
  const { status, walkthrough, errorMessage, setSuccess } = usePanoramaStore();

  // Fetch when: no walkthrough in store, OR the stored walkthrough is for a different project
  const storeMatchesUrl = walkthrough?.id === walkthroughId;
  const needsFetch = !!walkthroughId && (status === 'idle' || !storeMatchesUrl);
  const query = useWalkthrough(needsFetch ? walkthroughId : null);

  // Hydrate the store from the API response
  useEffect(() => {
    if (query.data) {
      setSuccess(query.data);
    }
  }, [query.data, setSuccess]);

  // SSE streaming in progress
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <GeneratingPanoramaWidget />
      </main>
    );
  }

  // Fetching from API (page reload or navigating to a different project)
  if (query.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading walkthrough...</p>
      </main>
    );
  }

  // Error states
  if (status === 'error' || query.isError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="text-red-500 text-sm">Panorama generation failed.</p>
          <p className="text-slate-400 text-xs">
            {errorMessage || (query.error as Error)?.message || 'Unknown error'}
          </p>
        </div>
      </main>
    );
  }

  // Use store only if it matches the current URL; otherwise use fresh query data
  const wt = storeMatchesUrl ? walkthrough : query.data;

  if (!wt) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">No walkthrough found.</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <WalkthroughViewerWidget walkthrough={wt} />
    </main>
  );
}
