import Navigation from '../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Integrated Human',
  description: 'What Integrated Human is about and why it exists. No gurus, no quick fixes—just honest exploration of what it means to be whole.',
  openGraph: {
    title: 'About | Integrated Human',
    description: 'What Integrated Human is about and why it exists.',
  },
};

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-12">
              About
            </h1>

            <div className="space-y-8 text-gray-300 leading-relaxed text-lg">
              {/* Author Section */}
              <div className="pb-12 border-b border-zinc-800">
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl text-white">The Person Behind This</h2>
                  <p>
                    I've spent years in the weeds of personal development — reading the books, doing the practices,
                    making the mistakes. Therapy, meditation retreats, strength training, psychedelics, failed relationships,
                    successful ones. The whole messy process of trying to figure out how to actually live well.
                  </p>
                  <p>
                    This site is what I wish I'd found earlier: practical wisdom without the guru energy,
                    depth without the dogma, and honest acknowledgment that none of us really know what we're doing —
                    we're just paying closer attention than most.
                  </p>
                  <p className="text-gray-500 text-base">
                    Based in Europe. Writing when something feels true enough to share.
                  </p>
                </div>
              </div>

              {/* Philosophy Section */}
              <div className="space-y-6 pt-4">
                <h2 className="font-serif text-2xl text-white">The Philosophy</h2>
                <p>
                  Your body, mind, and soul aren't separate projects.
                </p>
                <p>
                  They talk to each other whether you want them to or not.
                </p>
                <p>
                  How you train affects how you think. How you think shapes how you relate.
                  How you relate reveals what you actually believe about yourself and the world.
                </p>
              </div>

              <div className="border-l-2 border-zinc-700 pl-6 my-12">
                <p className="text-xl text-gray-400 italic">
                  Integration isn't about becoming perfect. It's about becoming whole —
                  including the parts you'd rather hide.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-white">The Four Pillars</h2>

                <div className="space-y-4">
                  <p>
                    <strong className="text-white">Mind</strong> — Psychology, patterns, attachment,
                    shadow work, emotions. The invisible structures that run your life.
                  </p>
                  <p>
                    <strong className="text-white">Body</strong> — Training, movement, breath, sleep,
                    nervous system. The foundation you stand on.
                  </p>
                  <p>
                    <strong className="text-white">Soul</strong> — Meditation, psychedelics, philosophy,
                    meaning. The part of you that knows when you're lying to yourself.
                  </p>
                  <p>
                    <strong className="text-white">Relationships</strong> — Attachment, polarity,
                    conflict, intimacy. Where all of it becomes real.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-white">What This Isn't</h2>
                <p>
                  This isn't self-help with a system, a method, or 7 steps to anything.
                </p>
                <p>
                  No manifestation. No hustle culture. No spiritual bypassing dressed up as wisdom.
                </p>
                <p>
                  Just observations, principles, and practices drawn from psychology, philosophy,
                  contemplative traditions, and the hard-won lessons of being human.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-white">What This Is</h2>
                <p>
                  A place to work through the real stuff — burnout, heartbreak,
                  psychedelic integration, attachment wounds, existential confusion,
                  the strange terrain of becoming whole in a fragmented world.
                </p>
                <p>
                  Some of it is practical. Some of it is philosophical.
                  Some of it might not land for you, and that's fine.
                </p>
                <p>
                  No shortcuts. No false promises. Just depth.
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-12 mt-12">
                <p className="text-gray-500 mb-6">
                  Start wherever feels right:
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/mind"
                    className="px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Mind
                  </Link>
                  <Link
                    href="/body"
                    className="px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Body
                  </Link>
                  <Link
                    href="/soul"
                    className="px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Soul
                  </Link>
                  <Link
                    href="/relationships"
                    className="px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    Relationships
                  </Link>
                </div>
              </div>

              <div className="pt-8">
                <p className="text-gray-500 mb-4">
                  Want to understand how we work?
                </p>
                <Link
                  href="/transparency"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  See our methodology, standards, and credentials →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
