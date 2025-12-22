import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllCourses } from '@/lib/courses';

export const metadata: Metadata = {
  title: 'Course Audits | Integrated Human',
  description: 'Detailed audit documents for our courses, explaining curriculum, methodology, and quality standards.',
  openGraph: {
    title: 'Course Audits | Integrated Human',
    description: 'Quality audit documents for all Integrated Human courses.',
  },
};

// Tier display names for grouping
const tierOrder = ['flagship', 'advanced', 'intermediate', 'beginner', 'intro'] as const;
const tierLabels: Record<string, string> = {
  intro: 'Introductory Courses',
  beginner: 'Foundation Courses',
  intermediate: 'Intermediate Courses',
  advanced: 'Advanced Courses',
  flagship: 'Mastery Courses',
};

export default function AuditsPage() {
  const allCourses = getAllCourses();

  // Group courses by tier
  const coursesByTier = tierOrder.reduce((acc, tier) => {
    acc[tier] = allCourses.filter(c => c.metadata.tier === tier);
    return acc;
  }, {} as Record<string, typeof allCourses>);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/transparency" className="text-gray-500 hover:text-gray-300 transition-colors">
                ← Back to Transparency
              </Link>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Course Audits
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              Every course has an audit document explaining its curriculum,
              methodology, sources, and what the credential represents.
            </p>

            {/* Site-Wide Quality Standards */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-4">Site-Wide Quality Standards</h2>
              <p className="text-gray-400 mb-4">
                Before exploring individual course audits, review our platform-wide
                quality standards that apply to all content.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/transparency/standards"
                  className="inline-block px-4 py-2 border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors text-sm"
                >
                  Quality Standards
                </Link>
                <Link
                  href="/transparency/methodology"
                  className="inline-block px-4 py-2 border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors text-sm"
                >
                  Our Methodology
                </Link>
              </div>
            </div>

            {/* Courses by Tier */}
            <div className="space-y-12">
              {tierOrder.map((tier) => {
                const courses = coursesByTier[tier];
                if (!courses || courses.length === 0) return null;

                return (
                  <div key={tier}>
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="font-serif text-xl text-white">{tierLabels[tier]}</h2>
                      <span className={`text-xs px-2 py-1 ${
                        tier === 'advanced' || tier === 'flagship'
                          ? 'bg-amber-900/30 text-amber-500'
                          : 'bg-zinc-800 text-gray-400'
                      }`}>
                        {tier === 'advanced' || tier === 'flagship' ? 'Certificate' : 'Completion Record'}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {courses.map((course) => (
                        <Link
                          key={course.slug}
                          href={`/transparency/audits/${course.slug}`}
                          className="block p-4 border border-zinc-800 hover:border-zinc-600 transition-colors group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white group-hover:text-gray-200">
                                {course.metadata.title}
                              </h3>
                              <p className="text-gray-500 text-sm mt-1">
                                {course.metadata.category} · {course.metadata.modules.length} modules
                              </p>
                            </div>
                            <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
                              View Audit →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* What Audits Include */}
            <div className="mt-16 pt-16 border-t border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-6">What Each Audit Includes</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Course Overview</h3>
                  <p className="text-gray-500 text-sm">
                    Learning objectives, target audience, and what the course achieves.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Curriculum Structure</h3>
                  <p className="text-gray-500 text-sm">
                    Module breakdown, duration, and how concepts build on each other.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Methodology & Sources</h3>
                  <p className="text-gray-500 text-sm">
                    What research, traditions, or frameworks inform the content.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Assessment Criteria</h3>
                  <p className="text-gray-500 text-sm">
                    For certificate courses: what the assessment measures and passing requirements.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Credential Meaning</h3>
                  <p className="text-gray-500 text-sm">
                    What earning this credential demonstrates about your learning.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Limitations</h3>
                  <p className="text-gray-500 text-sm">
                    What the course doesn't cover and when professional support is needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
