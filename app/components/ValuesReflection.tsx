'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ReflectionStep {
  id: number;
  title: string;
  prompt: string;
  subPrompts?: string[];
  placeholder: string;
}

interface SavedValuesResult {
  responses: Record<number, string>;
  coreValues?: string;
  savedAt: string;
}

const reflectionSteps: ReflectionStep[] = [
  {
    id: 1,
    title: 'What Matters',
    prompt: "When you imagine yourself at the end of your life, looking back — what would make you feel it was well-lived?",
    subPrompts: [
      "Not what you should want. What you actually want.",
      "Not what would impress others. What would satisfy you.",
    ],
    placeholder: "Write freely... there are no wrong answers here.",
  },
  {
    id: 2,
    title: 'Peak Moments',
    prompt: "Think of 2-3 moments when you felt most alive, most yourself. What was happening?",
    subPrompts: [
      "These don't have to be big achievements.",
      "Notice what they have in common.",
    ],
    placeholder: "Describe these moments...",
  },
  {
    id: 3,
    title: 'What You Avoid',
    prompt: "What ways of living feel hollow or inauthentic to you? What would you never want to become?",
    subPrompts: [
      "Sometimes we discover values by their opposites.",
      "What makes you lose respect for someone?",
    ],
    placeholder: "Write what comes to mind...",
  },
  {
    id: 4,
    title: 'The Tension',
    prompt: "Where do your values conflict with how you're actually living? Where is the gap?",
    subPrompts: [
      "Not to judge yourself — just to see clearly.",
      "What would need to change to close this gap?",
    ],
    placeholder: "Be honest with yourself...",
  },
  {
    id: 5,
    title: 'One Thing',
    prompt: "If you could only embody one quality for the rest of your life — presence, courage, love, wisdom, creativity, something else — what would it be?",
    subPrompts: [
      "Don't overthink. What's the first answer that feels true?",
    ],
    placeholder: "Name it...",
  },
];

