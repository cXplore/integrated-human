export default function PathsLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-12 text-center">
          <div className="h-10 w-48 mx-auto bg-zinc-800 rounded animate-pulse mb-3" />
          <div className="h-5 w-96 mx-auto bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* Recommended section skeleton */}
        <div className="mb-12">
          <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* All paths section skeleton */}
        <div>
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
