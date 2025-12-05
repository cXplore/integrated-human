import Link from 'next/link';
import Navigation from './components/Navigation';
import WisdomQuote from './components/WisdomQuote';
import PostCard from './components/PostCard';
import NewsletterSignup from './components/NewsletterSignup';
import { getAllPosts } from '@/lib/posts';

export default function Home() {
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/hero-home.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
        <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6">
          Integrated Human
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl font-light">
          Live stronger, feel deeper, become whole.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/mind"
            className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            Mind
          </Link>
          <Link
            href="/body"
            className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            Body
          </Link>
          <Link
            href="/soul"
            className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors duration-200"
          >
            Soul
          </Link>
        </div>
        </div>
      </section>

      {/* Wisdom Quote */}
      <WisdomQuote />

      {/* About Section */}
      <section className="py-20 px-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-12 text-center">
            Not Another Self-Help Site
          </h2>
          <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
            <p>
              This isn't about optimizing your life, manifesting abundance, or 10x-ing your potential.
            </p>
            <p>
              It's about integration. Living in your body without fighting it. Relating with depth instead of tactics.
              Finding clarity without spiritually bypassing the hard parts.
            </p>
            <p>
              For people navigating burnout, heartbreak, psychedelic integration, attachment wounds, and the strange
              terrain of becoming whole in a fragmented world.
            </p>
            <p>
              Psychology. Training. Philosophy. Relationships. Meditation. All in conversation,
              not in separate boxes.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-12 text-center">
            Latest Articles
          </h2>
          <div className="space-y-8">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* The Three Pillars */}
      <section className="py-20 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-16 text-center">
            The Three Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Mind</h3>
              <p className="text-gray-400 leading-relaxed">
                Your inner structure: psychology, patterns, attachment styles, masculine & feminine dynamics,
                trauma, communication. How you think, feel and relate — to yourself and others.
              </p>
              <Link href="/mind" className="inline-block text-gray-300 underline hover:text-white transition-colors">
                Explore Mind →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Body</h3>
              <p className="text-gray-400 leading-relaxed">
                Your physical foundation: training, food, sleep, hormones, breath, nervous system.
                How you move through the world, how you carry your energy.
              </p>
              <Link href="/body" className="inline-block text-gray-300 underline hover:text-white transition-colors">
                Explore Body →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Soul</h3>
              <p className="text-gray-400 leading-relaxed">
                Your depth: wisdom, meditation, psychedelics, philosophy, silence, meaning.
                Everything in you that knows there's more to life than performance.
              </p>
              <Link href="/soul" className="inline-block text-gray-300 underline hover:text-white transition-colors">
                Explore Soul →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 px-6 bg-black border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* Start Here */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-8">
            Start Here
          </h2>
          <div className="space-y-4 text-gray-400 leading-relaxed">
            <p>If you feel stuck in your head → read something from <Link href="/mind" className="text-gray-300 underline hover:text-white transition-colors">Mind</Link>.</p>
            <p>If you feel weak, restless or numb → start with <Link href="/body" className="text-gray-300 underline hover:text-white transition-colors">Body</Link>.</p>
            <p>If you feel lost, empty or searching → explore <Link href="/soul" className="text-gray-300 underline hover:text-white transition-colors">Soul</Link>.</p>
          </div>
          <p className="mt-8 text-gray-500 italic">
            Small steps. Real talk. No pretending.
          </p>
        </div>
      </section>
    </main>
    </>
  );
}
