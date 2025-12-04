import Link from 'next/link';
import Navigation from './components/Navigation';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <h1 className="font-serif text-5xl md:text-7xl font-light text-stone-900 mb-6">
          Integrated Human
        </h1>
        <p className="text-xl md:text-2xl text-stone-600 mb-12 max-w-2xl font-light">
          Live stronger, feel deeper, become whole.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/mind"
            className="px-8 py-3 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors duration-200"
          >
            Mind
          </Link>
          <Link
            href="/body"
            className="px-8 py-3 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors duration-200"
          >
            Body
          </Link>
          <Link
            href="/soul"
            className="px-8 py-3 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors duration-200"
          >
            Soul
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-stone-900 mb-8 text-center">
            Why This Exists
          </h2>
          <div className="space-y-6 text-stone-700 leading-relaxed">
            <p>
              Most content online is either pure fitness, pure productivity, pure spirituality, or dating hacks.
            </p>
            <p>
              Real life doesn't work in separate boxes.
            </p>
            <p>
              This project is for people who feel everything at once: strong and broken, awake and confused,
              intelligent but stuck, hungry for more but tired of noise.
            </p>
            <p>
              Here we explore how mind, body and soul actually interact — in real relationships, real bodies, real days.
            </p>
          </div>
        </div>
      </section>

      {/* The Three Pillars */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-stone-900 mb-16 text-center">
            The Three Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-stone-900">Mind</h3>
              <p className="text-stone-700 leading-relaxed">
                Your inner structure: psychology, patterns, attachment styles, masculine & feminine dynamics,
                trauma, communication. How you think, feel and relate — to yourself and others.
              </p>
              <Link href="/mind" className="inline-block text-stone-900 underline hover:no-underline">
                Explore Mind →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-stone-900">Body</h3>
              <p className="text-stone-700 leading-relaxed">
                Your physical foundation: training, food, sleep, hormones, breath, nervous system.
                How you move through the world, how you carry your energy.
              </p>
              <Link href="/body" className="inline-block text-stone-900 underline hover:no-underline">
                Explore Body →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-stone-900">Soul</h3>
              <p className="text-stone-700 leading-relaxed">
                Your depth: wisdom, meditation, psychedelics, philosophy, silence, meaning.
                Everything in you that knows there's more to life than performance.
              </p>
              <Link href="/soul" className="inline-block text-stone-900 underline hover:no-underline">
                Explore Soul →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Find */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-stone-900 mb-8 text-center">
            What You'll Find Here
          </h2>
          <ul className="space-y-4 text-stone-700 leading-relaxed">
            <li>• Articles & essays on psychology, training, intimacy, healing, discipline, purpose.</li>
            <li>• Guides you can actually use — workouts, reflection prompts, practices.</li>
            <li>• Book notes from Jung to Tao Te Ching to modern psychology.</li>
            <li>• Perspectives on love & relationships that go deeper than "text her this."</li>
            <li>• Later: a community space for people walking the same path.</li>
          </ul>
        </div>
      </section>

      {/* Start Here */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-stone-900 mb-8">
            Start Here
          </h2>
          <div className="space-y-4 text-stone-700 leading-relaxed">
            <p>If you feel stuck in your head → read something from <Link href="/mind" className="underline hover:no-underline">Mind</Link>.</p>
            <p>If you feel weak, restless or numb → start with <Link href="/body" className="underline hover:no-underline">Body</Link>.</p>
            <p>If you feel lost, empty or searching → explore <Link href="/soul" className="underline hover:no-underline">Soul</Link>.</p>
          </div>
          <p className="mt-8 text-stone-600 italic">
            Small steps. Real talk. No pretending.
          </p>
        </div>
      </section>
    </main>
    </>
  );
}
