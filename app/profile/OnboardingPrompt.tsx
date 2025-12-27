'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProfileStatus {
  hasProfile: boolean;
  onboardingCompleted: boolean;
  hasAssessment: boolean;
}

export default function OnboardingPrompt() {
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        // Check profile
        const profileRes = await fetch('/api/user/profile');
        let hasProfile = false;
        let onboardingCompleted = false;

        if (profileRes.ok) {
          const data = await profileRes.json();
          hasProfile = !!data;
          onboardingCompleted = data?.onboardingCompleted ?? false;
        }

        // Check if user has taken the integration assessment
        let hasAssessment = false;
        try {
          const healthRes = await fetch('/api/health/display');
          if (healthRes.ok) {
            const healthData = await healthRes.json();
            // If they have dimension health data, they've taken the assessment
            hasAssessment = healthData.dimensions && healthData.dimensions.length > 0;
          }
        } catch {
          // Health API might not be available
        }

        setStatus({ hasProfile, onboardingCompleted, hasAssessment });
      } catch (error) {
        console.error('Failed to check status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, []);

  // Don't show anything while loading
  if (isLoading) return null;

  // Don't show if dismissed
  if (dismissed) return null;

  // Don't show if everything is complete
  if (status?.onboardingCompleted && status?.hasAssessment) return null;

  // Determine what to show
  const showOnboarding = !status?.onboardingCompleted;
  const showAssessment = status?.onboardingCompleted && !status?.hasAssessment;

  if (!showOnboarding && !showAssessment) return null;

  return (
    <div className="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-800/30 p-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-800/30 rounded-full flex items-center justify-center">
          {showAssessment ? (
            <span className="text-amber-500 text-lg">◐</span>
          ) : (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          {showAssessment ? (
            <>
              <h3 className="font-serif text-lg text-white mb-1">
                Know Where You Stand
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Take the Integration Assessment to map your development across 30 dimensions.
                Get personalized recommendations and track your growth over time.
              </p>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 bg-amber-800/30 hover:bg-amber-800/50 border border-amber-700/50 px-4 py-2 text-amber-200 text-sm transition-colors"
              >
                Take Assessment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <h3 className="font-serif text-lg text-white mb-1">
                {status?.hasProfile ? 'Complete Your Profile' : 'Help Us Know You Better'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {status?.hasProfile
                  ? 'Finish setting up your profile to get personalized course recommendations and a more tailored experience.'
                  : 'A few questions about where you are in your journey will help us guide you to the right content.'
                }
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-amber-800/30 hover:bg-amber-800/50 border border-amber-700/50 px-4 py-2 text-amber-200 text-sm transition-colors"
              >
                {status?.hasProfile ? 'Continue Setup' : 'Begin'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
