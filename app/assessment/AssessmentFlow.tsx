'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Question, Answer, PillarId, IntegrationPortrait } from '@/lib/assessment';

interface AssessmentFlowProps {
  existingProgress?: {
    currentPillar: PillarId;
    answers: Record<string, Answer>;
    startedAt: string;
  } | null;
}

const PILLAR_ORDER: PillarId[] = ['mind', 'body', 'soul', 'relationships'];

const PILLAR_INFO: Record<PillarId, { name: string; icon: string; description: string }> = {
  mind: { name: 'Mind', icon: '🧠', description: 'Psychology, emotions, thought patterns' },
  body: { name: 'Body', icon: '💪', description: 'Physical health, nervous system, embodiment' },
  soul: { name: 'Soul', icon: '✨', description: 'Meaning, purpose, spiritual connection' },
  relationships: { name: 'Relationships', icon: '💞', description: 'Attachment, intimacy, connection' },
};

// How many questions to show per page
const QUESTIONS_PER_PAGE = 5;

export default function AssessmentFlow({ existingProgress }: AssessmentFlowProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPillarIndex, setCurrentPillarIndex] = useState(
    existingProgress?.currentPillar ? PILLAR_ORDER.indexOf(existingProgress.currentPillar) : 0
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>(existingProgress?.answers || {});
  const [startedAt] = useState(existingProgress?.startedAt || new Date().toISOString());
  const [result, setResult] = useState<IntegrationPortrait | null>(null);
  const [showPillarIntro, setShowPillarIntro] = useState(true);

  const currentPillar = PILLAR_ORDER[currentPillarIndex];

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await fetch('/api/assessment?includeProgress=true');
        const data = await response.json();
        setQuestions(data.questions);

        if (data.progress) {
          const pillarIndex = PILLAR_ORDER.indexOf(data.progress.currentPillar);
          if (pillarIndex >= 0) setCurrentPillarIndex(pillarIndex);
          setAnswers(data.progress.answers);
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // Get current pillar questions
  const pillarQuestions = questions.filter((q) => q.pillar === currentPillar);
  const totalPages = Math.ceil(pillarQuestions.length / QUESTIONS_PER_PAGE);
  const pageQuestions = pillarQuestions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  // Save progress
  const saveProgress = useCallback(async () => {
    if (Object.keys(answers).length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/assessment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, currentPillar, startedAt }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
    setSaving(false);
  }, [answers, currentPillar, startedAt]);

  // Auto-save periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(answers).length > 0 && Object.keys(answers).length % 10 === 0) {
        saveProgress();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, saveProgress]);

  // Handle answer
  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, value, timestamp: new Date() },
    }));
  };

  // Check if all questions on current page are answered
  const pageAnswered = pageQuestions.every((q) => answers[q.id]);

  // State for pillar completion dialog
  const [showPillarComplete, setShowPillarComplete] = useState(false);

  // Navigation
  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentPillarIndex < PILLAR_ORDER.length - 1) {
      // Show pillar complete dialog before moving to next pillar
      setShowPillarComplete(true);
    } else {
      submitAssessment();
    }
  };

  // Continue to next pillar after completing one
  const continueToNextPillar = () => {
    setCurrentPillarIndex((prev) => prev + 1);
    setCurrentPage(0);
    setShowPillarIntro(true);
    setShowPillarComplete(false);
    saveProgress();
  };

  // Submit partial assessment (completed pillars only)
  const submitPartialAssessment = async () => {
    setSubmitting(true);
    try {
      // Save progress first
      await saveProgress();
      // Then submit what we have
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, startedAt, partial: true }),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const data = await response.json();
      if (data.portrait) {
        setResult(data.portrait);
      } else {
        // If no portrait returned, redirect to profile
        router.push('/profile');
      }
    } catch (error) {
      console.error('Failed to submit partial assessment:', error);
      router.push('/profile');
    }
    setSubmitting(false);
  };

  const goBack = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentPillarIndex > 0) {
      const prevPillar = PILLAR_ORDER[currentPillarIndex - 1];
      const prevPillarQuestions = questions.filter((q) => q.pillar === prevPillar);
      const prevTotalPages = Math.ceil(prevPillarQuestions.length / QUESTIONS_PER_PAGE);
      setCurrentPillarIndex((prev) => prev - 1);
      setCurrentPage(prevTotalPages - 1);
    }
  };

  // Submit
  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, startedAt }),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const data = await response.json();
      setResult(data.portrait);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    }
    setSubmitting(false);
  };

  // Calculate progress
  const totalAnswered = Object.keys(answers).length;
  const totalRequired = questions.filter((q) => q.required !== false).length;
  const progressPercent = Math.round((totalAnswered / totalRequired) * 100) || 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading assessment...</div>
      </div>
    );
  }

  if (result) {
    return <AssessmentResults portrait={result} />;
  }

  // Pillar completion dialog - shown after completing a pillar (not the last one)
  if (showPillarComplete) {
    const completedPillar = PILLAR_INFO[currentPillar];
    const nextPillar = PILLAR_INFO[PILLAR_ORDER[currentPillarIndex + 1]];
    const completedPillars = currentPillarIndex + 1;
    const remainingPillars = PILLAR_ORDER.length - completedPillars;
    const nextPillarQuestions = questions.filter((q) => q.pillar === PILLAR_ORDER[currentPillarIndex + 1]);
    const estimatedMinutes = Math.ceil(nextPillarQuestions.length * 0.25);

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">{completedPillar.icon}</div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
          {completedPillar.name} Complete
        </h1>
        <p className="text-gray-400 mb-8">
          You&apos;ve finished the {completedPillar.name.toLowerCase()} section.
          {remainingPillars > 0 && ` ${remainingPillars} section${remainingPillars > 1 ? 's' : ''} remaining.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={continueToNextPillar}
            className="flex-1 px-6 py-4 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
          >
            <span className="block text-lg">{nextPillar.icon} Continue</span>
            <span className="block text-xs opacity-70 mt-1">
              {nextPillar.name} · ~{estimatedMinutes} min
            </span>
          </button>

          <button
            onClick={submitPartialAssessment}
            disabled={submitting}
            className="flex-1 px-6 py-4 border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <span className="block text-lg">Save Progress</span>
            <span className="block text-xs opacity-70 mt-1">
              {submitting ? 'Saving...' : 'Continue later'}
            </span>
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-6 max-w-sm">
          Your {completedPillars === 1 ? 'answers are' : `${completedPillars} completed sections are`} saved.
          You can return anytime to finish.
        </p>
      </div>
    );
  }

  if (showPillarIntro) {
    const pillar = PILLAR_INFO[currentPillar];
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-sm text-gray-500 mb-4">
          Section {currentPillarIndex + 1} of {PILLAR_ORDER.length}
        </div>
        <div className="text-5xl mb-4">{pillar.icon}</div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
          {pillar.name}
        </h1>
        <p className="text-gray-400 max-w-md mb-8">{pillar.description}</p>
        <p className="text-sm text-gray-500 mb-8">
          {pillarQuestions.length} questions · About {Math.ceil(pillarQuestions.length * 0.15)} minutes
        </p>
        <button
          onClick={() => setShowPillarIntro(false)}
          className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
        >
          {currentPillarIndex === 0 ? 'Start' : 'Continue'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Header with progress */}
      <div className="mb-8 sticky top-0 bg-zinc-950 py-4 -mx-6 px-6 z-10 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{PILLAR_INFO[currentPillar].icon}</span>
            <span className="text-white font-medium">{PILLAR_INFO[currentPillar].name}</span>
          </div>
          <div className="text-sm text-gray-500">
            {progressPercent}% complete
          </div>
        </div>

        {/* Pillar progress dots */}
        <div className="flex gap-2 mb-3">
          {PILLAR_ORDER.map((p, i) => (
            <div
              key={p}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < currentPillarIndex
                  ? 'bg-white'
                  : i === currentPillarIndex
                  ? 'bg-white/50'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Page indicator */}
        <div className="text-xs text-gray-600">
          Page {currentPage + 1} of {totalPages}
          {saving && <span className="ml-2">· Saving...</span>}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 space-y-6">
        {pageQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]?.value as number}
            onChange={(value) => handleAnswer(question.id, value)}
            number={(currentPage * QUESTIONS_PER_PAGE) + index + 1}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-8 border-t border-zinc-800">
        <button
          onClick={goBack}
          disabled={currentPillarIndex === 0 && currentPage === 0}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          {/* Save & Exit - always available after answering at least one question */}
          {Object.keys(answers).length > 0 && (
            <button
              onClick={async () => {
                await saveProgress();
                router.push('/profile');
              }}
              className="px-4 py-3 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Save & Exit
            </button>
          )}

          <button
            onClick={goNext}
            disabled={!pageAnswered || submitting}
            className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Submitting...'
              : currentPillarIndex === PILLAR_ORDER.length - 1 && currentPage === totalPages - 1
              ? 'Complete'
              : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// QUESTION CARD - Simple 1-10 scale
// =============================================================================

function QuestionCard({
  question,
  value,
  onChange,
  number,
}: {
  question: Question;
  value?: number;
  onChange: (value: number) => void;
  number: number;
}) {
  return (
    <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex items-start gap-4">
        <span className="text-gray-600 text-sm font-medium w-6 pt-0.5">{number}</span>
        <div className="flex-1">
          <p className="text-white mb-4 leading-relaxed">{question.text}</p>

          {/* 1-10 Scale */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>Not at all</span>
              <span>Completely</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => onChange(n)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded transition-all ${
                    value === n
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RESULTS
// =============================================================================

function AssessmentResults({ portrait }: { portrait: IntegrationPortrait }) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Headline */}
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl md:text-4xl font-light text-white">
          Your Integration Portrait
        </h1>
        <p className="text-gray-400">{portrait.headline}</p>
      </div>

      {/* Overall Score */}
      <div
        className="p-8 border rounded-lg text-center"
        style={{ borderColor: portrait.stageColor + '50', backgroundColor: portrait.stageColor + '10' }}
      >
        <div className="text-5xl font-light text-white mb-2">{portrait.integrationScore}</div>
        <div className="text-xl text-white mb-2">{portrait.integrationStageName}</div>
        <p className="text-gray-300 text-sm">{portrait.stageDescription}</p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-2 gap-4">
        {portrait.pillarSummaries.map((pillar) => (
          <div key={pillar.pillarId} className="p-4 border border-zinc-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{pillar.icon}</span>
              <span className="text-white font-medium">{pillar.pillarName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{pillar.stageName}</span>
              <span className="text-white text-lg">{pillar.score}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${pillar.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Focus */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 border border-green-500/30 bg-green-500/5 rounded-lg">
          <h4 className="text-sm text-green-400 uppercase tracking-wide mb-2">Strength</h4>
          <h3 className="text-lg text-white mb-2">{portrait.strongestPillar.name}</h3>
          <p className="text-gray-300 text-sm">{portrait.strongestPillar.insight}</p>
        </div>
        <div className="p-6 border border-amber-500/30 bg-amber-500/5 rounded-lg">
          <h4 className="text-sm text-amber-400 uppercase tracking-wide mb-2">Focus Area</h4>
          <h3 className="text-lg text-white mb-2">{portrait.priorityPillar.name}</h3>
          <p className="text-gray-300 text-sm">{portrait.priorityPillar.recommendation}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-8 space-y-4">
        <button
          onClick={() => router.push('/profile/health')}
          className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
        >
          View Full Results
        </button>
        <p className="text-gray-500 text-sm">
          Your detailed health portrait with recommendations is ready.
        </p>
      </div>
    </div>
  );
}
