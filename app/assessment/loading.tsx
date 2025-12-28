export default function AssessmentLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-8 w-64 mx-auto bg-zinc-800 rounded animate-pulse mb-3" />
          <div className="h-5 w-80 mx-auto bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* Progress bar skeleton */}
        <div className="mb-8">
          <div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse" />
          <div className="flex justify-between mt-2">
            <div className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Question area skeleton */}
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse mb-6" />

          {/* Options skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-zinc-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Navigation skeleton */}
        <div className="flex justify-between mt-8">
          <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}
