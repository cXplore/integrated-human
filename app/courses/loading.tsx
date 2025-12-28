export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="text-center mb-12">
            <div className="h-4 w-24 bg-zinc-800 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-12 w-64 bg-zinc-800 rounded mx-auto mb-6 animate-pulse" />
            <div className="h-6 w-96 bg-zinc-800 rounded mx-auto animate-pulse" />
          </div>

          {/* Filter skeleton */}
          <div className="flex gap-3 justify-center mb-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>

          {/* Course grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden">
                <div className="h-48 bg-zinc-800 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-6 w-full bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                  <div className="flex justify-between pt-4">
                    <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
