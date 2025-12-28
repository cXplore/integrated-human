export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* Health overview skeleton */}
        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Grid sections skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
