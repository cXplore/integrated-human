export default function HealthLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-56 bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-80 bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* Overall health score skeleton */}
        <div className="mb-8 p-8 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="w-32 h-32 mx-auto bg-zinc-800 rounded-full animate-pulse mb-4" />
          <div className="h-6 w-40 mx-auto bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 mx-auto bg-zinc-800/50 rounded animate-pulse" />
        </div>

        {/* Pillars grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded animate-pulse" />
                <div className="h-5 w-20 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse mb-2" />
              <div className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Dimensions list skeleton */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 bg-zinc-800/50 rounded animate-pulse" />
                <div className="flex-1 h-2 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
