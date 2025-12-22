import Navigation from '../components/Navigation';
import Link from 'next/link';
import { getAllBundlesWithCourses } from '@/lib/bundles';
import MembershipCTA from '../components/MembershipCTA';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Paths | Integrated Human',
  description: 'Curated course collections for focused transformation. Each path groups related courses for a complete journey.',
};

export default function BundlesPage() {
  const bundles = getAllBundlesWithCourses();
  const featuredBundles = bundles.filter((b) => b.featured);
  const otherBundles = bundles.filter((b) => !b.featured);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-3 py-1 text-xs uppercase tracking-wide text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-6">
              Included with membership
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Learning Paths
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-8">
              Curated paths that work together. Each collection groups related courses
              for a complete journey through a topic.
            </p>
            <MembershipCTA variant="primary" />
          </div>
        </section>

        {/* Featured Bundles */}
        {featuredBundles.length > 0 && (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-2xl text-white mb-8 flex items-center gap-3">
                <span className="text-amber-500">Popular Paths</span>
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBundles.map((bundle) => (
                  <Link
                    key={bundle.id}
                    href={`/bundles/${bundle.id}`}
                    className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all flex flex-col"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {bundle.category}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-green-500">
                          {bundle.courseDetails.length} courses
                        </span>
                      </div>

                      <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                        {bundle.title}
                      </h3>

                      <p className="text-sm text-gray-500 mb-4">
                        {bundle.subtitle}
                      </p>

                      <p className="text-sm text-gray-400 mb-6 line-clamp-3">
                        {bundle.description}
                      </p>

                      {/* Included courses */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gray-600">
                          Courses Included:
                        </p>
                        <ul className="space-y-1">
                          {bundle.courseDetails.map((course) => (
                            <li
                              key={course.slug}
                              className="flex items-center gap-2 text-sm text-gray-400"
                            >
                              <svg
                                className="w-4 h-4 text-green-500 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="truncate">{course.metadata.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                      <span className="block w-full py-3 text-center bg-zinc-800 group-hover:bg-zinc-700 text-white font-medium transition-colors">
                        View Path →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other Bundles */}
        {otherBundles.length > 0 && (
          <section className="py-16 px-6 border-t border-zinc-800/50">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-2xl text-white mb-8">
                More Paths
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {otherBundles.map((bundle) => (
                  <Link
                    key={bundle.id}
                    href={`/bundles/${bundle.id}`}
                    className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {bundle.category}
                      </span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-green-500">
                        {bundle.courseDetails.length} courses
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                      {bundle.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      {bundle.subtitle}
                    </p>

                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                      View path →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Paths */}
        <section className="py-16 px-6 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-white mb-6">
              Why Follow a Path?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Curated Sequence</h3>
                <p className="text-gray-500 text-sm">
                  Courses selected to build on each other for deeper transformation.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Faster Progress</h3>
                <p className="text-gray-500 text-sm">
                  No guessing what to do next. Follow the sequence for best results.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Complete Coverage</h3>
                <p className="text-gray-500 text-sm">
                  Address a topic from multiple angles for lasting change.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
