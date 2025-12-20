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

const STEPS = [
  'welcome',
  'intention',
  'situation',
  'experience',
  'awakening',
  'challenges',
  'interests',
  'depth',
  'complete',
] as const;

type Step = typeof STEPS[number];

export default function OnboardingFlow({ existingProfile, userName }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(
    existingProfile?.onboardingCompleted ? 'complete' : 'welcome'
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
    await saveProfile(true);
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

  const setExperienceLevel = (key: keyof ExperienceLevels, value: number) => {
    setProfile(prev => ({
      ...prev,
      experienceLevels: {
        ...prev.experienceLevels!,
        [key]: value,
      },
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-8">
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white">
              {userName ? `Welcome, ${userName.split(' ')[0]}` : 'Welcome'}
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto">
              Before we begin, I would like to understand where you are in your journey.
              This helps me guide you to what is most relevant for you.
            </p>
            <p className="text-gray-500">
              There are no right answers. Only honest ones.
            </p>
            <button
              onClick={nextStep}
              className="mt-8 px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Begin
            </button>
          </div>
        );

      case 'intention':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                What brings you here?
              </h2>
              <p className="text-gray-400">
                What is your primary reason for exploring this path?
              </p>
            </div>
            <div className="grid gap-4">
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
                  className={`p-6 rounded-lg border text-left transition-all ${
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
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                Where are you in life right now?
              </h2>
              <p className="text-gray-400">
                There is no judgment here. Just honesty.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { value: 'stable', label: 'Stable', desc: 'Life is relatively steady' },
                { value: 'transition', label: 'Transition', desc: 'In between something old and something new' },
                { value: 'crisis', label: 'Crisis', desc: 'Things are falling apart' },
                { value: 'rebuilding', label: 'Rebuilding', desc: 'Putting things back together' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setProfile(prev => ({ ...prev, lifeSituation: option.value }))}
                  className={`p-6 rounded-lg border text-left transition-all ${
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

      case 'experience':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                Your background
              </h2>
              <p className="text-gray-400">
                How much experience do you have with these areas?<br />
                (1 = none, 5 = extensive)
              </p>
            </div>
            <div className="space-y-6">
              {[
                { key: 'meditation', label: 'Meditation / Mindfulness' },
                { key: 'therapy', label: 'Therapy / Counseling' },
                { key: 'bodywork', label: 'Bodywork / Somatic practices' },
                { key: 'psychedelics', label: 'Psychedelics / Plant medicine' },
                { key: 'spiritualPractice', label: 'Spiritual practice / Religion' },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="text-gray-500">{profile.experienceLevels?.[item.key as keyof ExperienceLevels] || 1}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={profile.experienceLevels?.[item.key as keyof ExperienceLevels] || 1}
                    onChange={(e) => setExperienceLevel(item.key as keyof ExperienceLevels, parseInt(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>None</span>
                    <span>Extensive</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'awakening':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                Transcendent experiences
              </h2>
              <p className="text-gray-400">
                Have you had experiences of awakening, transcendence,<br />
                or profound shifts in perception?
              </p>
            </div>
            <div className="grid gap-4 mb-8">
              <button
                onClick={() => setProfile(prev => ({ ...prev, hasAwakeningExperience: true }))}
                className={`p-6 rounded-lg border text-left transition-all ${
                  profile.hasAwakeningExperience === true
                    ? 'border-white bg-white/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="font-medium text-white">Yes</div>
                <div className="text-gray-400 text-sm mt-1">
                  I have had experiences like this
                </div>
              </button>
              <button
                onClick={() => setProfile(prev => ({ ...prev, hasAwakeningExperience: false, awakeningDescription: '' }))}
                className={`p-6 rounded-lg border text-left transition-all ${
                  profile.hasAwakeningExperience === false
                    ? 'border-white bg-white/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="font-medium text-white">No / Not sure</div>
                <div className="text-gray-400 text-sm mt-1">
                  I have not, or I am not certain
                </div>
              </button>
            </div>
            {profile.hasAwakeningExperience && (
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">
                  If you would like, briefly describe (optional):
                </label>
                <textarea
                  value={profile.awakeningDescription || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, awakeningDescription: e.target.value }))}
                  placeholder="A moment of clarity, an experience that changed your perspective..."
                  className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-gray-600 focus:border-zinc-500 focus:outline-none resize-none"
                  rows={4}
                />
              </div>
            )}
          </div>
        );

      case 'challenges':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                What are you working with?
              </h2>
              <p className="text-gray-400">
                Select any that feel relevant. This helps us recommend content.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                'anxiety', 'depression', 'trauma', 'grief',
                'relationships', 'identity', 'purpose', 'anger',
                'shame', 'addiction', 'loneliness', 'stress',
                'self-worth', 'boundaries', 'attachment', 'burnout',
              ].map(challenge => (
                <button
                  key={challenge}
                  onClick={() => toggleArrayItem('currentChallenges', challenge)}
                  className={`p-4 rounded-lg border text-sm capitalize transition-all ${
                    profile.currentChallenges?.includes(challenge)
                      ? 'border-white bg-white/10 text-white'
                      : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
                  }`}
                >
                  {challenge}
                </button>
              ))}
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                What draws you?
              </h2>
              <p className="text-gray-400">
                Select the areas you are most interested in exploring.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                'shadow work', 'nervous system', 'meditation', 'embodiment',
                'relationships', 'meaning & purpose', 'archetypes', 'emotions',
                'spirituality', 'creativity', 'masculine/feminine', 'integration',
                'consciousness', 'trauma healing', 'inner child', 'boundaries',
              ].map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleArrayItem('interests', interest)}
                  className={`p-4 rounded-lg border text-sm capitalize transition-all ${
                    profile.interests?.includes(interest)
                      ? 'border-white bg-white/10 text-white'
                      : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );

      case 'depth':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                How deep do you want to go?
              </h2>
              <p className="text-gray-400">
                What level of content is right for you now?
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { value: 'foundational', label: 'Foundational', desc: 'New to this work, building basics' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, ready to go deeper' },
                { value: 'deep', label: 'Deep', desc: 'Significant experience, seeking depth' },
                { value: 'advanced', label: 'Advanced', desc: 'Extensive practice, subtle work' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setProfile(prev => ({ ...prev, depthPreference: option.value }))}
                  className={`p-6 rounded-lg border text-left transition-all ${
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

      case 'complete':
        return (
          <div className="text-center space-y-8">
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white">
              Thank you
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto">
              I now have a sense of where you are. This will help guide you to what is most relevant for your journey.
            </p>
            <p className="text-gray-500">
              You can update this anytime in your profile.
            </p>
            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="mt-8 px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue to Profile'}
            </button>
          </div>
        );
    }
  };

  const stepIndex = STEPS.indexOf(currentStep);
  const showNavigation = currentStep !== 'welcome' && currentStep !== 'complete';

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Progress indicator */}
      {showNavigation && (
        <div className="mb-12">
          <div className="flex justify-center gap-2">
            {STEPS.slice(1, -1).map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < stepIndex - 1
                    ? 'bg-white'
                    : index === stepIndex - 1
                    ? 'bg-white'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      {showNavigation && (
        <div className="flex justify-between mt-12 pt-8 border-t border-zinc-800">
          <button
            onClick={prevStep}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
