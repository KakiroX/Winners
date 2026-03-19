'use client';

export function GeneratingPanoramaWidget() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-slate-900 animate-spin" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Generating 360° panoramas
        </h2>
        <p className="text-sm text-slate-500">
          Creating equirectangular panoramas for each room and linking them together.
          This may take a minute...
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-video rounded-lg bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
