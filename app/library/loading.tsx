export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-12">
            <div className="h-12 w-48 bg-zinc-800 rounded mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Search/filter skeleton */}
          <div className="flex gap-4 mb-8">
            <div className="h-12 flex-1 bg-zinc-800 rounded animate-pulse" />
            <div className="h-12 w-32 bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Article list skeleton */}
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex gap-6 p-6 border border-zinc-800 rounded-lg">
                <div className="w-48 h-32 bg-zinc-800 rounded animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
