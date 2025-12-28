export default function PostLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <article className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Category & date skeleton */}
          <div className="flex gap-4 mb-6">
            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="h-12 w-full bg-zinc-800 rounded mb-4 animate-pulse" />
          <div className="h-12 w-3/4 bg-zinc-800 rounded mb-8 animate-pulse" />

          {/* Excerpt skeleton */}
          <div className="h-6 w-full bg-zinc-800 rounded mb-2 animate-pulse" />
          <div className="h-6 w-5/6 bg-zinc-800 rounded mb-12 animate-pulse" />

          {/* Content skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-zinc-800 rounded animate-pulse" />
                {i % 3 === 0 && <div className="h-8" />}
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
