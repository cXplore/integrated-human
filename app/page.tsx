import Link from 'next/link';
import Navigation from './components/Navigation';
import PostCard from './components/PostCard';
import NewsletterSignup from './components/NewsletterSignup';
import WisdomQuote from './components/WisdomQuote';
import ScrollArrow from './components/ScrollArrow';
import SpectrumVisual from './components/SpectrumVisual';
import TodaysFocus from './components/TodaysFocus';
import HomepageChat from './components/HomepageChat';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getAllCourses } from '@/lib/courses';

const essentialReads = [
  'shadow-work-beginners-guide',
  'understanding-your-nervous-system',
  'attachment-styles-real-life-dating',
  'meditation-without-the-mysticism',
];

export default function Home() {
  const allPosts = getAllPosts();
  const latestPosts = allPosts.slice(0, 6);
  const starterPosts = essentialReads
    .map(slug => getPostBySlug(slug))
    .filter(Boolean);

  // Get featured courses - curated essentials per pillar
  const allCourses = getAllCourses();

  // Curated courses that represent each pillar well (2 each)
  const pillarCourses = {
    Mind: ['shadow-work-foundations', 'inner-critic-work'],
    Body: ['nervous-system-mastery', 'embodiment-basics'],
    Soul: ['presence-practices', 'meditation-fundamentals'],
    Relationships: ['attachment-repair', 'boundaries'],
  };

  const featuredCourses = Object.entries(pillarCourses).flatMap(([, slugs]) =>
    slugs.map(slug => allCourses.find(c => c.slug === slug)).filter(Boolean)
  ) as typeof allCourses;

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-bg-image"
          style={{ backgroundImage: 'url(/images/A-Spark-In-The-Universe_web-1400x788.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/70 hero-overlay" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-4">
            Integrated Human
          </h1>
          <p className="text-xl text-gray-300 mb-3 font-light">
            Live stronger, feel deeper, become whole.
          </p>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Psychology, embodiment, relationships, and meaning—practical paths to becoming more of who you already are.
          </p>

          {/* Explore links */}
          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <span className="text-gray-500">Explore:</span>
            <Link href="/library" className="text-gray-300 hover:text-white transition-colors">
              Articles
            </Link>
            <Link href="/courses" className="text-gray-300 hover:text-white transition-colors">
              Courses
            </Link>
            <Link href="/free" className="text-gray-300 hover:text-white transition-colors">
              Free Resources
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/start-here"
              className="text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4"
            >
              Unsure where to begin? Start here
            </Link>
          </div>
        </div>

        <ScrollArrow />
      </section>

      {/* Personalized Today's Focus for logged-in users */}
      <TodaysFocus />

      {/* Wisdom Quote */}
      <WisdomQuote />

      {/* What Integration Means */}
      <section className="py-20 px-6 bg-[var(--background)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl font-light text-white mb-8 text-center">
            What Integration Means
          </h2>
          <div className="space-y-6 text-gray-400 leading-relaxed">
            <p>
              Integration is the ongoing work of becoming whole. Not perfect—whole.
              It means bringing together the parts of yourself you've hidden, denied,
              or never knew existed.
            </p>
            <p>
              It means feeling what you've avoided feeling. Seeing what you've refused to see.
              Building a body that can hold more intensity, a mind that can tolerate more
              uncertainty, relationships that can survive more honesty.
            </p>
            <p>
              This isn't self-improvement as escape. It's self-knowledge as arrival.
              The work is hard, sometimes painful, and it never ends. But it's the only
              work that actually changes anything.
            </p>
          </div>
        </div>
      </section>

      {/* AI Companion Chat */}
      <HomepageChat />

      {/* The Four Pillars */}
      <section className="py-16 px-6 bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-light text-white mb-12 text-center">
            The Four Pillars
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/mind" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Mind</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Psychology, patterns, shadow work, emotions. How you think and feel—the inner landscape.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/body" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Body</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Training, nutrition, sleep, breath, nervous system. Your physical foundation for everything else.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/soul" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Soul</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Meditation, meaning, philosophy, psychedelics. The depths beyond optimization.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/relationships" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Relationships</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Attachment, intimacy, polarity, conflict. How you connect with others—and why it goes wrong.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 px-6 bg-[var(--card-bg)]">
        <div className="max-w-5xl mx-auto">
          {/* Section intro */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl font-light text-white mb-4">
              Articles
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {allPosts.length}+ essays on psychology, embodiment, relationships, and meaning.
              Long-form pieces that go beyond tips and hacks—written to help you understand
              yourself and the patterns that run your life.
            </p>
          </div>

          {/* Recent */}
          <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-6">Recent</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {post.metadata.categories[0]}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600">{post.readingTime} min</span>
                </div>
                <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-2 line-clamp-2">
                  {post.metadata.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {post.metadata.excerpt}
                </p>
              </Link>
            ))}
          </div>

          {/* Foundational */}
          <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-6">Where to Start</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {starterPosts.map((post) => (
              <Link
                key={post!.slug}
                href={`/posts/${post!.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {post!.metadata.categories[0]}
                  </span>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600">{post!.readingTime} min</span>
                </div>
                <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-2">
                  {post!.metadata.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {post!.metadata.excerpt}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/library"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Browse the full library →
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 px-6 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          {/* Section intro */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-serif text-3xl font-light text-white mb-4">
              Courses
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {allCourses.length} structured programs for when you want to go beyond reading.
              Exercises and practices designed for real change—not just information.
            </p>
          </div>

          {/* Courses by pillar */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {Object.entries(pillarCourses).map(([pillar, slugs]) => (
              <div key={pillar} className="space-y-4">
                <h3 className="text-gray-500 text-sm uppercase tracking-wide">{pillar}</h3>
                {slugs.map(slug => {
                  const course = allCourses.find(c => c.slug === slug);
                  if (!course) return null;
                  return (
                    <Link
                      key={course.slug}
                      href={`/courses/${course.slug}`}
                      className="group block bg-[var(--card-bg)] border border-[var(--border-color)] p-4 hover:border-zinc-600 transition-colors"
                    >
                      <h4 className="font-serif text-base text-white group-hover:text-gray-300 transition-colors mb-1">
                        {course.metadata.title}
                      </h4>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {course.metadata.subtitle}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/courses"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Browse all {allCourses.length} courses →
            </Link>
          </div>

        </div>
      </section>

      {/* Membership - understated */}
      <section className="py-12 px-6 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Looking for full access to all articles and courses?{' '}
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">
              See membership options
            </Link>
          </p>
          <p className="text-gray-600 text-sm">
            <Link href="/transparency" className="hover:text-gray-400 transition-colors">
              How we work: methodology, sources, and standards →
            </Link>
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-6 bg-[var(--card-bg)]">
        <div className="max-w-3xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>
    </main>
    </>
  );
}
