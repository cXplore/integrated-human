import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { getAllCourses, getCourseBySlug } from '@/lib/courses';
import { getRelatedPostsForCourse } from '@/lib/posts';
import MembershipCTA from '@/app/components/MembershipCTA';
import { CourseJsonLd, BreadcrumbJsonLd } from '@/app/components/JsonLd';

export async function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((course) => ({
    courseSlug: course.slug,
  }));
}

const BASE_URL = 'https://integrated-human.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string }> }): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  const { title, description, category, level, tier, modules, tags } = course.metadata;

  return {
    title: `${title} | Integrated Human`,
    description,
    keywords: [category, level, ...(tags || [])],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/courses/${courseSlug}`,
      siteName: 'Integrated Human',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/courses/${courseSlug}`,
    },
    other: {
      'course:modules': String(modules.length),
      'course:level': level,
      'course:tier': tier,
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const { metadata } = course;
  const relatedArticles = getRelatedPostsForCourse(
    metadata.category,
    metadata.tags || [],
    3
  );

  return (
    <>
      <CourseJsonLd
        title={metadata.title}
        description={metadata.description}
        url={`${BASE_URL}/courses/${courseSlug}`}
        level={metadata.level}
        duration={metadata.duration}
        modules={metadata.modules.length}
        isFree={metadata.tier === 'intro'}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Courses', url: `${BASE_URL}/courses` },
          { name: metadata.title, url: `${BASE_URL}/courses/${courseSlug}` },
        ]}
      />
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero Section with Background Image */}
        <section className="relative py-20 px-6 border-b border-zinc-800 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={metadata.image || `/images/courses/${courseSlug}.jpg`}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/90 to-zinc-950" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-6">
              {metadata.tier === 'flagship' && (
                <>
                  <span className="px-2 py-0.5 text-xs uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Flagship
                  </span>
                  <span className="text-gray-700">·</span>
                </>
              )}
              {metadata.tier === 'intro' && (
                <>
                  <span className="px-2 py-0.5 text-xs uppercase tracking-wide bg-green-500/20 text-green-400 border border-green-500/30">
                    Free
                  </span>
                  <span className="text-gray-700">·</span>
                </>
              )}
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {metadata.category}
              </span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-500">
                {metadata.duration}
              </span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-500">
                {metadata.level}
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
              {metadata.title}
            </h1>

            <p className="text-xl text-gray-400 mb-8">
              {metadata.subtitle}
            </p>

            <p className="text-gray-400 leading-relaxed mb-8 max-w-2xl">
              {metadata.description}
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <MembershipCTA variant="primary" />

              <Link
                href={`/courses/${courseSlug}/${metadata.modules[0].slug}`}
                className="px-8 py-3 border border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500 transition-colors"
              >
                Preview First Module
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* What You'll Learn */}
              {metadata.whatYouLearn && metadata.whatYouLearn.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-serif text-2xl font-light text-white mb-6">
                    What You'll Learn
                  </h2>
                  <ul className="space-y-3">
                    {metadata.whatYouLearn.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Course Modules */}
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-light text-white mb-6">
                  Course Modules
                </h2>
                <div className="space-y-4">
                  {metadata.modules.map((module, index) => (
                    <Link
                      key={module.id || index}
                      href={`/courses/${courseSlug}/${module.slug || module.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white group-hover:text-gray-300 transition-colors mb-1">
                            {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-gray-500 text-sm mb-2">
                              {module.description}
                            </p>
                          )}
                          {module.duration && (
                            <span className="text-xs text-gray-600">
                              {module.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Quiz Section */}
                  {metadata.quiz && (
                    <Link
                      href={`/courses/${courseSlug}/quiz`}
                      className={`group block p-5 transition-colors ${
                        metadata.tier === 'flagship'
                          ? 'bg-amber-900/20 border border-amber-800/50 hover:border-amber-600'
                          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center transition-colors ${
                          metadata.tier === 'flagship'
                            ? 'bg-amber-800/50 group-hover:bg-amber-700/50 text-amber-400 group-hover:text-amber-300'
                            : 'bg-zinc-800 group-hover:bg-zinc-700 text-gray-400 group-hover:text-white'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className={`transition-colors mb-1 ${
                            metadata.tier === 'flagship'
                              ? 'text-amber-400 group-hover:text-amber-300'
                              : 'text-white group-hover:text-gray-300'
                          }`}>
                            {metadata.tier === 'flagship' ? 'Final Assessment' : 'Course Quiz'}
                          </h3>
                          <p className="text-gray-500 text-sm mb-2">
                            {metadata.tier === 'flagship'
                              ? 'Complete the assessment to earn your certificate'
                              : 'Test your understanding of the material'}
                          </p>
                          <span className="text-xs text-gray-600">
                            {metadata.quiz.questions.length} questions · {metadata.quiz.passingScore}% to pass
                          </span>
                        </div>
                        <div className={`flex-shrink-0 transition-colors ${
                          metadata.tier === 'flagship'
                            ? 'text-amber-600 group-hover:text-amber-400'
                            : 'text-gray-600 group-hover:text-gray-400'
                        }`}>
                          →
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </section>

              {/* Requirements */}
              {metadata.requirements && metadata.requirements.length > 0 && (
                <section>
                  <h2 className="font-serif text-2xl font-light text-white mb-6">
                    Requirements
                  </h2>
                  <ul className="space-y-3">
                    {metadata.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-gray-600 mt-1">•</span>
                        <span className="text-gray-400">{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-12 pt-12 border-t border-zinc-800">
                  <h2 className="font-serif text-2xl font-light text-white mb-6">
                    Related Reading
                  </h2>
                  <div className="space-y-4">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/posts/${article.slug}`}
                        className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {article.metadata.categories.map((cat) => (
                                <span
                                  key={cat}
                                  className="text-xs uppercase tracking-wide text-gray-500"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                            <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-1">
                              {article.metadata.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2">
                              {article.metadata.excerpt}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-gray-600 text-sm">
                            {article.readingTime} min
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Course Info Card */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
                  <h3 className="text-white font-medium mb-4">Course Details</h3>

                  <dl className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Modules</dt>
                      <dd className="text-gray-300">{metadata.modules.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Duration</dt>
                      <dd className="text-gray-300">{metadata.duration}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Level</dt>
                      <dd className="text-gray-300">{metadata.level}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Category</dt>
                      <dd className="text-gray-300">{metadata.category}</dd>
                    </div>
                    {metadata.instructor && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Instructor</dt>
                        <dd className="text-gray-300">{metadata.instructor}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <MembershipCTA variant="sidebar" />
                  </div>
                </div>

                {/* Certificate Info - Only for Flagship courses */}
                {metadata.tier === 'flagship' && metadata.quiz && (
                  <div className="bg-amber-900/20 border border-amber-800/50 p-6 mb-6">
                    <h3 className="text-amber-400 font-medium mb-4">Earn a Certificate</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Complete all modules and pass the comprehensive assessment to earn your certificate. This is a substantive test that requires genuine understanding.
                    </p>
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{metadata.quiz.passingScore}% passing score required</span>
                    </div>
                  </div>
                )}

                {/* Quiz Info - For non-flagship courses with quizzes */}
                {metadata.tier !== 'flagship' && metadata.quiz && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
                    <h3 className="text-white font-medium mb-4">Course Quiz</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Test your understanding with the end-of-course quiz.
                    </p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{metadata.quiz.passingScore}% passing score</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6">
                    <h3 className="text-white font-medium mb-4">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-xs border border-zinc-700 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
