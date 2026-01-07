import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Navigation from '@/app/components/Navigation';
import { getPracticeBySlug, getAllPractices } from '@/lib/practices';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const practices = getAllPractices();
  return practices.map((practice) => ({
    slug: practice.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const practice = getPracticeBySlug(slug);

  if (!practice) {
    return { title: 'Practice Not Found' };
  }

  return {
    title: `${practice.metadata.title} | Practice Library | Integrated Human`,
    description: practice.metadata.description,
  };
}

const INTENSITY_COLORS: Record<string, string> = {
  gentle: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  activating: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  intense: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const DURATION_LABELS: Record<string, string> = {
  quick: '1-3 min',
  short: '5-10 min',
  medium: '15-20 min',
  long: '30+ min',
};

export default async function PracticePage({ params }: PageProps) {
  const { slug } = await params;
  const practice = getPracticeBySlug(slug);

  if (!practice) {
    notFound();
  }

  const { metadata, content } = practice;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <article className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link
                href="/practices"
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                Practice Library
              </Link>
            </div>

            {/* Header */}
            <header className="mb-12">
              {/* Category */}
              {metadata.category && (
                <div className="text-amber-500 text-sm uppercase tracking-wide mb-3">
                  {metadata.category.replace('-', ' ')}
                </div>
              )}

              {/* Title */}
              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
                {metadata.title}
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-400 mb-6">
                {metadata.description}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Duration */}
                {metadata.durationMinutes && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{metadata.durationMinutes} minutes</span>
                  </div>
                )}

                {/* Intensity */}
                {metadata.intensity && (
                  <div className={`px-3 py-1 text-xs border ${INTENSITY_COLORS[metadata.intensity] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'}`}>
                    {metadata.intensity}
                  </div>
                )}
              </div>
            </header>

            {/* Helps With */}
            {metadata.helpssWith && metadata.helpssWith.length > 0 && (
              <div className="mb-8 p-4 bg-zinc-900 border border-zinc-800">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  This practice helps with
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.helpssWith.map((item) => (
                    <span
                      key={item}
                      className="text-sm px-2 py-1 bg-zinc-800 text-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-serif prose-headings:font-light prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300">
              <MDXRemote source={content} />
            </div>

            {/* Related Content */}
            {(metadata.relatedCourses && metadata.relatedCourses.length > 0) && (
              <div className="mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">
                  Go Deeper
                </h3>
                <div className="flex flex-wrap gap-3">
                  {metadata.relatedCourses.map((courseSlug) => (
                    <Link
                      key={courseSlug}
                      href={`/courses/${courseSlug}`}
                      className="px-4 py-2 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                    >
                      {courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Library */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
              <Link
                href="/practices"
                className="text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                Browse more practices
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
