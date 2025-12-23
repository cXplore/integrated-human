import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { serialize } from 'next-mdx-remote/serialize';
import rehypeSlug from 'rehype-slug';
import {
  getAllCourses,
  getCourseBySlug,
  getModuleContent,
  getAllModulesForCourse,
  getModuleNavigation
} from '@/lib/courses';
import ModuleCompleteButton from './ModuleCompleteButton';
import ModuleContent from './ModuleContent';
import ModuleAccessGuard from './ModuleAccessGuard';
import ContentCompanion from '@/app/components/ContentCompanion';
import { AIErrorBoundary } from '@/app/components/ErrorBoundary';

export async function generateStaticParams() {
  const courses = getAllCourses();
  const params: { courseSlug: string; moduleSlug: string }[] = [];

  for (const course of courses) {
    const modules = getAllModulesForCourse(course.slug);
    for (const module of modules) {
      params.push({
        courseSlug: course.slug,
        moduleSlug: module.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string }>
}): Promise<Metadata> {
  const { courseSlug, moduleSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  const module = getModuleContent(courseSlug, moduleSlug);

  if (!course || !module) {
    return {
      title: 'Module Not Found',
    };
  }

  return {
    title: `${module.title} | ${course.metadata.title} | Integrated Human`,
    description: module.description,
  };
}

export default async function ModulePage({
  params
}: {
  params: Promise<{ courseSlug: string; moduleSlug: string }>
}) {
  const { courseSlug, moduleSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  const module = getModuleContent(courseSlug, moduleSlug);

  if (!course || !module) {
    notFound();
  }

  const modules = getAllModulesForCourse(courseSlug);
  const navigation = getModuleNavigation(courseSlug, module.moduleNumber);

  // Serialize MDX content for client-side rendering with interactive components
  const mdxSource = await serialize(module.content, {
    mdxOptions: {
      rehypePlugins: [rehypeSlug],
    },
  });

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12">
            {/* Sidebar - Module List */}
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <Link
                  href={`/courses/${courseSlug}`}
                  className="text-gray-500 hover:text-white text-sm flex items-center gap-2 mb-6 transition-colors"
                >
                  ← Back to Course
                </Link>

                <h2 className="font-serif text-lg text-white mb-4">
                  {course.metadata.title}
                </h2>

                <nav className="space-y-1">
                  {modules.map((mod) => {
                    const isActive = mod.slug === moduleSlug;
                    const isCompleted = mod.moduleNumber < module.moduleNumber;

                    return (
                      <Link
                        key={mod.slug}
                        href={`/courses/${courseSlug}/${mod.slug}`}
                        className={`flex items-center gap-3 p-3 text-sm transition-colors ${
                          isActive
                            ? 'bg-zinc-800 text-white border-l-2 border-white'
                            : 'text-gray-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
                          isCompleted
                            ? 'bg-green-900 text-green-400'
                            : isActive
                              ? 'bg-white text-zinc-900'
                              : 'bg-zinc-800 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : mod.moduleNumber}
                        </span>
                        <span className="flex-1 line-clamp-1">{mod.title}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Progress */}
                <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-gray-500 mb-2">Your Progress</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full transition-all"
                        style={{ width: `${(module.moduleNumber / modules.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {module.moduleNumber}/{modules.length}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <article className="max-w-3xl">
              {/* Mobile Course Link */}
              <Link
                href={`/courses/${courseSlug}`}
                className="lg:hidden text-gray-500 hover:text-white text-sm flex items-center gap-2 mb-6 transition-colors"
              >
                ← {course.metadata.title}
              </Link>

              {/* Module Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-zinc-800 text-gray-400 text-xs">
                    Module {module.moduleNumber} of {modules.length}
                  </span>
                  <span className="text-gray-600 text-sm">
                    {module.duration} · {module.readingTime} min read
                  </span>
                </div>

                <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                  {module.title}
                </h1>

                <p className="text-gray-400 text-lg">
                  {module.description}
                </p>
              </div>

              {/* Module Content with Access Guard */}
              <ModuleAccessGuard
                courseSlug={courseSlug}
                moduleSlug={moduleSlug}
                moduleNumber={module.moduleNumber}
                courseTitle={course.metadata.title}
                courseTier={course.metadata.tier}
              >
                <div className="prose prose-invert prose-lg max-w-none
                  prose-headings:font-serif prose-headings:font-light prose-headings:text-white
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b prose-h2:border-zinc-800
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:leading-relaxed prose-p:mb-6 prose-p:text-gray-300
                  prose-ul:my-6 prose-li:my-2 prose-li:text-gray-300
                  prose-ol:my-6
                  prose-blockquote:border-l-4 prose-blockquote:border-zinc-700
                  prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400
                  prose-strong:text-white prose-strong:font-semibold
                  prose-a:text-gray-300 prose-a:underline hover:prose-a:text-white
                  prose-hr:border-zinc-800 prose-hr:my-12">
                  <ModuleContent
                    source={mdxSource}
                    courseSlug={courseSlug}
                    moduleSlug={moduleSlug}
                  />
                </div>

                {/* Mark Complete Button */}
                <div className="mt-12">
                  <ModuleCompleteButton
                    courseSlug={courseSlug}
                    moduleSlug={moduleSlug}
                    nextModuleSlug={navigation.next?.slug}
                    isLastModule={!navigation.next}
                  />
                </div>
              </ModuleAccessGuard>

              {/* Module Navigation */}
              <div className="mt-16 pt-8 border-t border-zinc-800">
                <div className="grid md:grid-cols-2 gap-4">
                  {navigation.prev && (
                    <Link
                      href={`/courses/${courseSlug}/${navigation.prev.slug}`}
                      className="group p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-2">← Previous Module</div>
                      <div className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors">
                        {navigation.prev.title}
                      </div>
                    </Link>
                  )}

                  {navigation.next ? (
                    <Link
                      href={`/courses/${courseSlug}/${navigation.next.slug}`}
                      className={`group p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors ${
                        !navigation.prev ? 'md:col-start-2' : ''
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-2 text-right">Next Module →</div>
                      <div className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors text-right">
                        {navigation.next.title}
                      </div>
                    </Link>
                  ) : (
                    <div className={`p-5 bg-zinc-900 border border-zinc-800 ${
                      !navigation.prev ? 'md:col-start-2' : ''
                    }`}>
                      <div className="text-xs text-gray-500 mb-2 text-right">Course Complete</div>
                      <div className="font-serif text-lg text-gray-400 text-right">
                        Congratulations!
                      </div>
                      <Link
                        href={`/courses/${courseSlug}`}
                        className="text-sm text-gray-500 hover:text-white mt-2 block text-right"
                      >
                        Back to course overview →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Module List */}
              <div className="lg:hidden mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-white font-medium mb-4">All Modules</h3>
                <nav className="space-y-2">
                  {modules.map((mod) => {
                    const isActive = mod.slug === moduleSlug;

                    return (
                      <Link
                        key={mod.slug}
                        href={`/courses/${courseSlug}/${mod.slug}`}
                        className={`flex items-center gap-3 p-3 text-sm border transition-colors ${
                          isActive
                            ? 'border-white bg-zinc-900 text-white'
                            : 'border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
                          isActive
                            ? 'bg-white text-zinc-900'
                            : 'bg-zinc-800 text-gray-500'
                        }`}>
                          {mod.moduleNumber}
                        </span>
                        <span className="flex-1">{mod.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </article>
          </div>
        </div>
      </main>
      <AIErrorBoundary>
        <ContentCompanion
          contentType="module"
          contentTitle={module.title}
          contentSlug={courseSlug}
          moduleSlug={moduleSlug}
        />
      </AIErrorBoundary>
    </>
  );
}
