'use client';

import { useState, useEffect } from 'react';
import { Lock, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface GateStatus {
  hasGate: boolean;
  canProceed: boolean;
  gateRequired: boolean;
  gatePassed: boolean;
  gate?: {
    id: string;
    type: 'journal' | 'pattern-map' | 'skill-demo' | 'simulation';
    minimumScore: number;
    allowRetry: boolean;
    retryDelay?: number;
  };
  lastAttempt?: {
    score: number;
    passed: boolean;
    attemptedAt: string;
    verification: {
      feedback: string;
      strengths: string[];
      growthEdges: string[];
    };
  };
  nextRetryAt?: string;
}

interface VerificationResult {
  passed: boolean;
  verification: {
    overall: number;
    result: 'pass' | 'needs-depth' | 'try-again';
    feedback: string;
    specificFeedback: string[];
    strengths: string[];
    growthEdges: string[];
    promptsForDeeper?: string[];
  };
  feedback: string;
}

interface Props {
  courseSlug: string;
  moduleSlug: string;
  prompt: string;
  children: React.ReactNode;
}

export default function VerificationGate({ courseSlug, moduleSlug, prompt, children }: Props) {
  const [status, setStatus] = useState<GateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    checkGateStatus();
  }, [courseSlug, moduleSlug]);

  async function checkGateStatus() {
    try {
      const res = await fetch(`/api/verification/gate?course=${courseSlug}&module=${moduleSlug}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check gate status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitGate() {
    if (!status?.gate || !response.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/verification/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateId: status.gate.id,
          content: response,
          prompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.passed) {
          // Refresh status after passing
          await checkGateStatus();
        }
      }
    } catch (error) {
      console.error('Gate submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-zinc-800/50 rounded-lg p-6">
        <div className="h-4 bg-zinc-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
      </div>
    );
  }

  // No gate required or already passed
  if (!status?.hasGate || status.canProceed) {
    return <>{children}</>;
  }

  // Check if in retry cooldown
  const inCooldown = status.nextRetryAt && new Date(status.nextRetryAt) > new Date();
  const cooldownEnd = status.nextRetryAt ? new Date(status.nextRetryAt) : null;

  return (
    <div className="space-y-6">
      {/* Gate Header */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-600/20 rounded-lg">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-200 mb-2">
              Practice Gate
            </h3>
            <p className="text-zinc-300 text-sm">
              This module requires you to demonstrate your understanding before proceeding.
              {status.gate?.type === 'journal' && ' Complete the reflection below with genuine depth and specificity.'}
              {status.gate?.type === 'skill-demo' && ' Respond to the scenario demonstrating the skills you\'ve learned.'}
              {status.gate?.type === 'pattern-map' && ' Map out your patterns with specific examples from your life.'}
            </p>
            <p className="text-zinc-400 text-xs mt-2">
              Minimum score: {status.gate?.minimumScore}% |
              {status.gate?.allowRetry ? ` Retry allowed after ${status.gate.retryDelay}h` : ' No retry'}
            </p>
          </div>
        </div>
      </div>

      {/* Previous Attempt Feedback */}
      {status.lastAttempt && !status.lastAttempt.passed && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-zinc-200">
                Previous attempt: {status.lastAttempt.score}%
                <span className="text-zinc-400 ml-2">
                  ({new Date(status.lastAttempt.attemptedAt).toLocaleDateString()})
                </span>
              </span>
            </div>
            {showFeedback ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </button>

          {showFeedback && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-zinc-300 text-sm">
                {status.lastAttempt.verification.feedback}
              </p>

              {status.lastAttempt.verification.strengths.length > 0 && (
                <div>
                  <p className="text-green-400 text-xs font-medium mb-1">Strengths:</p>
                  <ul className="text-zinc-400 text-sm list-disc list-inside">
                    {status.lastAttempt.verification.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {status.lastAttempt.verification.growthEdges.length > 0 && (
                <div>
                  <p className="text-amber-400 text-xs font-medium mb-1">Areas to deepen:</p>
                  <ul className="text-zinc-400 text-sm list-disc list-inside">
                    {status.lastAttempt.verification.growthEdges.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cooldown Notice */}
      {inCooldown && cooldownEnd && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <p className="text-blue-200 text-sm">
            You can try again at {cooldownEnd.toLocaleTimeString()} on {cooldownEnd.toLocaleDateString()}.
            Use this time to reflect on the feedback.
          </p>
        </div>
      )}

      {/* Submission Form */}
      {!inCooldown && (
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-6">
          <label className="block mb-4">
            <span className="text-zinc-200 font-medium">{prompt}</span>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response here... Be specific and personal. Include examples from your own life."
              className="mt-3 w-full h-64 bg-zinc-900/50 border border-zinc-600 rounded-lg p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              disabled={submitting}
            />
          </label>

          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">
              {response.length} characters
              {response.length < 200 && response.length > 0 && (
                <span className="text-amber-400 ml-2">
                  (aim for at least 200 for a thorough response)
                </span>
              )}
            </p>

            <button
              onClick={submitGate}
              disabled={submitting || response.length < 50}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Evaluating...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`border rounded-lg p-6 ${
          result.passed
            ? 'bg-green-900/20 border-green-700/50'
            : result.verification.result === 'needs-depth'
              ? 'bg-amber-900/20 border-amber-700/50'
              : 'bg-red-900/20 border-red-700/50'
        }`}>
          <div className="flex items-start gap-4">
            {result.passed ? (
              <CheckCircle className="w-6 h-6 text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                result.passed ? 'text-green-200' : 'text-amber-200'
              }`}>
                {result.passed
                  ? 'Gate Passed!'
                  : result.verification.result === 'needs-depth'
                    ? 'Almost There - Needs More Depth'
                    : 'Not Quite - Try Again'}
              </h4>
              <p className="text-zinc-300 text-sm mb-3">
                Score: {result.verification.overall}% | {result.feedback}
              </p>

              {result.verification.specificFeedback.length > 0 && (
                <div className="mb-3">
                  <p className="text-zinc-400 text-xs font-medium mb-1">Specific observations:</p>
                  <ul className="text-zinc-400 text-sm list-disc list-inside">
                    {result.verification.specificFeedback.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!result.passed && result.verification.promptsForDeeper && result.verification.promptsForDeeper.length > 0 && (
                <div className="mt-3 p-3 bg-zinc-800/50 rounded">
                  <p className="text-zinc-300 text-xs font-medium mb-1">Questions to go deeper:</p>
                  <ul className="text-zinc-400 text-sm list-disc list-inside">
                    {result.verification.promptsForDeeper.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Content Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/80 to-zinc-900 z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">
              Complete the practice above to unlock this content
            </p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none max-h-64 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
