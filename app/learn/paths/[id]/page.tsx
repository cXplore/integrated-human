import { Metadata } from 'next';
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getPathById, getAllPaths, type PathStep } from '@/lib/learning-paths';
import { PILLAR_INFO, type Pillar } from '@/lib/integration-health';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const paths = getAllPaths();
  return paths.map((path) => ({ id: path.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const path = getPathById(id);
  if (!path) return { title: 'Path Not Found' };

  return {
    title: `${path.title} | Learning Paths | Integrated Human`,
    description: path.description,
  };
}

const STEP_TYPE_STYLES: Record<PathStep['type'], { bg: string; icon: ReactElement }> = {
  course: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  article: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  practice: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  assessment: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  milestone: {
    bg: 'bg-rose-500/10 border-rose-500/30',
    icon: (
      <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
};

const PILLAR_COLORS: Record<Pillar, string> = {
  mind: 'text-purple-400',
  body: 'text-green-400',
  soul: 'text-amber-400',
  relationships: 'text-blue-400',
};

function getStepUrl(step: PathStep): string {
  switch (step.type) {
    case 'course':
      return `/courses/${step.slug}`;
    case 'article':
      return `/articles/${step.slug}`;
    case 'practice':
      return `/practices/${step.slug}`;
    case 'assessment':
      return `/assessments/${step.slug}`;
    default:
      return '#';
  }
}

export default async function PathDetailPage({ params }: Props) {
  const { id } = await params;
  const path = getPathById(id);

  if (!path) {
    notFound();
  }

  const session = await auth();

  // Get progress for each step
  const stepProgress: Record<number, boolean> = {};

  if (session?.user?.id) {
    for (let i = 0; i < path.steps.length; i++) {
      const step = path.steps[i];
      let completed = false;

      if (step.type === 'course') {
        const progress = await prisma.courseProgress.findMany({
          where: { userId: session.user.id, courseSlug: step.slug },
          select: { completed: true },
        });
        completed = progress.length > 0 && progress.every((p) => p.completed);
      } else if (step.type === 'article') {
        const progress = await prisma.articleProgress.findFirst({
          where: { userId: session.user.id, slug: step.slug, completed: true },
        });
        completed = !!progress;
      } else if (step.type === 'assessment') {
        const result = await prisma.assessmentResult.findFirst({
          where: { userId: session.user.id, type: step.slug },
        });
        completed = !!result;
      } else if (step.type === 'practice') {
        const checkIn = await prisma.integrationCheckIn.findFirst({
          where: { userId: session.user.id, relatedSlug: step.slug },
        });
        completed = !!checkIn;
      }

      stepProgress[i] = completed;
    }
  }

  const completedSteps = Object.values(stepProgress).filter(Boolean).length;
  const totalSteps = path.steps.filter((s) => s.type !== 'milestone').length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/learn/paths"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          All Learning Paths
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-medium uppercase tracking-wide ${PILLAR_COLORS[path.pillar]}`}>
              {PILLAR_INFO[path.pillar].name}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-sm text-gray-500">{path.estimatedDuration}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">{path.title}</h1>
          <p className="text-xl text-gray-400 mb-6">{path.subtitle}</p>

          <p className="text-gray-500 leading-relaxed">{path.description}</p>
        </header>

        {/* Progress (if logged in) */}
        {session && (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Your Progress</span>
              <span className="text-sm text-gray-500">
                {completedSteps} of {totalSteps} steps
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Outcomes */}
        <section className="mb-10">
          <h2 className="text-lg text-white font-medium mb-4">What You&apos;ll Gain</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {path.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-400">{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Path Steps */}
        <section>
          <h2 className="text-lg text-white font-medium mb-6">Path Steps</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

            <div className="space-y-4">
              {path.steps.map((step, i) => {
                const isCompleted = stepProgress[i];
                const styles = STEP_TYPE_STYLES[step.type];
                const url = getStepUrl(step);

                return (
                  <div key={i} className="relative flex items-start gap-4">
                    {/* Circle indicator */}
                    <div
                      className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border ${
                        isCompleted
                          ? 'bg-green-500/20 border-green-500'
                          : styles.bg
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5 text-green-400"
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
                      ) : (
                        styles.icon
                      )}
                    </div>

                    {/* Content */}
                    {step.type === 'milestone' ? (
                      <div className="flex-1 bg-gradient-to-r from-rose-900/20 to-transparent border border-rose-500/20 p-5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-rose-400 uppercase tracking-wide font-medium">
                            Milestone
                          </span>
                          {step.optional && (
                            <span className="text-xs text-gray-600">(optional)</span>
                          )}
                        </div>
                        <h3 className="text-white font-medium mb-1">{step.title}</h3>
                        <p className="text-gray-500 text-sm">{step.description}</p>
                      </div>
                    ) : (
                      <Link
                        href={url}
                        className="flex-1 bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-zinc-600 transition-colors group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs uppercase tracking-wide font-medium ${
                              step.type === 'course'
                                ? 'text-purple-400'
                                : step.type === 'article'
                                  ? 'text-blue-400'
                                  : step.type === 'practice'
                                    ? 'text-green-400'
                                    : 'text-amber-400'
                            }`}
                          >
                            {step.type}
                          </span>
                          {step.duration && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-xs text-gray-600">{step.duration}</span>
                            </>
                          )}
                          {step.optional && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-xs text-gray-600">Optional</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-white font-medium mb-1 group-hover:text-purple-400 transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-gray-500 text-sm">{step.description}</p>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Start CTA */}
        {!session && (
          <div className="mt-12 bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-500/20 p-6 text-center">
            <h3 className="text-white font-medium mb-2">Track Your Progress</h3>
            <p className="text-gray-400 text-sm mb-4">
              Sign in to save your progress and get personalized recommendations.
            </p>
            <Link
              href="/api/auth/signin"
              className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Sign In to Start
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
