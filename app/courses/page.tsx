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

            {/* Courses by Category */}
            {categories.map((category) => {
              const categoryCourses = coursesByCategory[category];
              if (!categoryCourses || categoryCourses.length === 0) return null;

              return (
                <section key={category} className="py-16 px-6 border-b border-zinc-800/50">
                  <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-2xl text-white mb-8 flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-lg">
                        {category === 'Free' && '🎁'}
                        {category === 'Flagship' && '⭐'}
                        {category === 'Mind' && '🧠'}
                        {category === 'Body' && '💪'}
                        {category === 'Soul' && '✨'}
                        {category === 'Relationships' && '💕'}
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
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${course.metadata.price === 0 ? 'text-green-500' : 'text-white'}`}>
                                {course.metadata.price === 0 ? 'Free' : `$${course.metadata.price}`}
                              </span>
                            </div>
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
