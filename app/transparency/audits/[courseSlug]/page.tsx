import Navigation from '../../../components/Navigation';
import Link from 'next/link';
import { getCourseBySlug, getAllCourses, type SpectrumStage } from '@/lib/courses';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ courseSlug: string }>;
}

// Tier display names
const tierLabels: Record<string, string> = {
  intro: 'Introductory',
  beginner: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  flagship: 'Mastery',
};

// Spectrum stage descriptions
const spectrumDescriptions: Record<SpectrumStage, string> = {
  collapse: 'Crisis support and stabilization',
  regulation: 'Nervous system regulation and safety',
  integration: 'Processing, shadow work, and healing',
  embodiment: 'Living your values consistently',
  optimization: 'Peak performance and mastery',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return { title: 'Course Not Found' };
  }

  return {
    title: `${course.metadata.title} - Course Audit | Integrated Human`,
    description: `Detailed audit document for ${course.metadata.title}: curriculum, methodology, sources, and credential requirements.`,
  };
}

export async function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((course) => ({
    courseSlug: course.slug,
  }));
}

export default async function CourseAuditPage({ params }: Props) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const { metadata } = course;
  const isCertificate = metadata.tier === 'advanced' || metadata.tier === 'flagship';
  const tierLabel = tierLabels[metadata.tier] || metadata.tier;

  // Calculate total duration
  const totalModules = metadata.modules.length;
  const hasQuiz = !!metadata.quiz;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/transparency/audits" className="text-gray-500 hover:text-gray-300 transition-colors">
                ← Back to Course Audits
              </Link>
            </div>

            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs px-2 py-1 ${
                  isCertificate
                    ? 'bg-amber-900/30 text-amber-500'
                    : 'bg-zinc-800 text-gray-400'
                }`}>
                  {tierLabel} · {isCertificate ? 'Certificate' : 'Completion Record'}
                </span>
                <span className="text-xs text-gray-600">
                  {metadata.category}
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-4">
                {metadata.title}
              </h1>

              <p className="text-lg text-gray-400">
                {metadata.subtitle}
              </p>
            </div>

            {/* Course Overview */}
            <div className="mb-12 p-6 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Course Overview</h2>
              <p className="text-gray-400 mb-6">{metadata.description}</p>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Modules</span>
                  <span className="text-white">{totalModules} modules</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Level</span>
                  <span className="text-white">{metadata.level}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Assessment</span>
                  <span className="text-white">{hasQuiz ? `Quiz (${metadata.quiz?.passingScore}% to pass)` : 'Completion only'}</span>
                </div>
              </div>
            </div>

            {/* Development Spectrum Fit */}
            {metadata.spectrum && metadata.spectrum.length > 0 && (
              <div className="mb-12">
                <h2 className="font-serif text-xl text-white mb-4">Development Spectrum Fit</h2>
                <p className="text-gray-400 mb-4 text-sm">
                  This course is designed for people in the following stages of development:
                </p>
                <div className="flex flex-wrap gap-2">
                  {metadata.spectrum.map((stage) => (
                    <div
                      key={stage}
                      className="px-3 py-2 border border-zinc-700 bg-zinc-900"
                    >
                      <span className="text-white font-medium capitalize">{stage}</span>
                      <span className="text-gray-500 text-sm block">{spectrumDescriptions[stage]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-4">
                  <Link href="/transparency/methodology" className="hover:text-gray-400 underline">
                    Learn more about our Development Spectrum framework →
                  </Link>
                </p>
              </div>
            )}

            {/* Curriculum Structure */}
            <div className="mb-12">
              <h2 className="font-serif text-xl text-white mb-4">Curriculum Structure</h2>
              <div className="space-y-3">
                {metadata.modules.map((module, index) => (
                  <div
                    key={module.id || module.slug || index}
                    className="p-4 border border-zinc-800"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-gray-600 font-mono text-sm">{index + 1}</span>
                      <div className="flex-1">
                        <h3 className="text-white">{module.title}</h3>
                        <p className="text-gray-500 text-sm">{module.description}</p>
                      </div>
                      {module.duration && (
                        <span className="text-gray-600 text-sm">{module.duration}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Outcomes */}
            {metadata.whatYouLearn && metadata.whatYouLearn.length > 0 && (
              <div className="mb-12">
                <h2 className="font-serif text-xl text-white mb-4">Learning Outcomes</h2>
                <p className="text-gray-400 mb-4 text-sm">
                  Upon completion, you will be able to:
                </p>
                <ul className="space-y-2">
                  {metadata.whatYouLearn.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-400">
                      <span className="text-green-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {metadata.requirements && metadata.requirements.length > 0 && (
              <div className="mb-12">
                <h2 className="font-serif text-xl text-white mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {metadata.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-400">
                      <span className="text-gray-600">◇</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assessment Details (for certificate courses) */}
            {isCertificate && hasQuiz && (
              <div className="mb-12 p-6 bg-amber-950/10 border border-amber-800/30">
                <h2 className="font-serif text-xl text-white mb-4">Assessment & Certification</h2>
                <p className="text-gray-400 mb-4">
                  This course awards a <strong className="text-amber-500">Certificate of Achievement</strong> upon
                  successful completion of all modules and the assessment.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assessment Type</span>
                    <span className="text-white">Multiple choice quiz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Number of Questions</span>
                    <span className="text-white">{metadata.quiz?.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passing Score</span>
                    <span className="text-white">{metadata.quiz?.passingScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retakes Allowed</span>
                    <span className="text-white">Unlimited</span>
                  </div>
                </div>
              </div>
            )}

            {/* Credential Meaning */}
            <div className="mb-12">
              <h2 className="font-serif text-xl text-white mb-4">What This Credential Means</h2>
              {isCertificate ? (
                <div className="text-gray-400 space-y-3">
                  <p>
                    Earning this <strong className="text-white">Certificate of Achievement</strong> demonstrates that you:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Completed all {totalModules} course modules and exercises</li>
                    <li>• Passed the assessment with a score of {metadata.quiz?.passingScore}% or higher</li>
                    <li>• Demonstrated understanding of the core concepts</li>
                    <li>• Engaged with practical applications and reflections</li>
                  </ul>
                  <p className="text-gray-500 text-sm mt-4">
                    This certificate is verifiable at integratedhuman.co/certificate/[id]
                  </p>
                </div>
              ) : (
                <div className="text-gray-400 space-y-3">
                  <p>
                    This <strong className="text-white">Completion Record</strong> acknowledges that you:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Completed all {totalModules} course modules</li>
                    <li>• Engaged with the exercises and reflections</li>
                    <li>• Invested time in your personal development</li>
                  </ul>
                  <p className="text-gray-500 text-sm mt-4">
                    Completion records are appropriate for introductory and foundation-level courses
                    where the goal is exposure and exploration rather than demonstrated mastery.
                  </p>
                </div>
              )}
            </div>

            {/* Limitations */}
            <div className="mb-12 p-6 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Limitations & Scope</h2>
              <div className="text-gray-400 space-y-3 text-sm">
                <p>
                  This course is <strong className="text-white">educational content</strong>, not:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Therapy or clinical treatment</li>
                  <li>• Medical or psychological diagnosis</li>
                  <li>• A substitute for professional mental health support</li>
                  <li>• Crisis intervention</li>
                </ul>
                <p className="mt-4">
                  If you're experiencing acute distress, mental health crisis, or need clinical support,
                  please seek appropriate professional help.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-800 pt-12 flex flex-wrap gap-4">
              <Link
                href={`/courses/${courseSlug}`}
                className="inline-block px-6 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
              >
                View Course →
              </Link>
              <Link
                href="/transparency/certificates"
                className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Certificate Standards
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
