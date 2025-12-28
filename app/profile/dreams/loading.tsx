export default function DreamsLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* New dream entry skeleton */}
        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="h-24 bg-zinc-800/50 rounded animate-pulse mb-4" />
          <div className="h-10 w-36 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Dreams list skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-zinc-800 rounded animate-pulse" />
                <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-800/50 rounded animate-pulse ml-auto" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
