import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { getAllCourses, getCourseBySlug } from '@/lib/courses';

export async function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((course) => ({
    courseSlug: course.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string }> }): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.metadata.title} | Integrated Human`,
    description: course.metadata.description,
  };
}

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const { metadata } = course;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero Section */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
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
              <div className="flex items-center gap-2">
                <span className="text-3xl text-white font-light">
                  ${metadata.price}
                </span>
                <span className="text-gray-500">
                  {metadata.currency}
                </span>
              </div>

              <button className="px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors">
                Enroll Now
              </button>

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

              {/* Course Modules */}
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-light text-white mb-6">
                  Course Modules
                </h2>
                <div className="space-y-4">
                  {metadata.modules.map((module, index) => (
                    <Link
                      key={module.id}
                      href={`/courses/${courseSlug}/${module.slug}`}
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
                          <p className="text-gray-500 text-sm mb-2">
                            {module.description}
                          </p>
                          <span className="text-xs text-gray-600">
                            {module.duration}
                          </span>
                        </div>
                        <div className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Requirements */}
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
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Instructor</dt>
                      <dd className="text-gray-300">{metadata.instructor}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <div className="text-center mb-4">
                      <span className="text-2xl text-white">${metadata.price}</span>
                      <span className="text-gray-500 ml-2">{metadata.currency}</span>
                    </div>
                    <button className="w-full py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors">
                      Enroll Now
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {metadata.tags.length > 0 && (
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
