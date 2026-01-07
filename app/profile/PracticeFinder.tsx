'use client';

import { useState } from 'react';
import Link from 'next/link';

type NervousSystemState = 'sympathetic' | 'dorsal' | 'regulated';
type EmotionalState = 'anxious' | 'sad' | 'angry' | 'numb' | 'overwhelmed' | 'restless' | 'fine';

interface Practice {
  slug: string;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  intensity: string;
  category: string;
}

// Practice recommendations mapped by state
// This is a simplified version - in production, this would come from an API
// that matches against practice metadata (bestFor field)
const PRACTICE_RECOMMENDATIONS: Record<string, Practice[]> = {
  'sympathetic-anxious': [
    { slug: 'extended-exhale', title: 'Extended Exhale', description: 'Activate your vagus nerve and signal safety', duration: 'short', durationMinutes: 3, intensity: 'gentle', category: 'breathwork' },
    { slug: 'humming-meditation', title: 'Humming Meditation', description: 'Use vibration to calm your nervous system', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'somatic' },
    { slug: 'stop-practice', title: 'STOP Practice', description: 'One-minute mindfulness reset', duration: 'short', durationMinutes: 1, intensity: 'gentle', category: 'cognitive' },
  ],
  'sympathetic-angry': [
    { slug: 'walking-meditation', title: 'Walking Meditation', description: 'Move the energy through your body', duration: 'medium', durationMinutes: 10, intensity: 'gentle', category: 'somatic' },
    { slug: 'extended-exhale', title: 'Extended Exhale', description: 'Down-regulate your nervous system', duration: 'short', durationMinutes: 3, intensity: 'gentle', category: 'breathwork' },
    { slug: 'unsent-letter', title: 'Unsent Letter', description: 'Release what you are carrying', duration: 'medium', durationMinutes: 15, intensity: 'moderate', category: 'emotional' },
  ],
  'sympathetic-overwhelmed': [
    { slug: 'stop-practice', title: 'STOP Practice', description: 'Pause and reset in one minute', duration: 'short', durationMinutes: 1, intensity: 'gentle', category: 'cognitive' },
    { slug: 'extended-exhale', title: 'Extended Exhale', description: 'Signal safety to your body', duration: 'short', durationMinutes: 3, intensity: 'gentle', category: 'breathwork' },
    { slug: 'listening-meditation', title: 'Listening Meditation', description: 'Anchor in sound, not thoughts', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'mindfulness' },
  ],
  'sympathetic-restless': [
    { slug: 'walking-meditation', title: 'Walking Meditation', description: 'Channel restlessness into presence', duration: 'medium', durationMinutes: 10, intensity: 'gentle', category: 'somatic' },
    { slug: 'humming-meditation', title: 'Humming Meditation', description: 'Ground through your own voice', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'somatic' },
    { slug: 'three-good-things', title: 'Three Good Things', description: 'Redirect attention intentionally', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'cognitive' },
  ],
  'dorsal-sad': [
    { slug: 'humming-meditation', title: 'Humming Meditation', description: 'Gently activate your system', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'somatic' },
    { slug: 'unsent-letter', title: 'Unsent Letter', description: 'Express what needs expressing', duration: 'medium', durationMinutes: 15, intensity: 'moderate', category: 'emotional' },
    { slug: 'walking-meditation', title: 'Walking Meditation', description: 'Gentle movement to reconnect', duration: 'medium', durationMinutes: 10, intensity: 'gentle', category: 'somatic' },
  ],
  'dorsal-numb': [
    { slug: 'humming-meditation', title: 'Humming Meditation', description: 'Wake up the body gently', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'somatic' },
    { slug: 'walking-meditation', title: 'Walking Meditation', description: 'Reconnect through movement', duration: 'medium', durationMinutes: 10, intensity: 'gentle', category: 'somatic' },
    { slug: 'listening-meditation', title: 'Listening Meditation', description: 'Engage with the world around you', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'mindfulness' },
  ],
  'dorsal-overwhelmed': [
    { slug: 'extended-exhale', title: 'Extended Exhale', description: 'Start with just breathing', duration: 'short', durationMinutes: 3, intensity: 'gentle', category: 'breathwork' },
    { slug: 'humming-meditation', title: 'Humming Meditation', description: 'Gentle activation', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'somatic' },
    { slug: 'stop-practice', title: 'STOP Practice', description: 'Just one minute', duration: 'short', durationMinutes: 1, intensity: 'gentle', category: 'cognitive' },
  ],
  'regulated-fine': [
    { slug: 'three-good-things', title: 'Three Good Things', description: 'Build on your good state', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'cognitive' },
    { slug: 'listening-meditation', title: 'Listening Meditation', description: 'Deepen your presence', duration: 'short', durationMinutes: 5, intensity: 'gentle', category: 'mindfulness' },
    { slug: 'meeting-inner-critic', title: 'Meeting Inner Critic', description: 'Deeper work when you have capacity', duration: 'medium', durationMinutes: 15, intensity: 'moderate', category: 'parts-work' },
  ],
  'default': [
    { slug: 'extended-exhale', title: 'Extended Exhale', description: 'Start here - works for most states', duration: 'short', durationMinutes: 3, intensity: 'gentle', category: 'breathwork' },
    { slug: 'stop-practice', title: 'STOP Practice', description: 'Quick reset anytime', duration: 'short', durationMinutes: 1, intensity: 'gentle', category: 'cognitive' },
    { slug: 'walking-meditation', title: 'Walking Meditation', description: 'If sitting is hard', duration: 'medium', durationMinutes: 10, intensity: 'gentle', category: 'somatic' },
  ],
};

