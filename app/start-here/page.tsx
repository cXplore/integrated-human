import Navigation from '../components/Navigation';
import StartHereQuiz from '../components/StartHereQuiz';

export default function StartHerePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6 text-center">
              Where to Start
            </h1>
            <p className="text-xl text-gray-400 text-center mb-12 leading-relaxed">
              Answer a few questions and we'll point you to the articles most relevant to where you are right now.
            </p>

            <StartHereQuiz />
          </div>
        </section>
      </main>
    </>
  );
}
