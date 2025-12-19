'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuizClientProps {
  courseSlug: string;
  courseName: string;
  quiz: {
    passingScore: number;
    questions: QuizQuestion[];
  };
  totalModules: number;
}

interface QuizStatus {
  hasPassed: boolean;
  bestScore: number | null;
  attemptCount: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  results: { questionId: number; correct: boolean; userAnswer: number; correctAnswer: number }[];
}

export default function QuizClient({ courseSlug, courseName, quiz, totalModules }: QuizClientProps) {
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completedModules, setCompletedModules] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch quiz status
        const statusRes = await fetch(`/api/quiz?courseSlug=${courseSlug}`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setStatus(data);
        }

        // Fetch course progress
        const progressRes = await fetch('/api/course-progress');
        if (progressRes.ok) {
          const progress = await progressRes.json();
          const completed = progress.filter(
            (p: { courseSlug: string; completed: boolean }) =>
              p.courseSlug === courseSlug && p.completed
          ).length;
          setCompletedModules(completed);
        }
      } catch (error) {
        console.error('Failed to fetch quiz data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [courseSlug]);

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    // Check all questions answered
    const unanswered = quiz.questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, answers }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setShowQuiz(false);

        // Update status
        setStatus(prev => ({
          hasPassed: prev?.hasPassed || data.passed,
          bestScore: Math.max(prev?.bestScore || 0, data.score),
          attemptCount: (prev?.attemptCount || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setShowQuiz(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  // Check if all modules completed
  const allModulesCompleted = completedModules >= totalModules;

  if (!allModulesCompleted && !status?.hasPassed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8">
        <h2 className="text-xl text-white mb-4">Complete All Modules First</h2>
        <p className="text-gray-400 mb-4">
          You need to complete all {totalModules} modules before taking the quiz.
        </p>
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="text-gray-400">{completedModules}/{totalModules} modules</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(completedModules / totalModules) * 100}%` }}
            />
          </div>
        </div>
        <Link
          href={`/courses/${courseSlug}`}
          className="text-white hover:text-gray-300 transition-colors"
        >
          Continue learning &rarr;
        </Link>
      </div>
    );
  }

  // Show result
  if (result && !showQuiz) {
    return (
      <div className="space-y-6">
        <div className={`p-8 border ${result.passed ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
          <div className="text-center">
            <div className={`text-6xl font-serif mb-4 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
              {result.score}%
            </div>
            <h2 className={`text-2xl font-serif mb-2 ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
              {result.passed ? 'Congratulations!' : 'Not Quite'}
            </h2>
            <p className="text-gray-400 mb-4">
              You got {result.correctCount} out of {result.totalQuestions} questions correct.
              {!result.passed && ` You need ${result.passingScore}% to pass.`}
            </p>

            {result.passed ? (
              <Link
                href="/profile"
                className="inline-block px-6 py-3 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Claim Your Certificate
              </Link>
            ) : (
              <button
                onClick={resetQuiz}
                className="px-6 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* Show which answers were wrong */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-white font-medium mb-4">Review Your Answers</h3>
          <div className="space-y-4">
            {result.results.map((r, idx) => {
              const question = quiz.questions.find(q => q.id === r.questionId);
              return (
                <div key={r.questionId} className={`p-4 border ${r.correct ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-sm ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                      {r.correct ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="text-gray-300 text-sm mb-1">Q{idx + 1}: {question?.question}</p>
                      {!r.correct && (
                        <p className="text-gray-500 text-xs">
                          Correct answer: {question?.options[r.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show status if already passed
  if (status?.hasPassed && !showQuiz) {
    return (
      <div className="bg-green-900/20 border border-green-800 p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-serif text-green-300 mb-2">Quiz Passed!</h2>
        <p className="text-gray-400 mb-2">Best score: {status.bestScore}%</p>
        <p className="text-gray-500 text-sm mb-6">Attempts: {status.attemptCount}</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/profile"
            className="px-6 py-3 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            View Certificate
          </Link>
          <button
            onClick={() => setShowQuiz(true)}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // Show quiz start if not started
  if (!showQuiz) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8">
        <h2 className="text-xl text-white mb-4">Ready to Test Your Knowledge?</h2>
        <ul className="text-gray-400 space-y-2 mb-6">
          <li>• {quiz.questions.length} multiple choice questions</li>
          <li>• Pass with {quiz.passingScore}% or higher</li>
          <li>• Unlimited attempts allowed</li>
          {status && status.attemptCount > 0 && (
            <li>• Your best score: {status.bestScore}%</li>
          )}
        </ul>
        <button
          onClick={() => setShowQuiz(true)}
          className="px-6 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
        >
          {status && status.attemptCount > 0 ? 'Retake Quiz' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  // Show quiz questions
  return (
    <div className="space-y-8">
      {quiz.questions.map((question, idx) => (
        <div key={question.id} className="bg-zinc-900 border border-zinc-800 p-6">
          <p className="text-gray-500 text-sm mb-2">Question {idx + 1} of {quiz.questions.length}</p>
          <h3 className="text-white text-lg mb-4">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, optIdx) => (
              <label
                key={optIdx}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  answers[question.id] === optIdx
                    ? 'border-white bg-zinc-800'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[question.id] === optIdx}
                  onChange={() => handleAnswerChange(question.id, optIdx)}
                  className="sr-only"
                />
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  answers[question.id] === optIdx ? 'border-white' : 'border-zinc-600'
                }`}>
                  {answers[question.id] === optIdx && (
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answers'}
        </button>
        <button
          onClick={() => setShowQuiz(false)}
          className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-gray-500 text-sm">
        {Object.keys(answers).length}/{quiz.questions.length} questions answered
      </p>
    </div>
  );
}
