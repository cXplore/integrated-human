import Navigation from '../components/Navigation';
import StartHereFlow from './StartHereFlow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Here | Integrated Human',
  description: 'Not sure where to begin? Let us guide you to the content that matters most for where you are right now.',
};

export default function StartHerePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-gray-500 uppercase tracking-wide text-sm mb-4">
                Welcome
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
                Where to Begin
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                This isn't a typical self-help site. There's no one-size-fits-all path.
                Let's find what's actually relevant to you.
              </p>
            </div>

            <StartHereFlow />
          </div>
        </section>
      </main>
    </>
  );
}
