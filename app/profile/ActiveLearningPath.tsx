'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';

interface PathStep {
  slug: string;
  title: string;
  contentType: 'article' | 'course' | 'practice';
  estimatedMinutes: number;
  dimensionId?: string;
  description?: string;
  optional?: boolean;
}

interface CustomLearningPath {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryPillar: string;
  targetDimensions: string[];
  steps: PathStep[];
}

interface PathProgress {
  id: string;
  path: CustomLearningPath;
  completedSteps: string[];
  currentStepIndex: number;
  progress: number;
  isActive: boolean;
  startedAt: string;
  lastActivityAt: string;
}

const CONTENT_TYPE_ICONS: Record<string, ReactNode> = {
  article: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  course: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  practice: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  article: 'text-amber-400 bg-amber-900/30',
  course: 'text-emerald-400 bg-emerald-900/30',
  practice: 'text-rose-400 bg-rose-900/30',
};

const PILLAR_COLORS: Record<string, string> = {
  mind: 'from-blue-900/20 to-transparent border-blue-800/30',
  body: 'from-emerald-900/20 to-transparent border-emerald-800/30',
  soul: 'from-purple-900/20 to-transparent border-purple-800/30',
  relationships: 'from-rose-900/20 to-transparent border-rose-800/30',
};

function getContentHref(step: PathStep): string {
  switch (step.contentType) {
    case 'article':
      return `/posts/${step.slug}`;
    case 'course':
      return `/courses/${step.slug}`;
    case 'practice':
      return `/practices/${step.slug}`;
    default:
      return '#';
  }
}

export default function ActiveLearningPath() {
  const [pathData, setPathData] = useState<PathProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchActivePath();
  }, []);

  async function fetchActivePath() {
    try {
      const response = await fetch('/api/learning-paths/custom');
      if (!response.ok) {
        throw new Error('Failed to fetch learning path');
      }
      const data = await response.json();

      // Find active path
      const activePath = data.paths?.find((p: any) => p.isActive);
      if (activePath) {
        setPathData({
          id: activePath.id,
          path: activePath.pathData,
          completedSteps: activePath.completedSteps || [],
          currentStepIndex: activePath.currentStepIndex || 0,
          progress: Math.round((activePath.completedSteps?.length || 0) / activePath.pathData.steps.length * 100),
          isActive: true,
          startedAt: activePath.startedAt,
          lastActivityAt: activePath.lastActivityAt,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function markStepComplete(stepSlug: string) {
    if (!pathData) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/learning-paths/custom', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: pathData.id,
          completedStepSlug: stepSlug,
          currentStepIndex: pathData.currentStepIndex + 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Refresh data
      await fetchActivePath();
    } catch (err) {
      console.error('Error updating path:', err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4" />
          <div className="h-2 bg-zinc-800 rounded w-full mb-4" />
          <div className="h-20 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail if there's an error
  }

  // No active path - show CTA to create one
  if (!pathData) {
    return (
      <div className="bg-gradient-to-r from-amber-900/20 to-transparent border border-amber-800/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white mb-1">Create Your Learning Path</h3>
            <p className="text-gray-400 text-sm mb-4">
              Based on your assessment results, we can generate a personalized learning path
              focused on your specific growth areas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile/learning-path"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors rounded-lg"
              >
                <span>Generate My Path</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/learning-paths"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors rounded-lg"
              >
                Browse Curated Paths
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { path, completedSteps, currentStepIndex, progress } = pathData;
  const currentStep = path.steps[currentStepIndex];
  const nextSteps = path.steps.slice(currentStepIndex + 1, currentStepIndex + 3);
  const pillarColor = PILLAR_COLORS[path.primaryPillar] || PILLAR_COLORS.mind;

  return (
    <div className={`bg-gradient-to-r ${pillarColor} rounded-xl border p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Your Learning Path
            </span>
            <span className="px-2 py-0.5 text-xs bg-zinc-800 text-gray-400 rounded">
              {path.primaryPillar}
            </span>
          </div>
          <h2 className="text-lg font-medium text-white">{path.title}</h2>
          {path.subtitle && (
            <p className="text-sm text-gray-400 mt-1">{path.subtitle}</p>
          )}
        </div>
        <Link
          href="/profile/learning-path"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          View Full Path
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{completedSteps.length} of {path.steps.length} steps</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-400">
              Current Step
            </span>
          </div>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${CONTENT_TYPE_COLORS[currentStep.contentType]}`}>
              {CONTENT_TYPE_ICONS[currentStep.contentType]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium">{currentStep.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 capitalize">{currentStep.contentType}</span>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-500">{currentStep.estimatedMinutes} min</span>
              </div>
              {currentStep.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{currentStep.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link
              href={getContentHref(currentStep)}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium text-center transition-colors rounded-lg"
            >
              Continue
            </Link>
            <button
              onClick={() => markStepComplete(currentStep.slug)}
              disabled={updating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors rounded-lg disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Mark Complete'}
            </button>
          </div>
        </div>
      )}

      {/* Next Steps Preview */}
      {nextSteps.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Coming Up</span>
          <div className="mt-2 space-y-2">
            {nextSteps.map((step, index) => (
              <div key={step.slug} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/30">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 text-gray-500 text-xs">
                  {currentStepIndex + index + 2}
                </div>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${CONTENT_TYPE_COLORS[step.contentType]}`}>
                  {CONTENT_TYPE_ICONS[step.contentType]}
                </div>
                <span className="text-sm text-gray-400 truncate flex-1">{step.title}</span>
                <span className="text-xs text-gray-600">{step.estimatedMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed State */}
      {!currentStep && completedSteps.length === path.steps.length && (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Path Complete!</h3>
          <p className="text-gray-400 text-sm mb-4">
            You've finished all {path.steps.length} steps in this learning path.
          </p>
          <Link
            href="/profile/learning-path"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors rounded-lg"
          >
            Generate New Path
          </Link>
        </div>
      )}
    </div>
  );
}
