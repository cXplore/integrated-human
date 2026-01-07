'use client';

import Link from 'next/link';
import { type LearningPath, type PathStep } from '@/lib/learning-paths';

interface LearningPathCardProps {
  path: LearningPath;
  variant?: 'default' | 'compact' | 'featured';
  showSteps?: boolean;
}

const PILLAR_STYLES: Record<string, { gradient: string; color: string; bgLight: string; border: string }> = {
  mind: {
    gradient: 'from-blue-900/60 via-blue-800/40 to-transparent',
    color: 'text-blue-400',
    bgLight: 'bg-blue-400/10',
    border: 'border-blue-400/30',
  },
  body: {
    gradient: 'from-green-900/60 via-green-800/40 to-transparent',
    color: 'text-green-400',
    bgLight: 'bg-green-400/10',
    border: 'border-green-400/30',
  },
  soul: {
    gradient: 'from-purple-900/60 via-purple-800/40 to-transparent',
    color: 'text-purple-400',
    bgLight: 'bg-purple-400/10',
    border: 'border-purple-400/30',
  },
  relationships: {
    gradient: 'from-rose-900/60 via-rose-800/40 to-transparent',
    color: 'text-rose-400',
    bgLight: 'bg-rose-400/10',
    border: 'border-rose-400/30',
  },
};

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  mind: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  body: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  soul: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  relationships: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const STEP_TYPE_ICONS: Record<string, React.ReactNode> = {
  course: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  article: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  practice: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  assessment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  milestone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
};

