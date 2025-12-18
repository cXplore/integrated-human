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
  const featuredCourses = getAllCourses().slice(0, 4);

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-6 text-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-bg-image"
          style={{ backgroundImage: 'url(/images/A-Spark-In-The-Universe_web-1400x788.jpg)' }}
        />
        {/* Dark/Light overlay for text readability */}
        <div className="absolute inset-0 bg-black/70 hero-overlay" />
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
            className="px-8 py-3 border border-[var(--accent-tertiary)] text-gray-300 hover:border-[var(--accent-primary)] hover:text-white transition-all duration-300"
          >
            Mind
          </Link>
          <Link
            href="/body"
            className="px-8 py-3 border border-[var(--accent-tertiary)] text-gray-300 hover:border-[var(--accent-primary)] hover:text-white transition-all duration-300"
          >
            Body
          </Link>
          <Link
            href="/soul"
            className="px-8 py-3 border border-[var(--accent-tertiary)] text-gray-300 hover:border-[var(--accent-primary)] hover:text-white transition-all duration-300"
          >
            Soul
          </Link>
          <Link
            href="/relationships"
            className="px-8 py-3 border border-[var(--accent-tertiary)] text-gray-300 hover:border-[var(--accent-primary)] hover:text-white transition-all duration-300"
          >
            Relationships
          </Link>
        </div>
        </div>
      </section>

      {/* Wisdom Quote */}
      <WisdomQuote />

      {/* About Section */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-12 text-center">
            What Integration Actually Means
          </h2>
          <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
            <p>
              You've probably tried optimizing your way to happiness. Productivity hacks, morning routines,
              positive affirmations. And maybe it worked for a while—until it didn't.
            </p>
            <p>
              Integration is different. It's not about becoming a better version of yourself.
              It's about becoming more of who you already are—including the parts you've been taught to hide.
            </p>
            <p>
              The anxiety in your chest? It has something to say. The patterns you keep repeating
              in relationships? They made sense once. The parts of yourself you've rejected? They're waiting to come home.
            </p>
            <p>
              This work isn't about fixing what's broken. It's about listening to what's been ignored.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-20 px-6 bg-[var(--background)]">
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

      {/* The Four Pillars */}
      <section className="py-20 px-6 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-16 text-center">
            The Four Pillars
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Mind</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Psychology, patterns, shadow work, emotions. How you think and feel—the inner landscape.
              </p>
              <Link href="/mind" className="inline-block text-gray-300 underline hover:text-white transition-colors text-sm">
                Explore Mind →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Body</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Training, nutrition, sleep, breath, nervous system. Your physical foundation for everything else.
              </p>
              <Link href="/body" className="inline-block text-gray-300 underline hover:text-white transition-colors text-sm">
                Explore Body →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Soul</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Meditation, meaning, philosophy, psychedelics. The depths beyond optimization.
              </p>
              <Link href="/soul" className="inline-block text-gray-300 underline hover:text-white transition-colors text-sm">
                Explore Soul →
              </Link>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-white">Relationships</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Attachment, intimacy, polarity, conflict. How you connect with others—and why it goes wrong.
              </p>
              <Link href="/relationships" className="inline-block text-gray-300 underline hover:text-white transition-colors text-sm">
                Explore Relationships →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6 bg-[var(--background)]">
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
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {course.metadata.category}
                  </span>
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
                  <span className="text-gray-300">${course.metadata.price}</span>
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

      {/* Newsletter Signup */}
      <section className="py-20 px-6 bg-[var(--card-bg)] border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* Essential Reads */}
      <section className="py-20 px-6 bg-[var(--background)]">
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
