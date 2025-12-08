import Navigation from '../components/Navigation';
import ReadingListContent from './ReadingListContent';

export default function ReadingListPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Reading List
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Articles you&apos;ve saved for later. Stored locally in your browser.
            </p>
            <ReadingListContent />
          </div>
        </section>
      </main>
    </>
  );
}
