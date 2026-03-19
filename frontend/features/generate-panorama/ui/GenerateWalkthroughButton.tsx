'use client';

import { useSelectionStore } from '@/features/select-floor-plan';
import { useGenerateWalkthrough } from '../api/generatePanorama';
import { usePanoramaStore } from '../model/usePanoramaStore';
import { useRouter } from 'next/navigation';

export function GenerateWalkthroughButton() {
  const { selectedSchema } = useSelectionStore();
  const { setLoading, setSuccess, setError } = usePanoramaStore();
  const mutation = useGenerateWalkthrough();
  const router = useRouter();

  const handleClick = () => {
    if (!selectedSchema) return;

    setLoading();
    mutation.mutate(
      { floorPlan: selectedSchema },
      {
        onSuccess: (data) => {
          setSuccess(data.walkthrough);
          router.push(`/walkthrough/${data.walkthrough.id}`);
        },
        onError: (err) => {
          setError(err.message);
        },
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={!selectedSchema || mutation.isPending}
      className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
    >
      {mutation.isPending ? 'Generating panoramas...' : 'Generate 360° Walkthrough'}
    </button>
  );
}
