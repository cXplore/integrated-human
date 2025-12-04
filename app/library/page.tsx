import Navigation from '../components/Navigation';

export default function LibraryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-stone-50">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-stone-900 mb-6">
              Library
            </h1>
            <p className="text-xl text-stone-700 leading-relaxed mb-12">
              Book notes, quotes, authors, and resources for the integrated life.
            </p>

            <div className="space-y-8">
              <div className="bg-white p-8 border border-stone-200">
                <h2 className="font-serif text-2xl font-light text-stone-900 mb-3">
                  Coming Soon
                </h2>
                <p className="text-stone-700 leading-relaxed">
                  Notes from Jung, Watts, the Tao Te Ching, and other essential texts
                  for understanding mind, body, and soul.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
