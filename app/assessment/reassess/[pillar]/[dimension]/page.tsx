'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Question, Answer } from '@/lib/assessment/types';

interface ReassessmentData {
  pillarId: string;
  dimensionId: string;
  dimensionName: string;
  questions: Question[];
  estimatedMinutes: number;
  previousScore?: number;
  previousStage?: string;
  previousVerifiedAt?: string;
  estimatedScore?: number;
  estimatedStage?: string;
}

interface ReassessmentResult {
  success: boolean;
  result: {
    pillarId: string;
    dimensionId: string;
    dimensionName: string;
    newScore: number;
    newStage: string;
    previousScore?: number;
    previousStage?: string;
    scoreChange?: number;
    facetScores: Array<{
      facetId: string;
      facetName: string;
      score: number;
    }>;
  };
  comparison: {
    interpretation: string;
    estimatedAccuracy?: number;
  };
}

export default function ReassessmentPage() {
  const router = useRouter();
  const params = useParams();
  const pillarId = params.pillar as string;
  const dimensionId = params.dimension as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<ReassessmentData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<ReassessmentResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await fetch(
          `/api/assessment/reassess?pillar=${pillarId}&dimension=${dimensionId}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load questions');
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [pillarId, dimensionId]);

  // Handle answer
  const handleAnswer = (value: number | string | string[]) => {
    if (!data) return;
    const currentQuestion = data.questions[currentQuestionIndex];

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
    if (!data) return;

    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      submitReassessment();
    }
  };

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Submit
  const submitReassessment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/assessment/reassess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillarId,
          dimensionId,
          answers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    }
    setSubmitting(false);
  };

  // Check if current question is answered
  const currentQuestion = data?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const canProceed = !currentQuestion?.required || currentAnswer;

  // Progress
  const progressPercent = data
    ? Math.round(((currentQuestionIndex + 1) / data.questions.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl text-red-400 mb-4">Error</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <button
          onClick={() => router.push('/profile/health')}
          className="px-6 py-3 border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
        >
          Return to Health Dashboard
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Assessment not found</p>
      </div>
    );
  }

  if (result) {
    return <ReassessmentResults result={result} />;
  }

  if (showIntro) {
    return (
      <ReassessmentIntro
        data={data}
        onStart={() => setShowIntro(false)}
        onCancel={() => router.back()}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm text-gray-500 mb-2">
          Reassessing: {data.dimensionName}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {data.questions.length}
          </span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="min-h-[40vh]">
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
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          onClick={goNext}
          disabled={!canProceed || submitting}
          className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Submitting...'
            : currentQuestionIndex === data.questions.length - 1
            ? 'Complete'
            : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// INTRO
// =============================================================================

function ReassessmentIntro({
  data,
  onStart,
  onCancel,
}: {
  data: ReassessmentData;
  onStart: () => void;
  onCancel: () => void;
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center space-y-6">
        <h1 className="font-serif text-3xl md:text-4xl font-light text-white">
          Reassess: {data.dimensionName}
        </h1>

        <p className="text-gray-400">
          This quick assessment will verify your current level in this dimension.
        </p>

        {/* Previous Scores */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          {data.previousScore !== undefined && (
            <div className="p-4 border border-zinc-700 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Last Verified</div>
              <div className="text-2xl text-white">{data.previousScore}</div>
              <div className="text-sm text-gray-400">{data.previousStage}</div>
              <div className="text-xs text-gray-600 mt-1">
                {formatDate(data.previousVerifiedAt)}
              </div>
            </div>
          )}

          {data.estimatedScore !== undefined && (
            <div className="p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
              <div className="text-xs text-amber-400 mb-1">Estimated</div>
              <div className="text-2xl text-white">{data.estimatedScore}</div>
              <div className="text-sm text-gray-400">{data.estimatedStage}</div>
              <div className="text-xs text-gray-600 mt-1">Based on activity</div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 mt-8">
          {data.questions.length} questions | About {data.estimatedMinutes} minutes
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={onStart}
            className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
          >
            Begin Reassessment
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RESULTS
// =============================================================================

function ReassessmentResults({ result }: { result: ReassessmentResult }) {
  const router = useRouter();
  const { result: r, comparison } = result;

  const scoreChange = r.scoreChange ?? 0;
  const changeColor =
    scoreChange > 0 ? 'text-green-400' : scoreChange < 0 ? 'text-amber-400' : 'text-gray-400';
  const changeSign = scoreChange > 0 ? '+' : '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl font-light text-white">
          Reassessment Complete
        </h1>
        <p className="text-gray-400">{r.dimensionName}</p>
      </div>

      {/* Score Comparison */}
      <div className="p-8 border border-zinc-700 rounded-lg text-center">
        <div className="grid grid-cols-3 gap-4 items-end">
          {r.previousScore !== undefined && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Previous</div>
              <div className="text-2xl text-gray-400">{r.previousScore}</div>
              <div className="text-sm text-gray-500">{r.previousStage}</div>
            </div>
          )}

          <div className="pb-2">
            {scoreChange !== 0 && (
              <div className={`text-lg font-medium ${changeColor}`}>
                {changeSign}
                {scoreChange}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="text-3xl text-white">{r.newScore}</div>
            <div className="text-sm text-white">{r.newStage}</div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="p-6 border border-zinc-700 rounded-lg">
        <p className="text-gray-300">{comparison.interpretation}</p>

        {comparison.estimatedAccuracy !== undefined && (
          <div className="mt-4 text-sm text-gray-500">
            Estimate accuracy: {comparison.estimatedAccuracy}%
          </div>
        )}
      </div>

      {/* Facet Breakdown */}
      {r.facetScores.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-white">Facet Breakdown</h3>
          <div className="space-y-3">
            {r.facetScores.map((facet) => (
              <div key={facet.facetId} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{facet.facetName}</span>
                    <span className="text-white">{facet.score}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${facet.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="text-center pt-8 space-y-4">
        <button
          onClick={() => router.push('/profile/health')}
          className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
        >
          View Full Health Dashboard
        </button>
        <p className="text-gray-500 text-sm">
          Your verified score has been updated.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// QUESTION RENDERER (simplified version)
// =============================================================================

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
      <div>
        <h2 className="text-xl md:text-2xl text-white mb-2">{question.text}</h2>
        {question.subtext && (
          <p className="text-gray-400 text-sm">{question.subtext}</p>
        )}
      </div>

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
      </div>

      {!question.required && (
        <p className="text-xs text-gray-600">This question is optional</p>
      )}
    </div>
  );
}

// Simplified input components
function LikertInput({
  question,
  value,
  onChange,
}: {
  question: any;
  value?: number;
  onChange: (v: number) => void;
}) {
  const scale = question.scale || 5;
  const points = Array.from({ length: scale }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{question.anchors?.low || 'Low'}</span>
        <span>{question.anchors?.high || 'High'}</span>
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
  question: any;
  value?: number;
  onChange: (v: number) => void;
}) {
  const scale = question.scale || 5;
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
  question: any;
  value?: string;
  onChange: (v: string) => void;
}) {
  const options = question.options || ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

  return (
    <div className="space-y-3">
      {options.map((option: string) => (
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
  question: any;
  value?: number;
  onChange: (v: number) => void;
}) {
  const points = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{question.anchors?.low || 'None'}</span>
        <span>{question.anchors?.high || 'Extreme'}</span>
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
