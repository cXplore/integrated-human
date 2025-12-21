import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllBundles, getBundleWithCourses } from '@/lib/bundles';
import BundlePurchaseButton from './BundlePurchaseButton';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    bundleId: string;
  }>;
}

export async function generateStaticParams() {
  const bundles = getAllBundles();
  return bundles.map((bundle) => ({
    bundleId: bundle.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bundleId } = await params;
  const bundle = getBundleWithCourses(bundleId);

  if (!bundle) {
    return {
      title: 'Bundle Not Found | Integrated Human',
    };
  }

  return {
    title: `${bundle.title} | Integrated Human`,
    description: bundle.description,
  };
}

export default async function BundleDetailPage({ params }: PageProps) {
  const { bundleId } = await params;
  const bundle = getBundleWithCourses(bundleId);

  if (!bundle) {
    notFound();
  }

  const totalModules = bundle.courseDetails.reduce(
    (acc, course) => acc + course.metadata.modules.length,
    0
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/bundles"
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                Bundles
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400 text-sm">{bundle.title}</span>
            </div>

            <div className="inline-block px-3 py-1 text-xs uppercase tracking-wide text-amber-500 bg-amber-500/10 border border-amber-500/20 mb-4">
              Save ${bundle.savings} ({Math.round((bundle.savings / bundle.originalPrice) * 100)}% off)
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
              {bundle.title}
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed mb-6">
              {bundle.subtitle}
            </p>

            <p className="text-gray-400 leading-relaxed max-w-2xl mb-8">
              {bundle.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div>
                <span className="text-2xl font-light text-white">
                  {bundle.courseDetails.length}
                </span>
                <span className="text-gray-500 text-sm ml-2">Courses</span>
              </div>
              <div>
                <span className="text-2xl font-light text-white">{totalModules}</span>
                <span className="text-gray-500 text-sm ml-2">Modules</span>
              </div>
              <div>
                <span className="text-2xl font-light text-white">{bundle.category}</span>
                <span className="text-gray-500 text-sm ml-2">Category</span>
              </div>
            </div>

            {/* Price and CTA */}
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-gray-500 line-through">
                  ${bundle.originalPrice}
                </span>
                <span className="text-3xl font-light text-white ml-3">
                  ${bundle.bundlePrice}
                </span>
              </div>
              <BundlePurchaseButton
                bundleId={bundle.id}
                bundleTitle={bundle.title}
                price={bundle.bundlePrice}
              />
            </div>
          </div>
        </section>

        {/* Included Courses */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl text-white mb-8">
              What&apos;s Included
            </h2>

            <div className="space-y-4">
              {bundle.courseDetails.map((course, index) => (
                <div
                  key={course.slug}
                  className="bg-zinc-900 border border-zinc-800 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-gray-400 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {course.metadata.level}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">
                          {course.metadata.modules.length} modules
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">
                          {course.metadata.duration}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl text-white mb-2">
                        {course.metadata.title}
                      </h3>

                      <p className="text-gray-500 text-sm mb-4">
                        {course.metadata.subtitle}
                      </p>

                      <p className="text-gray-400 text-sm">
                        {course.metadata.description}
                      </p>

                      {/* What you'll learn */}
                      {course.metadata.whatYouLearn && course.metadata.whatYouLearn.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">
                            What you&apos;ll learn:
                          </p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {course.metadata.whatYouLearn.slice(0, 4).map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-gray-400"
                              >
                                <svg
                                  className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
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
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
                        >
                          View course details →
                        </Link>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-gray-500 line-through text-sm">
                        ${course.metadata.price}
                      </span>
                      <div className="text-xs text-green-500 mt-1">Included</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-6 border-t border-zinc-800 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-white mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Get lifetime access to all {bundle.courseDetails.length} courses in this bundle
              and save ${bundle.savings}.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div>
                <span className="text-gray-500 line-through">
                  ${bundle.originalPrice}
                </span>
                <span className="text-3xl font-light text-white ml-3">
                  ${bundle.bundlePrice}
                </span>
              </div>
              <BundlePurchaseButton
                bundleId={bundle.id}
                bundleTitle={bundle.title}
                price={bundle.bundlePrice}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
