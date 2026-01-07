import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Navigation from './components/Navigation';
import PostCard from './components/PostCard';
import NewsletterSignup from './components/NewsletterSignup';
import WisdomQuote from './components/WisdomQuote';
import ScrollArrow from './components/ScrollArrow';
import SpectrumVisual from './components/SpectrumVisual';
import TodaysFocus from './components/TodaysFocus';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getAllCourses } from '@/lib/courses';
import { getAllPractices } from '@/lib/practices';
import { getAllPaths } from '@/lib/learning-paths';

export const metadata: Metadata = {
  title: 'Integrated Human - Psychology, Embodiment & Personal Growth',
  description: 'Live stronger, feel deeper, become whole. Practical paths to integration through psychology, embodiment, relationships, and meaning. Articles, courses, and AI-guided support.',
  keywords: ['personal growth', 'shadow work', 'psychology', 'meditation', 'relationships', 'embodiment', 'nervous system', 'self-development'],
  openGraph: {
    title: 'Integrated Human - Psychology, Embodiment & Personal Growth',
    description: 'Live stronger, feel deeper, become whole. Practical paths to integration through psychology, embodiment, relationships, and meaning.',
    type: 'website',
    images: ['/images/A-Spark-In-The-Universe_web-1400x788.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integrated Human - Psychology, Embodiment & Personal Growth',
    description: 'Live stronger, feel deeper, become whole. Practical paths to integration.',
  },
};

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

  // Get practices for featured section
  const allPractices = getAllPractices();
  const featuredPractices = allPractices.slice(0, 6);

  // Get learning paths for featured section
  const allLearningPaths = getAllPaths();
  const featuredPaths = allLearningPaths.slice(0, 4);

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        <Image
          src="/images/A-Spark-In-The-Universe_web-1400x788.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center hero-bg-image"
          sizes="100vw"
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
              It means bringing together all the parts of yourself into something
              that feels genuinely like <span className="text-gray-300">you</span>.
            </p>
            <p>
              It's building a body that feels alive, a mind that's clear when it needs to be,
              relationships where you can actually show up as yourself.
              The kind of life where you're not constantly running from something.
            </p>
            <p>
              The work takes honesty. Sometimes it's uncomfortable. But there's also
              relief in it—the relief of not pretending anymore, of finally being able to
              breathe. That's what we're here to help you find.
            </p>
          </div>
        </div>
      </section>

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
                Psychology, patterns, emotions. Understanding how you work—so you can work with yourself, not against.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/body" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Body</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Movement, rest, breath, nervous system. Feeling at home in your body and building real vitality.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/soul" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Soul</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Meditation, meaning, philosophy. Finding depth and purpose beyond the daily grind.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore →
              </span>
            </Link>
            <Link href="/relationships" className="group space-y-3">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Relationships</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Attachment, intimacy, connection. Building relationships where you can actually be yourself.
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
                className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors overflow-hidden"
              >
                {post.metadata.image && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={post.metadata.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
                  </div>
                )}
                <div className="p-5">
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
                </div>
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
                className="group flex bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors overflow-hidden"
              >
                {post!.metadata.image && (
                  <div className="relative w-32 flex-shrink-0 overflow-hidden">
                    <Image
                      src={post!.metadata.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="p-5 flex-1">
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
                </div>
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
                      className="group block bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-zinc-600 transition-colors overflow-hidden"
                    >
                      {course.metadata.image && (
                        <div className="relative h-28 w-full overflow-hidden">
                          <Image
                            src={course.metadata.image}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-serif text-base text-white group-hover:text-gray-300 transition-colors mb-1">
                          {course.metadata.title}
                        </h4>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {course.metadata.subtitle}
                        </p>
                      </div>
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

      {/* Practices */}
      {featuredPractices.length > 0 && (
        <section className="py-16 px-6 bg-[var(--card-bg)]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="font-serif text-3xl font-light text-white mb-4">
                Practices
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {allPractices.length} guided practices for nervous system regulation,
                grounding, breathwork, and more. From 3-minute resets to deeper somatic work.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {featuredPractices.map((practice) => (
                <Link
                  key={practice.slug}
                  href={`/practices/${practice.slug}`}
                  className="group block bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {practice.metadata.category}
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">
                      {practice.metadata.durationMinutes} min
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600 capitalize">
                      {practice.metadata.intensity}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-2">
                    {practice.metadata.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {practice.metadata.description}
                  </p>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/practices"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Browse all {allPractices.length} practices →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Learning Paths */}
      {featuredPaths.length > 0 && (
        <section className="py-16 px-6 bg-[var(--background)]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="font-serif text-3xl font-light text-white mb-4">
                Learning Paths
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {allLearningPaths.length} curated journeys combining courses, articles, and practices.
                Structured progressions for deep, lasting transformation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {featuredPaths.map((path) => (
                <Link
                  key={path.id}
                  href={`/learning-paths/${path.id}`}
                  className="group block bg-[var(--card-bg)] border border-[var(--border-color)] p-6 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs uppercase tracking-wide text-gray-500 capitalize">
                      {path.pillar}
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">
                      {path.estimatedDuration}
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">
                      {path.steps.length} steps
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-white group-hover:text-gray-300 transition-colors mb-2">
                    {path.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {path.subtitle}
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {path.description}
                  </p>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/learning-paths"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Browse all {allLearningPaths.length} learning paths →
              </Link>
            </div>
          </div>
        </section>
      )}

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