export default function ValuesReflection() {
  const { data: session } = useSession();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [coreValues, setCoreValues] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Load saved result on mount
  useEffect(() => {
    async function loadSaved() {
      if (!session?.user) {
        setLoadingSaved(false);
        return;
      }

      try {
        const res = await fetch('/api/assessments?type=values');
        const data = await res.json();
        if (data.result?.results) {
          const savedData = data.result.results as SavedValuesResult;
          setHasSavedResult(true);
          setResponses(savedData.responses || {});
          setCoreValues(savedData.coreValues || '');
        }
      } catch (error) {
        console.error('Error loading saved values:', error);
      }
      setLoadingSaved(false);
    }
    loadSaved();
  }, [session]);

  const handleSave = async () => {
    if (!session?.user) return;

    setSaving(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'values',
          results: {
            responses,
            coreValues,
            savedAt: new Date().toISOString(),
          },
          summary: coreValues || undefined,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setHasSavedResult(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving values:', error);
    }
    setSaving(false);
  };

  const handleNext = () => {
    if (currentStep < reflectionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setStarted(false);
    }
  };

  const handleResponseChange = (stepId: number, value: string) => {
    setResponses({ ...responses, [stepId]: value });
  };

  const reset = () => {
    setStarted(false);
    setCurrentStep(0);
    setResponses({});
    setCoreValues('');
    setShowSummary(false);
    setSaved(false);
  };

  const hasContent = Object.values(responses).some(r => r.trim().length > 0);

  // Intro screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white">Values Reflection</h2>
          <div className="text-gray-400 leading-relaxed space-y-4 text-left">
            <p>
              We live most of our lives on autopilot — doing what we think we should,
              chasing what we were told to want, avoiding what makes us uncomfortable.
            </p>
            <p>
              This reflection is an invitation to pause and ask: <em>What actually matters to me?</em>
              Not what should matter. Not what looks good. What's true.
            </p>
            <p>
              There are no right answers.{' '}
              {session?.user
                ? 'You can save your responses to your profile when you\'re done.'
                : 'Your responses are private — they stay in your browser and disappear when you leave.'}
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {hasSavedResult && (
            <button
              onClick={() => setShowSummary(true)}
              className="block w-full max-w-xs mx-auto px-8 py-4 bg-amber-600 text-white hover:bg-amber-500 transition-colors"
            >
              View Your Previous Reflection
            </button>
          )}
          <button
            onClick={() => setStarted(true)}
            className="block w-full max-w-xs mx-auto px-8 py-4 bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 hover:border-zinc-600 transition-colors"
          >
            {hasSavedResult ? 'Start Fresh' : 'Begin'}
          </button>
          <p className="text-gray-600 text-sm">
            5 prompts · Take as long as you need
          </p>
        </div>
      </div>
    );
  }

  // Summary screen
  if (showSummary) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-2xl text-white">Your Reflection</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Read back through what you wrote. Notice what stands out.
            Notice what surprises you.
          </p>
        </div>

        {/* Responses */}
        <div className="space-y-6">
          {reflectionSteps.map((step) => (
            <div key={step.id} className="bg-zinc-900 border border-zinc-800 p-6">
              <h3 className="font-serif text-lg text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{step.prompt}</p>
              {responses[step.id] ? (
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {responses[step.id]}
                </p>
              ) : (
                <p className="text-gray-600 italic">No response</p>
              )}
            </div>
          ))}
        </div>

        {/* Synthesis Prompt */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 space-y-4">
          <h3 className="font-serif text-lg text-white">A Final Question</h3>
          <p className="text-gray-400 leading-relaxed">
            Looking at everything you wrote — if you had to distill your deepest values
            into 3-5 words or phrases, what would they be?
          </p>
          <p className="text-gray-500 text-sm italic mb-4">
            Examples: Truth. Presence. Creative expression. Deep connection.
            Adventure. Service. Mastery. Love without conditions.
          </p>
          <textarea
            value={coreValues}
            onChange={(e) => setCoreValues(e.target.value)}
            placeholder="Your core values..."
            className="w-full h-24 bg-zinc-900 border border-zinc-800 p-4 text-gray-300 placeholder-gray-600 focus:border-zinc-600 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Save Button */}
        {session?.user && hasContent && (
          <div className="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-800/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-white mb-1">Save Your Reflection</h3>
                <p className="text-gray-400 text-sm">
                  Keep this reflection in your profile to revisit and compare over time.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-3 transition-colors whitespace-nowrap ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : hasSavedResult ? 'Update' : 'Save to Profile'}
              </button>
            </div>
          </div>
        )}

        {!session?.user && hasContent && (
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 text-center">
            <p className="text-gray-400 text-sm mb-3">
              Want to save this reflection to revisit later?
            </p>
            <Link
              href="/login?callbackUrl=/values"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Sign in to save
            </Link>
          </div>
        )}

        {/* Context */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <h3 className="font-serif text-lg text-white mb-3">What Now?</h3>
            <div className="text-gray-400 text-sm leading-relaxed space-y-3">
              <p>
                Values aren't discovered once and held forever. They clarify over time
                through living, through crisis, through what we lose and what we choose.
              </p>
              <p>
                Consider returning to this reflection periodically — especially after
                major life transitions. Notice what stays constant. Notice what shifts.
              </p>
              <p>
                The gap between values and action is where the real work lives.
                Not in knowing what matters, but in living as if it does.
              </p>
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-lg text-white mb-4">Go Deeper</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/posts/finding-meaning-without-religion"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Finding Meaning Without Religion</h4>
              <p className="text-sm text-gray-500">Secular paths to a meaningful life</p>
            </Link>
            <Link
              href="/posts/meditation-without-the-mysticism"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Meditation Without the Mysticism</h4>
              <p className="text-sm text-gray-500">A practical guide to awareness practice</p>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Start Over
          </button>
          <Link
            href="/soul"
            className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-center"
          >
            Explore Soul
          </Link>
        </div>
      </div>
    );
  }

  // Reflection steps
  const step = reflectionSteps[currentStep];
  const currentResponse = responses[step.id] || '';

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {reflectionSteps.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 transition-colors ${
              index < currentStep ? 'bg-white' :
              index === currentStep ? 'bg-gray-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Step */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">
            {currentStep + 1} of {reflectionSteps.length}
          </span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-purple-400 uppercase tracking-wide">
            {step.title}
          </span>
        </div>
        <h2 className="font-serif text-2xl text-white mb-4">{step.prompt}</h2>
        {step.subPrompts && (
          <div className="space-y-1 mb-6">
            {step.subPrompts.map((sub, i) => (
              <p key={i} className="text-sm text-gray-500 italic">{sub}</p>
            ))}
          </div>
        )}
      </div>

      {/* Text Area */}
      <textarea
        value={currentResponse}
        onChange={(e) => handleResponseChange(step.id, e.target.value)}
        placeholder={step.placeholder}
        className="w-full h-48 bg-zinc-900 border border-zinc-800 p-4 text-gray-300 placeholder-gray-600 focus:border-zinc-600 focus:outline-none resize-none leading-relaxed"
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition-colors"
        >
          {currentStep === reflectionSteps.length - 1 ? 'Complete' : 'Continue'}
        </button>
      </div>

      {/* Skip notice */}
      <p className="text-center text-gray-600 text-xs mt-6">
        You can leave any prompt blank if nothing comes — just continue.
      </p>
    </div>
  );
}
