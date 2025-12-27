'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Question, Answer, PillarId, IntegrationPortrait } from '@/lib/assessment';

// Local interfaces for pillar-based assessment flow
interface PillarInfo {
  pillarId: PillarId;
  name: string;
  description: string;
  questionCount: number;
}

interface AssessmentFlowProps {
  existingProgress?: {
    currentPillar: PillarId;
    answers: Record<string, Answer>;
    startedAt: string;
  } | null;
}

const PILLAR_ORDER: PillarId[] = ['mind', 'body', 'soul', 'relationships'];

const PILLAR_NAMES: Record<PillarId, string> = {
  mind: 'Mind',
  body: 'Body',
  soul: 'Soul',
  relationships: 'Relationships',
};

const PILLAR_DESCRIPTIONS: Record<PillarId, string> = {
  mind: 'Explore your psychological patterns, emotional regulation, and cognitive clarity.',
  body: 'Assess your relationship with your physical self, nervous system, and embodiment.',
  soul: 'Examine your sense of meaning, purpose, and connection to something greater.',
  relationships: 'Understand your attachment patterns and capacity for authentic connection.',
};

export default function AssessmentFlow({ existingProgress }: AssessmentFlowProps) {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPillarIndex, setCurrentPillarIndex] = useState(
    existingProgress?.currentPillar
      ? PILLAR_ORDER.indexOf(existingProgress.currentPillar)
      : 0
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pillarQuestionCounts, setPillarQuestionCounts] = useState<Record<PillarId, number>>({
    mind: 0, body: 0, soul: 0, relationships: 0
  });
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    existingProgress?.answers || {}
  );
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
        setPillarQuestionCounts({
          mind: data.pillars?.mind?.count || 0,
          body: data.pillars?.body?.count || 0,
          soul: data.pillars?.soul?.count || 0,
          relationships: data.pillars?.relationships?.count || 0,
        });

        // If we have progress, restore it
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
  const pillarQuestions = questions.filter((q) => q.pillarId === currentPillar);
  const currentQuestion = pillarQuestions[currentQuestionIndex];

  // Auto-save progress periodically
  const saveProgress = useCallback(async () => {
    if (Object.keys(answers).length === 0) return;

    setSaving(true);
    try {
      await fetch('/api/assessment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          currentPillar,
          startedAt,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
    setSaving(false);
  }, [answers, currentPillar, startedAt]);

  // Save on significant changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(answers).length > 0 && Object.keys(answers).length % 5 === 0) {
        saveProgress();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, saveProgress]);

  // Handle answer
  const handleAnswer = (value: number | string | string[]) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        value,
        timestamp: new Date(),
      },
    }));
  };

  // Navigation
  const goNext = () => {
    if (currentQuestionIndex < pillarQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentPillarIndex < PILLAR_ORDER.length - 1) {
      // Move to next pillar
      setCurrentPillarIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setShowPillarIntro(true);
      saveProgress();
    } else {
      // Submit assessment
      submitAssessment();
    }
  };

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentPillarIndex > 0) {
      // Go to previous pillar
      const prevPillar = PILLAR_ORDER[currentPillarIndex - 1];
      const prevPillarQuestions = questions.filter((q) => q.pillarId === prevPillar);
      setCurrentPillarIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevPillarQuestions.length - 1);
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

  // Check if current question is answered
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const canProceed = !currentQuestion?.required || currentAnswer;

  // Calculate progress
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = questions.filter((q) => q.type !== 'open' || q.required).length;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

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

  if (showPillarIntro) {
    const estimatedMinutes = Math.ceil(pillarQuestionCounts[currentPillar] * 0.3); // ~20 sec per question
    return (
      <PillarIntro
        pillarIndex={currentPillarIndex}
        pillarId={currentPillar}
        title={PILLAR_NAMES[currentPillar]}
        description={PILLAR_DESCRIPTIONS[currentPillar]}
        estimatedMinutes={estimatedMinutes || 15}
        onStart={() => setShowPillarIntro(false)}
      />
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>
            {PILLAR_NAMES[currentPillar]} ({currentPillarIndex + 1} of {PILLAR_ORDER.length})
          </span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {saving && (
          <div className="text-xs text-gray-600 mt-1">Saving...</div>
        )}
      </div>

      {/* Question */}
      <div className="flex-1">
        {currentQuestion && (
          <QuestionRenderer
            question={currentQuestion}
            answer={currentAnswer}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-8 border-t border-zinc-800">
        <button
          onClick={goBack}
          disabled={currentPillarIndex === 0 && currentQuestionIndex === 0}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {pillarQuestions.length}
        </div>

        <button
          onClick={goNext}
          disabled={!canProceed || submitting}
          className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Submitting...'
            : currentPillarIndex === PILLAR_ORDER.length - 1 && currentQuestionIndex === pillarQuestions.length - 1
            ? 'Complete Assessment'
            : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PILLAR INTRO
// ============================================================================

function PillarIntro({
  pillarIndex,
  pillarId,
  title,
  description,
  estimatedMinutes,
  onStart,
}: {
  pillarIndex: number;
  pillarId: PillarId;
  title: string;
  description: string;
  estimatedMinutes: number;
  onStart: () => void;
}) {
  const pillarIcons: Record<PillarId, string> = {
    mind: '🧠',
    body: '💪',
    soul: '✨',
    relationships: '💞',
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-sm text-gray-500 mb-4">
        Pillar {pillarIndex + 1} of {PILLAR_ORDER.length}
      </div>

      <div className="text-4xl mb-4">{pillarIcons[pillarId]}</div>

      <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
        {title}
      </h1>

      <p className="text-gray-400 max-w-md mb-8">{description}</p>

      <div className="text-sm text-gray-500 mb-8">
        About {estimatedMinutes} minutes
      </div>

      <button
        onClick={onStart}
        className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
      >
        {pillarIndex === 0 ? 'Begin' : 'Continue'}
      </button>
    </div>
  );
}

// ============================================================================
// QUESTION RENDERER
// ============================================================================

function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: Answer | null;
  onAnswer: (value: number | string | string[]) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Question text */}
      <div>
        <h2 className="text-xl md:text-2xl text-white mb-2">{question.text}</h2>
        {question.subtext && (
          <p className="text-gray-400 text-sm">{question.subtext}</p>
        )}
      </div>

      {/* Answer input based on type */}
      <div className="mt-8">
        {question.type === 'likert' && (
          <LikertInput
            question={question}
            value={answer?.value as number}
            onChange={onAnswer}
          />
        )}
        {question.type === 'agreement' && (
          <AgreementInput
            question={question}
            value={answer?.value as number}
            onChange={onAnswer}
          />
        )}
        {question.type === 'frequency' && (
          <FrequencyInput
            question={question}
            value={answer?.value as string}
            onChange={onAnswer}
          />
        )}
        {question.type === 'intensity' && (
          <IntensityInput
            question={question}
            value={answer?.value as number}
            onChange={onAnswer}
          />
        )}
        {question.type === 'slider' && (
          <SliderInput
            question={question}
            value={answer?.value as number}
            onChange={onAnswer}
          />
        )}
        {question.type === 'multi-select' && (
          <MultiSelectInput
            question={question}
            value={(answer?.value as string[]) || []}
            onChange={onAnswer}
          />
        )}
        {question.type === 'open' && (
          <OpenInput
            question={question}
            value={(answer?.value as string) || ''}
            onChange={onAnswer}
          />
        )}
      </div>

      {!question.required && (
        <p className="text-xs text-gray-600">This question is optional</p>
      )}
    </div>
  );
}

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

function LikertInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'likert' };
  value?: number;
  onChange: (v: number) => void;
}) {
  const scale = question.scale;
  const points = Array.from({ length: scale }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{question.anchors.low}</span>
        {question.anchors.mid && <span>{question.anchors.mid}</span>}
        <span>{question.anchors.high}</span>
      </div>
      <div className="flex gap-2 justify-between">
        {points.map((point) => (
          <button
            key={point}
            onClick={() => onChange(point)}
            className={`flex-1 py-4 border transition-all ${
              value === point
                ? 'border-white bg-white/10 text-white'
                : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
            }`}
          >
            {point}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgreementInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'agreement' };
  value?: number;
  onChange: (v: number) => void;
}) {
  const scale = question.scale;
  const labels =
    scale === 7
      ? ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree']
      : ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  return (
    <div className="space-y-3">
      {labels.map((label, i) => {
        const point = i + 1;
        return (
          <button
            key={point}
            onClick={() => onChange(point)}
            className={`w-full p-4 border text-left transition-all ${
              value === point
                ? 'border-white bg-white/10 text-white'
                : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function FrequencyInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'frequency' };
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`w-full p-4 border text-left transition-all ${
            value === option
              ? 'border-white bg-white/10 text-white'
              : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function IntensityInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'intensity' };
  value?: number;
  onChange: (v: number) => void;
}) {
  const points = Array.from({ length: 11 }, (_, i) => i); // 0-10

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{question.anchors.low}</span>
        <span>{question.anchors.high}</span>
      </div>
      <div className="flex gap-1">
        {points.map((point) => (
          <button
            key={point}
            onClick={() => onChange(point)}
            className={`flex-1 py-3 text-sm border transition-all ${
              value === point
                ? 'border-white bg-white/10 text-white'
                : 'border-zinc-700 text-gray-500 hover:border-zinc-500'
            }`}
          >
            {point}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'slider' };
  value?: number;
  onChange: (v: number) => void;
}) {
  const currentValue = value ?? 50;

  return (
    <div className="space-y-6">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{question.anchors.low}</span>
        {question.anchors.mid && <span>{question.anchors.mid}</span>}
        <span>{question.anchors.high}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step || 1}
          value={currentValue}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="text-center mt-4">
          <span className="text-2xl text-white">{currentValue}</span>
        </div>
      </div>
    </div>
  );
}

function MultiSelectInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'multi-select' };
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const maxSelections = question.maxSelections || question.options.length;

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else if (value.length < maxSelections) {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 mb-2">
        Select up to {maxSelections} ({value.length} selected)
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            disabled={!value.includes(option.value) && value.length >= maxSelections}
            className={`p-3 border text-sm text-left transition-all ${
              value.includes(option.value)
                ? 'border-white bg-white/10 text-white'
                : 'border-zinc-700 text-gray-400 hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpenInput({
  question,
  value,
  onChange,
}: {
  question: Question & { type: 'open' };
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'Share your thoughts...'}
        maxLength={question.maxLength || 2000}
        rows={5}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-zinc-500 focus:outline-none resize-none"
      />
      <div className="text-xs text-gray-600 text-right">
        {value.length} / {question.maxLength || 2000}
      </div>
    </div>
  );
}

// ============================================================================
// RESULTS
// ============================================================================

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

      {/* Stage */}
      <div
        className="p-8 border rounded-lg"
        style={{ borderColor: portrait.stageColor + '50', backgroundColor: portrait.stageColor + '10' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl text-white">{portrait.integrationStageName}</h2>
          <span className="text-3xl font-light text-white">{portrait.integrationScore}</span>
        </div>
        <p className="text-gray-300">{portrait.stageDescription}</p>
      </div>

      {/* Pillars */}
      <div className="space-y-4">
        <h3 className="text-lg text-white">The Four Pillars</h3>
        <div className="grid grid-cols-2 gap-4">
          {portrait.pillarSummaries.map((pillar) => (
            <div
              key={pillar.pillarId}
              className="p-4 border border-zinc-700 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{pillar.icon}</span>
                <span className="text-white font-medium">{pillar.pillarName}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{pillar.stageName}</span>
                <span className="text-white">{pillar.score}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{pillar.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative */}
      <div className="prose prose-invert prose-sm max-w-none">
        <h3>Your Story</h3>
        {portrait.narrative.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 border border-green-500/30 bg-green-500/5 rounded-lg">
          <h4 className="text-sm text-green-400 uppercase tracking-wide mb-3">
            Greatest Strength
          </h4>
          <h3 className="text-lg text-white mb-2">{portrait.strongestPillar.name}</h3>
          <p className="text-gray-300 text-sm">{portrait.strongestPillar.insight}</p>
        </div>

        <div className="p-6 border border-amber-500/30 bg-amber-500/5 rounded-lg">
          <h4 className="text-sm text-amber-400 uppercase tracking-wide mb-3">
            Primary Focus
          </h4>
          <h3 className="text-lg text-white mb-2">{portrait.priorityPillar.name}</h3>
          <p className="text-gray-300 text-sm">{portrait.priorityPillar.recommendation}</p>
        </div>
      </div>

      {/* Balance */}
      <div className="p-4 border border-zinc-700 rounded-lg">
        <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-2">Balance</h4>
        <p className="text-gray-300">{portrait.balance.description}</p>
      </div>

      {/* Safety Note */}
      {portrait.safetyNote && (
        <div
          className={`p-4 border rounded-lg ${
            portrait.safetyNote.severity === 'urgent'
              ? 'border-red-500/50 bg-red-500/10'
              : portrait.safetyNote.severity === 'moderate'
              ? 'border-orange-500/50 bg-orange-500/10'
              : 'border-zinc-700 bg-zinc-800/50'
          }`}
        >
          <p className="text-gray-300 text-sm">{portrait.safetyNote.message}</p>
          {portrait.safetyNote.resources && (
            <ul className="mt-2 text-sm text-gray-400">
              {portrait.safetyNote.resources.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recommendations */}
      {portrait.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-white">Recommended Next Steps</h3>
          <div className="space-y-3">
            {portrait.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`p-4 border rounded-lg ${
                  rec.priority === 'primary'
                    ? 'border-white/30'
                    : 'border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase text-gray-500">{rec.type}</span>
                  {rec.priority === 'primary' && (
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <h4 className="text-white font-medium">{rec.title}</h4>
                <p className="text-gray-400 text-sm">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="text-center pt-8">
        <button
          onClick={() => router.push('/profile')}
          className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
        >
          Go to Your Profile
        </button>
        <p className="text-gray-500 text-sm mt-4">
          Your results have been saved and will inform your personalized experience.
        </p>
      </div>
    </div>
  );
}
