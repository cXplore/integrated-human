export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-96 bg-zinc-900 rounded animate-pulse" />
        </div>

        <div className="h-48 bg-zinc-900 rounded-lg animate-pulse" />

        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-zinc-900 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
