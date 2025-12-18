'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ModuleCompleteButtonProps {
  courseSlug: string;
  moduleSlug: string;
  nextModuleSlug?: string;
  isLastModule?: boolean;
}

export default function ModuleCompleteButton({
  courseSlug,
  moduleSlug,
  nextModuleSlug,
  isLastModule,
}: ModuleCompleteButtonProps) {
  const { data: session } = useSession();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    async function fetchProgress() {
      try {
        const response = await fetch(`/api/course-progress?courseSlug=${courseSlug}`);
        if (response.ok) {
          const data = await response.json();
          const moduleProgress = data.find(
            (p: { moduleSlug: string; completed: boolean }) =>
              p.moduleSlug === moduleSlug && p.completed
          );
          setIsCompleted(!!moduleProgress);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [session, courseSlug, moduleSlug]);

  const handleMarkComplete = async () => {
    if (!session?.user) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/course-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug,
          moduleSlug,
          completed: true,
        }),
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-zinc-900 border border-zinc-800">
        <p className="text-gray-400 text-sm text-center">
          Sign in to track your progress
        </p>
        <Link
          href="/login"
          className="px-5 py-2 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-zinc-900 border border-zinc-800">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-6 bg-zinc-900 border border-green-900">
        <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Module Completed</span>
        </div>
        {nextModuleSlug && (
          <Link
            href={`/courses/${courseSlug}/${nextModuleSlug}`}
            className="block w-full text-center px-5 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
          >
            Continue to Next Module →
          </Link>
        )}
        {isLastModule && (
          <Link
            href={`/courses/${courseSlug}`}
            className="block w-full text-center px-5 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
          >
            View Course Overview
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800">
      <button
        onClick={handleMarkComplete}
        disabled={isSaving}
        className="w-full px-5 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark as Complete
          </>
        )}
      </button>
    </div>
  );
}
