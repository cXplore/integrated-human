import { Metadata } from 'next';
import Navigation from '../components/Navigation';
import PracticeLibrary from './PracticeLibrary';

export const metadata: Metadata = {
  title: 'Practice Library | Integrated Human',
  description: 'Breathwork, grounding, meditation, and somatic practices to support your integration journey. Quick exercises for any moment.',
};

export default function PracticesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
                Practice Library
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                Integration isn't just understanding — it's embodiment. These practices help you move
                from knowing to being.
              </p>
            </div>

            <PracticeLibrary />
          </div>
        </section>
      </main>
    </>
  );
}
