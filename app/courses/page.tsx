import Navigation from '../components/Navigation';
import Link from 'next/link';
import { getAllCourses } from '@/lib/courses';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses | Integrated Human',
  description: 'Deep-dive courses on shadow work, nervous system regulation, attachment repair, and integration. Transform understanding into lasting change.',
};

export default function CoursesPage() {
  const courses = getAllCourses();

  // Group courses by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const cat = course.metadata.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, typeof courses>);

  const categories = ['Free', 'Flagship', 'Mind', 'Body', 'Soul', 'Relationships'];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Courses
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Structured paths for real transformation. Each course guides you through practices,
              not just concepts—so understanding becomes embodied change.
            </p>
          </div>
        </section>

        {/* Course Categories */}
        {courses.length === 0 ? (
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="bg-zinc-900 border border-zinc-800 p-12 text-center">
                <h2 className="font-serif text-2xl font-light text-white mb-4">
                  Courses Coming Soon
                </h2>
                <p className="text-gray-400 leading-relaxed max-w-md mx-auto">
                  We're building deep-dive courses on shadow work, nervous system mastery,
                  and attachment repair. Join the community to be notified when they launch.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Quick Stats */}
            <section className="py-8 px-6 bg-zinc-900/50">
              <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 text-center">
                <div>
                  <div className="text-2xl font-light text-white">{courses.length}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Courses</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-white">
                    {courses.reduce((acc, c) => acc + c.metadata.modules.length, 0)}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Modules</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-white">
                    {Object.keys(coursesByCategory).length}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Categories</div>
                </div>
              </div>
            </section>

            {/* Membership Note */}
            <section className="py-6 px-6 border-b border-zinc-800/50">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-gray-500 text-sm">
                  All courses included with{' '}
                  <Link href="/pricing" className="text-gray-300 hover:text-white underline underline-offset-2">
                    membership ($19/mo)
                  </Link>
                  {' · '}
                  Intro courses are free
                </p>
              </div>
            </section>

            {/* Courses by Category */}
            {categories.map((category) => {
              const categoryCourses = coursesByCategory[category];
              if (!categoryCourses || categoryCourses.length === 0) return null;

              return (
                <section key={category} className="py-16 px-6 border-b border-zinc-800/50">
                  <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-2xl text-white mb-8 flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-zinc-800">
                        {category === 'Free' && (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        )}
                        {category === 'Flagship' && (
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                        {category === 'Mind' && (
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                        {category === 'Body' && (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {category === 'Soul' && (
                          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        )}
                        {category === 'Relationships' && (
                          <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </span>
                      {category}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      {categoryCourses.map((course) => (
                        <Link
                          key={course.slug}
                          href={`/courses/${course.slug}`}
                          className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all p-6"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs uppercase tracking-wide text-gray-500">
                              {course.metadata.level}
                            </span>
                            <span className="text-gray-700">·</span>
                            <span className="text-xs text-gray-500">
                              {course.metadata.duration}
                            </span>
                          </div>

                          <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">
                            {course.metadata.title}
                          </h3>

                          <p className="text-sm text-gray-500 mb-4">
                            {course.metadata.subtitle}
                          </p>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                            {course.metadata.tier === 'intro' ? (
                              <span className="text-sm text-green-500">
                                Free
                              </span>
                            ) : course.metadata.tier === 'flagship' ? (
                              <span className="text-sm text-amber-400 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Flagship
                              </span>
                            ) : (
                              <span className="text-sm text-green-500">
                                Included
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {course.metadata.modules.length} modules
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </>
  );
}