const STEP_TYPE_COLORS: Record<string, string> = {
  course: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  article: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  practice: 'bg-green-500/20 text-green-400 border-green-500/30',
  assessment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  milestone: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function StepPreview({ step, index }: { step: PathStep; index: number }) {
  const colorClass = STEP_TYPE_COLORS[step.type] || STEP_TYPE_COLORS.article;
  const icon = STEP_TYPE_ICONS[step.type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border ${colorClass} text-xs`}>
      <span className="opacity-60">{index + 1}.</span>
      {icon}
      <span className="truncate">{step.title}</span>
      {step.duration && <span className="opacity-60 ml-auto shrink-0">{step.duration}</span>}
    </div>
  );
}

export default function LearningPathCard({ path, variant = 'default', showSteps = false }: LearningPathCardProps) {
  const pillarStyle = PILLAR_STYLES[path.pillar] || PILLAR_STYLES.mind;
  const pillarIcon = PILLAR_ICONS[path.pillar];

  const stepCount = path.steps.filter((s) => s.type !== 'milestone').length;
  const courseCount = path.steps.filter((s) => s.type === 'course').length;
  const practiceCount = path.steps.filter((s) => s.type === 'practice').length;
  const articleCount = path.steps.filter((s) => s.type === 'article').length;

  // First few content steps for preview (exclude milestones)
  const previewSteps = path.steps
    .filter((s) => s.type !== 'milestone')
    .slice(0, 4);

  if (variant === 'compact') {
    return (
      <Link
        href={`/learn/paths/${path.id}`}
        className="group flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all"
      >
        {/* Icon */}
        <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${pillarStyle.gradient} flex items-center justify-center`}>
          <span className={pillarStyle.color}>{pillarIcon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate group-hover:text-amber-400 transition-colors">
            {path.title}
          </h4>
          <p className="text-gray-500 text-xs truncate">{path.subtitle}</p>
        </div>

        {/* Duration */}
        <span className="text-gray-600 text-xs shrink-0">{path.estimatedDuration}</span>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/learn/paths/${path.id}`}
        className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden"
      >
        {/* Hero area with gradient and pattern */}
        <div className={`relative h-40 bg-gradient-to-br ${pillarStyle.gradient} overflow-hidden`}>
          {/* Pattern background */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id={`pattern-${path.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#pattern-${path.id})`} />
          </svg>

          {/* Central icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-white/20 scale-[4]`}>{pillarIcon}</div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

          {/* Pillar badge */}
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border ${pillarStyle.color} ${pillarStyle.border} ${pillarStyle.bgLight}`}>
              {pillarIcon}
              <span className="capitalize">{path.pillar}</span>
            </span>
          </div>

          {/* Duration */}
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white/80 text-xs">
              {path.estimatedDuration}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-white text-xl font-medium mb-1 group-hover:text-amber-400 transition-colors">
            {path.title}
          </h3>
          <p className="text-gray-400 text-sm mb-3">{path.subtitle}</p>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{path.description}</p>

          {/* Step previews */}
          <div className="space-y-2 mb-4">
            {previewSteps.slice(0, 3).map((step, i) => (
              <StepPreview key={step.slug} step={step} index={i} />
            ))}
            {path.steps.length > 3 && (
              <p className="text-gray-600 text-xs pl-3">+{path.steps.length - 3} more steps</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-4 border-t border-zinc-800">
            <span>{stepCount} steps</span>
            {courseCount > 0 && <span>{courseCount} courses</span>}
            {articleCount > 0 && <span>{articleCount} articles</span>}
            {practiceCount > 0 && <span>{practiceCount} practices</span>}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/learn/paths/${path.id}`}
      className="group block bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left section: Icon + Main content */}
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            {/* Icon area */}
            <div className={`w-16 h-16 shrink-0 bg-gradient-to-br ${pillarStyle.gradient} flex items-center justify-center relative overflow-hidden`}>
              {/* Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id={`default-pattern-${path.id}`} x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                    <circle cx="12.5" cy="12.5" r="2" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill={`url(#default-pattern-${path.id})`} />
              </svg>
              <span className={`${pillarStyle.color} z-10`}>{pillarIcon}</span>
            </div>

            {/* Title area */}
            <div className="flex-1 min-w-0">
              {/* Pillar badge */}
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border mb-2 ${pillarStyle.color} ${pillarStyle.border} ${pillarStyle.bgLight}`}>
                <span className="capitalize">{path.pillar}</span>
              </div>

              <h3 className="text-white text-xl font-medium group-hover:text-amber-400 transition-colors">
                {path.title}
              </h3>
              <p className="text-gray-400 text-sm">{path.subtitle}</p>
            </div>

            {/* Duration - desktop */}
            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-gray-500 text-sm">{path.estimatedDuration}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{path.description}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>{stepCount} steps</span>
            {courseCount > 0 && (
              <span className="flex items-center gap-1">
                {STEP_TYPE_ICONS.course}
                {courseCount} course{courseCount !== 1 ? 's' : ''}
              </span>
            )}
            {articleCount > 0 && (
              <span className="flex items-center gap-1">
                {STEP_TYPE_ICONS.article}
                {articleCount} article{articleCount !== 1 ? 's' : ''}
              </span>
            )}
            {practiceCount > 0 && (
              <span className="flex items-center gap-1">
                {STEP_TYPE_ICONS.practice}
                {practiceCount} practice{practiceCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="sm:hidden">{path.estimatedDuration}</span>
          </div>

          {/* Stages */}
          <div className="flex flex-wrap gap-2 mt-4">
            {path.stages.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500 rounded capitalize">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Right section: Content previews or outcomes */}
        <div className="lg:w-80 shrink-0 lg:pl-6 lg:border-l border-t lg:border-t-0 border-zinc-800 pt-4 lg:pt-0">
          {showSteps ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Includes</p>
              <div className="space-y-2">
                {previewSteps.map((step, i) => (
                  <StepPreview key={step.slug} step={step} index={i} />
                ))}
                {path.steps.length > 4 && (
                  <p className="text-gray-600 text-xs pl-3">+{path.steps.length - 4} more</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">What you'll gain</p>
              <ul className="space-y-2">
                {path.outcomes.slice(0, 4).map((outcome, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="line-clamp-1">{outcome}</span>
                  </li>
                ))}
                {path.outcomes.length > 4 && (
                  <li className="text-xs text-gray-600 pl-6">+{path.outcomes.length - 4} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
