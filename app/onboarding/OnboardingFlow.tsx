'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExperienceLevels {
  meditation: number;
  therapy: number;
  bodywork: number;
  psychedelics: number;
  spiritualPractice: number;
}

interface ProfileData {
  primaryIntention?: string;
  lifeSituation?: string;
  experienceLevels?: ExperienceLevels;
  hasAwakeningExperience?: boolean;
  awakeningDescription?: string;
  currentChallenges?: string[];
  interests?: string[];
  depthPreference?: string;
  learningStyle?: string;
  timeAvailable?: string;
  sensitivities?: string[];
  onboardingCompleted?: boolean;
}

interface OnboardingFlowProps {
  existingProfile: ProfileData | null;
  userName?: string;
}

// 5 core steps including assessment prompt
const STEPS = [
  'intention',
  'situation',
  'challenges',
  'depth',
  'assessment-invite',
] as const;

type Step = typeof STEPS[number];

export default function OnboardingFlow({ existingProfile, userName }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(
    existingProfile?.onboardingCompleted ? 'depth' : 'intention'
  );
  const [saving, setSaving] = useState(false);

  // Form state
  const [profile, setProfile] = useState<ProfileData>({
    primaryIntention: existingProfile?.primaryIntention || '',
    lifeSituation: existingProfile?.lifeSituation || '',
    experienceLevels: existingProfile?.experienceLevels || {
      meditation: 1,
      therapy: 1,
      bodywork: 1,
      psychedelics: 1,
      spiritualPractice: 1,
    },
    hasAwakeningExperience: existingProfile?.hasAwakeningExperience || false,
    awakeningDescription: existingProfile?.awakeningDescription || '',
    currentChallenges: existingProfile?.currentChallenges || [],
    interests: existingProfile?.interests || [],
    depthPreference: existingProfile?.depthPreference || '',
    learningStyle: existingProfile?.learningStyle || '',
    timeAvailable: existingProfile?.timeAvailable || '',
    sensitivities: existingProfile?.sensitivities || [],
  });

  const saveProfile = useCallback(async (completed = false) => {
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          onboardingCompleted: completed,
        }),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
    setSaving(false);
  }, [profile]);

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
      // Auto-save progress
      saveProfile(false);
    }
  }, [currentStep, saveProfile]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(async () => {
    setSaving(true);
    await saveProfile(true);

    // Trigger initial health calculation based on onboarding data
    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'onboarding-complete' }),
      });
    } catch {
      // Health calculation is not critical, continue to profile
    }

    router.push('/profile');
  }, [saveProfile, router]);

  const toggleArrayItem = (field: 'currentChallenges' | 'interests' | 'sensitivities', item: string) => {
    setProfile(prev => {
      const current = prev[field] || [];
      const updated = current.includes(item)
        ? current.filter((i: string) => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intention':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-4">Step 1 of 5</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                What brings you here?
              </h2>
              <p className="text-gray-400">
                What is your primary reason for exploring this path?
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { value: 'healing', label: 'Healing', desc: 'Working through pain, trauma, or difficulty' },
                { value: 'growth', label: 'Growth', desc: 'Becoming more of who I can be' },
                { value: 'understanding', label: 'Understanding', desc: 'Making sense of myself and life' },
                { value: 'crisis', label: 'Crisis', desc: 'In the midst of something acute' },
                { value: 'curiosity', label: 'Curiosity', desc: 'Exploring without a specific goal' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setProfile(prev => ({ ...prev, primaryIntention: option.value }))}
                  className={`p-5 border text-left transition-all ${
                    profile.primaryIntention === option.value
                      ? 'border-white bg-white/10'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-gray-400 text-sm mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'situation':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-4">Step 2 of 5</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                Where are you in life right now?
              </h2>
              <p className="text-gray-400">
                There is no judgment here. Just honesty.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { value: 'stable', label: 'Stable', desc: 'Life is relatively steady' },
                { value: 'transition', label: 'Transition', desc: 'In between something old and something new' },
                { value: 'crisis', label: 'Crisis', desc: 'Things are falling apart' },
                { value: 'rebuilding', label: 'Rebuilding', desc: 'Putting things back together' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setProfile(prev => ({ ...prev, lifeSituation: option.value }))}
                  className={`p-5 border text-left transition-all ${
                    profile.lifeSituation === option.value
                      ? 'border-white bg-white/10'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-gray-400 text-sm mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'challenges':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-4">Step 3 of 5</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                What are you working with?
              </h2>
              <p className="text-gray-400">
                Select any that feel relevant. This helps us recommend content.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'anxiety', 'depression', 'trauma', 'grief',
                'relationships', 'identity', 'purpose', 'anger',
                'shame', 'addiction', 'loneliness', 'stress',
                'self-worth', 'boundaries', 'attachment', 'burnout',
              ].map(challenge => (
                <button
                  key={challenge}
                  onClick={() => toggleArrayItem('currentChallenges', challenge)}
                  className={`p-3 border text-sm capitalize transition-all ${
                    profile.currentChallenges?.includes(challenge)
                      ? 'border-white bg-white/10 text-white'
                      : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
                  }`}
                >
                  {challenge}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs text-center">
              You can skip this if you prefer not to share
            </p>
          </div>
        );

      case 'depth':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-4">Step 4 of 5</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                How deep do you want to go?
              </h2>
              <p className="text-gray-400">
                What level of content is right for you now?
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { value: 'foundational', label: 'Foundational', desc: 'New to this work, building basics' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, ready to go deeper' },
                { value: 'deep', label: 'Deep', desc: 'Significant experience, seeking depth' },
                { value: 'advanced', label: 'Advanced', desc: 'Extensive practice, subtle work' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setProfile(prev => ({ ...prev, depthPreference: option.value }))}
                  className={`p-5 border text-left transition-all ${
                    profile.depthPreference === option.value
                      ? 'border-white bg-white/10'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-gray-400 text-sm mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'assessment-invite':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-4">Step 5 of 5</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                Know Where You Stand
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                The Integration Assessment maps your development across 30 dimensions
                of mind, body, soul, and relationships.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 space-y-4">
              <h3 className="font-medium text-white text-lg">What you will learn:</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5">◐</span>
                  <span>Your current developmental stage across each pillar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5">◐</span>
                  <span>Which dimensions need attention vs. which are strong</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5">◐</span>
                  <span>Personalized content recommendations based on your gaps</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-0.5">◐</span>
                  <span>A baseline to track your progress over time</span>
                </li>
              </ul>
              <p className="text-gray-500 text-sm pt-2">
                Takes about 15-20 minutes. Your scores decay over time, prompting
                reassessment as you grow.
              </p>
            </div>

            <div className="text-center text-gray-500 text-sm">
              You can take this now or later from your profile
            </div>
          </div>
        );
    }
  };

  const stepIndex = STEPS.indexOf(currentStep);
  const isLastStep = stepIndex === STEPS.length - 1;
  const isAssessmentStep = currentStep === 'assessment-invite';
  const canProceed =
    (currentStep === 'intention' && profile.primaryIntention) ||
    (currentStep === 'situation' && profile.lifeSituation) ||
    (currentStep === 'challenges') || // Optional
    (currentStep === 'depth' && profile.depthPreference) ||
    (currentStep === 'assessment-invite'); // Always can proceed (choice)

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-8 border-t border-zinc-800">
        <button
          onClick={prevStep}
          disabled={stepIndex === 0}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {isAssessmentStep ? (
          <div className="flex gap-3">
            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="px-6 py-3 text-gray-400 hover:text-white border border-zinc-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Skip for now'}
            </button>
            <button
              onClick={async () => {
                setSaving(true);
                await saveProfile(true);
                router.push('/assessment');
              }}
              disabled={saving}
              className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Take Assessment'}
            </button>
          </div>
        ) : isLastStep ? (
          <button
            onClick={completeOnboarding}
            disabled={!canProceed || saving}
            className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Complete Setup'}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canProceed}
            className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
