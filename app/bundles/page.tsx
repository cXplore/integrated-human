import Navigation from '../components/Navigation';
import Link from 'next/link';
import { getAllBundlesWithCourses } from '@/lib/bundles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Bundles | Integrated Human',
  description: 'Save with curated course bundles. Get related courses together at a discount for a complete learning journey.',
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
              Save 30%+ on bundles
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Course Bundles
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Curated paths that work together. Each bundle groups related courses
              for a complete journey at a significant discount.
            </p>
          </div>
        </section>

        {/* Featured Bundles */}
        {featuredBundles.length > 0 && (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-2xl text-white mb-8 flex items-center gap-3">
                <span className="text-amber-500">Popular Bundles</span>
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all flex flex-col"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {bundle.category}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-amber-500 font-medium">
                          Save ${bundle.savings}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl text-white mb-2">
                        {bundle.title}
                      </h3>

                      <p className="text-sm text-gray-500 mb-4">
                        {bundle.subtitle}
                      </p>

                      <p className="text-sm text-gray-400 mb-6 line-clamp-3">
                        {bundle.description}
                      </p>

                      {/* Included courses */}
                      <div className="space-y-2 mb-6">
                        <p className="text-xs uppercase tracking-wide text-gray-600">
                          {bundle.courseDetails.length} Courses Included:
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

                    {/* Price and CTA */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-gray-500 line-through text-sm">
                            ${bundle.originalPrice}
                          </span>
                          <span className="text-2xl font-light text-white ml-2">
                            ${bundle.bundlePrice}
                          </span>
                        </div>
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                          {Math.round((bundle.savings / bundle.originalPrice) * 100)}% off
                        </span>
                      </div>

                      <Link
                        href={`/bundles/${bundle.id}`}
                        className="block w-full py-3 text-center bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                      >
                        View Bundle
                      </Link>
                    </div>
                  </div>
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
                More Bundles
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
                      <span className="text-xs text-amber-500">
                        Save ${bundle.savings}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                      {bundle.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4">
                      {bundle.subtitle}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                      <div>
                        <span className="text-gray-500 line-through text-sm">
                          ${bundle.originalPrice}
                        </span>
                        <span className="text-xl font-light text-white ml-2">
                          ${bundle.bundlePrice}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {bundle.courseDetails.length} courses
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Bundles */}
        <section className="py-16 px-6 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-white mb-6">
              Why Choose a Bundle?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Significant Savings</h3>
                <p className="text-gray-500 text-sm">
                  Save 30% or more compared to buying courses individually.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Curated Paths</h3>
                <p className="text-gray-500 text-sm">
                  Courses selected to build on each other for deeper transformation.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Lifetime Access</h3>
                <p className="text-gray-500 text-sm">
                  All courses in the bundle are yours forever, including updates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