const NERVOUS_SYSTEM_OPTIONS: { value: NervousSystemState; label: string; description: string; color: string }[] = [
  { value: 'sympathetic', label: 'Activated', description: 'Fight/flight, wired, on edge', color: 'bg-orange-500' },
  { value: 'dorsal', label: 'Shutdown', description: 'Collapsed, numb, frozen', color: 'bg-blue-500' },
  { value: 'regulated', label: 'Regulated', description: 'Calm, present, grounded', color: 'bg-emerald-500' },
];

const EMOTION_OPTIONS: { value: EmotionalState; label: string }[] = [
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Sad' },
  { value: 'angry', label: 'Angry' },
  { value: 'numb', label: 'Numb' },
  { value: 'overwhelmed', label: 'Overwhelmed' },
  { value: 'restless', label: 'Restless' },
  { value: 'fine', label: 'Fine' },
];

const CATEGORY_COLORS: Record<string, string> = {
  breathwork: 'text-cyan-400',
  somatic: 'text-emerald-400',
  cognitive: 'text-amber-400',
  emotional: 'text-rose-400',
  mindfulness: 'text-purple-400',
  'parts-work': 'text-indigo-400',
  relational: 'text-pink-400',
};

export default function PracticeFinder() {
  const [nervousSystem, setNervousSystem] = useState<NervousSystemState | null>(null);
  const [emotion, setEmotion] = useState<EmotionalState | null>(null);
  const [showResults, setShowResults] = useState(false);

  const getRecommendations = (): Practice[] => {
    if (!nervousSystem || !emotion) return PRACTICE_RECOMMENDATIONS.default;

    const key = `${nervousSystem}-${emotion}`;
    return PRACTICE_RECOMMENDATIONS[key] || PRACTICE_RECOMMENDATIONS.default;
  };

  const handleSelect = () => {
    if (nervousSystem && emotion) {
      setShowResults(true);
    }
  };

  const resetSelection = () => {
    setNervousSystem(null);
    setEmotion(null);
    setShowResults(false);
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          Practice Finder
        </h2>
        {showResults && (
          <button
            onClick={resetSelection}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {!showResults ? (
        <>
          {/* Question 1: Nervous System State */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-3">How does your body feel right now?</p>
            <div className="grid grid-cols-3 gap-2">
              {NERVOUS_SYSTEM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setNervousSystem(option.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    nervousSystem === option.value
                      ? 'border-white bg-zinc-800'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    <span className="text-white text-sm font-medium">{option.label}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Emotion (show after nervous system selected) */}
          {nervousSystem && (
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-3">What emotion is most present?</p>
              <div className="flex flex-wrap gap-2">
                {EMOTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setEmotion(option.value);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      emotion === option.value
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {nervousSystem && emotion && (
            <button
              onClick={handleSelect}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors rounded-lg"
            >
              Find Practices
            </button>
          )}

          {/* Not sure prompt */}
          {!nervousSystem && (
            <p className="text-gray-600 text-xs mt-4 text-center">
              Not sure?{' '}
              <Link href="/practices" className="text-gray-400 hover:text-gray-300">
                Browse all practices
              </Link>
            </p>
          )}
        </>
      ) : (
        <>
          {/* Results */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Based on feeling <span className="text-white">{nervousSystem}</span> and <span className="text-white">{emotion}</span>:
            </p>
          </div>

          <div className="space-y-3">
            {recommendations.map((practice) => (
              <Link
                key={practice.slug}
                href={`/practices/${practice.slug}`}
                className="block group"
              >
                <div className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">
                      {practice.category === 'breathwork' && '🌬️'}
                      {practice.category === 'somatic' && '🫀'}
                      {practice.category === 'cognitive' && '🧠'}
                      {practice.category === 'emotional' && '💧'}
                      {practice.category === 'mindfulness' && '🔔'}
                      {practice.category === 'parts-work' && '🪞'}
                      {practice.category === 'relational' && '🤝'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-sm font-medium group-hover:text-gray-300 transition-colors">
                        {practice.title}
                      </h3>
                      <span className={`text-xs ${CATEGORY_COLORS[practice.category] || 'text-gray-400'}`}>
                        {practice.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{practice.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{practice.durationMinutes} min</span>
                      <span className="text-gray-700">•</span>
                      <span className="text-xs text-gray-600">{practice.intensity}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* View all link */}
          <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
            <Link
              href="/practices"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              View all practices →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
