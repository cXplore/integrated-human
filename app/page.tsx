import Link from 'next/link';
import Navigation from './components/Navigation';
import WisdomQuote from './components/WisdomQuote';
import PostCard from './components/PostCard';
import NewsletterSignup from './components/NewsletterSignup';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getAllCourses } from '@/lib/courses';

const essentialReads = [
  'shadow-work-beginners-guide',
  'understanding-your-nervous-system',
  'attachment-styles-real-life-dating',
  'meditation-without-the-mysticism',
];

export default function Home() {
  const latestPosts = getAllPosts().slice(0, 3);
  const starterPosts = essentialReads
    .map(slug => getPostBySlug(slug))
    .filter(Boolean);

  // Get featured courses, prioritizing free ones
  const allCourses = getAllCourses();
  const freeCourses = allCourses.filter(c => c.metadata.price === 0).slice(0, 2);
  const paidCourses = allCourses.filter(c => c.metadata.price > 0).slice(0, 2);
  const featuredCourses = [...freeCourses, ...paidCourses].slice(0, 4);

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-bg-image"
          style={{ backgroundImage: 'url(/images/A-Spark-In-The-Universe_web-1400x788.jpg)' }}
        />
        {/* Dark/Light overlay for text readability */}
        <div className="absolute inset-0 bg-black/70 hero-overlay" />
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6">
            Integrated Human
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Live stronger, feel deeper, become whole.
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Explore psychology, embodiment, relationships, and meaning—practical paths to becoming more of who you already are.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/start-here"
              className="px-8 py-4 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
            >
              Start Here
            </Link>
            <Link
              href="/courses"
              className="px-8 py-4 border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Browse Courses
            </Link>
          </div>

          {/* Four Pillars Links */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/mind"
              className="px-6 py-2 text-sm border border-zinc-700 text-gray-400 hover:border-zinc-500 hover:text-white transition-all duration-300"
            >
              Mind
            </Link>
            <Link
              href="/body"
              className="px-6 py-2 text-sm border border-zinc-700 text-gray-400 hover:border-zinc-500 hover:text-white transition-all duration-300"
            >
              Body
            </Link>
            <Link
              href="/soul"
              className="px-6 py-2 text-sm border border-zinc-700 text-gray-400 hover:border-zinc-500 hover:text-white transition-all duration-300"
            >
              Soul
            </Link>
            <Link
              href="/relationships"
              className="px-6 py-2 text-sm border border-zinc-700 text-gray-400 hover:border-zinc-500 hover:text-white transition-all duration-300"
            >
              Relationships
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Wisdom Quote */}
      <WisdomQuote />

      {/* What Integration Means - Condensed */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-8">
            What Integration Actually Means
          </h2>
          <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
            <p>
              Integration isn't about becoming a better version of yourself.
              It's about becoming more of who you already are—including the parts you've been taught to hide.
            </p>
            <p className="text-gray-400">
              The anxiety, the patterns, the rejected parts of yourself—they're not problems to fix.
              They're wisdom waiting to be heard.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-block mt-8 text-gray-400 hover:text-white transition-colors underline"
          >
            Learn more about our approach →
          </Link>
        </div>
      </section>

      {/* Start Your Journey */}
      <section className="py-20 px-6 bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Start Your Journey
            </h2>
            <p className="text-gray-400">
              Not sure where to begin? Here are three ways in.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/start-here"
              className="group block bg-zinc-900 border border-zinc-800 p-8 hover:border-zinc-600 transition-colors text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 group-hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                Take the Quiz
              </h3>
              <p className="text-gray-500 text-sm">
                Answer a few questions and get personalized recommendations
              </p>
            </Link>

            <Link
              href="/archetypes"
              className="group block bg-zinc-900 border border-zinc-800 p-8 hover:border-zinc-600 transition-colors text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 group-hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                Discover Your Archetypes
              </h3>
              <p className="text-gray-500 text-sm">
                Understand the patterns driving your behavior
              </p>
            </Link>

            <Link
              href="/learning-paths"
              className="group block bg-zinc-900 border border-zinc-800 p-8 hover:border-zinc-600 transition-colors text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 group-hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                Browse Learning Paths
              </h3>
              <p className="text-gray-500 text-sm">
                Curated journeys through specific topics
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Go Deeper with Courses
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Structured paths for real transformation. Each course guides you through practices,
              not just concepts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredCourses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {course.metadata.category}
                    </span>
                    {course.metadata.price === 0 && (
                      <span className="text-xs text-green-500 uppercase tracking-wide">
                        Free
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{course.metadata.modules.length} modules</span>
                </div>
                <h3 className="font-serif text-xl text-white group-hover:text-gray-300 transition-colors mb-2">
                  {course.metadata.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {course.metadata.subtitle}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{course.metadata.duration}</span>
                  <span className={course.metadata.price === 0 ? 'text-green-500' : 'text-gray-300'}>
                    {course.metadata.price === 0 ? 'Start Free' : `$${course.metadata.price}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/courses"
              className="inline-block px-8 py-3 border border-zinc-700 text-gray-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              View All Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* The Four Pillars */}
      <section className="py-20 px-6 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-16 text-center">
            The Four Pillars
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/mind" className="group space-y-4">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Mind</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Psychology, patterns, shadow work, emotions. How you think and feel—the inner landscape.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore Mind →
              </span>
            </Link>
            <Link href="/body" className="group space-y-4">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Body</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Training, nutrition, sleep, breath, nervous system. Your physical foundation for everything else.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore Body →
              </span>
            </Link>
            <Link href="/soul" className="group space-y-4">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Soul</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Meditation, meaning, philosophy, psychedelics. The depths beyond optimization.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore Soul →
              </span>
            </Link>
            <Link href="/relationships" className="group space-y-4">
              <h3 className="font-serif text-2xl font-light text-white group-hover:text-gray-300 transition-colors">Relationships</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Attachment, intimacy, polarity, conflict. How you connect with others—and why it goes wrong.
              </p>
              <span className="inline-block text-gray-500 group-hover:text-white transition-colors text-sm">
                Explore Relationships →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-12 text-center">
            Latest Articles
          </h2>
          <div className="space-y-8">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/library"
              className="inline-block text-gray-400 hover:text-white transition-colors"
            >
              Browse the full library →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 px-6 bg-[var(--background)] border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* Essential Reads */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Essential Reads
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              New here? These four articles cover the foundations. Start anywhere.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {starterPosts.map((post) => (
              <Link
                key={post!.slug}
                href={`/posts/${post!.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {post!.metadata.categories[0]}
                  </span>
                  <span className="text-xs text-gray-600">{post!.readingTime} min</span>
                </div>
                <h3 className="font-serif text-xl text-white group-hover:text-gray-300 transition-colors mb-2">
                  {post!.metadata.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2">
                  {post!.metadata.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
