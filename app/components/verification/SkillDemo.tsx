'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, AlertCircle, Info, Star } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dimensions: string[];
  context?: string;
}

interface RubricScore {
  score: number;
  feedback: string;
}

interface EvaluationResult {
  scenario: Scenario;
  userResponse: string;
  rubricScores: Record<string, RubricScore>;
  overall: number;
  level: string;
  result: 'pass' | 'needs-depth' | 'try-again';
  feedback: string;
  specificFeedback: string[];
  strengths: string[];
  growthEdges: string[];
  modelResponse?: string;
}

interface Props {
  scenarioId?: string;
  category?: string;
  onComplete?: (result: EvaluationResult) => void;
}

export default function SkillDemo({ scenarioId, category, onComplete }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showModel, setShowModel] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, [category]);

  async function loadScenarios() {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);

      const res = await fetch(`/api/verification/skill-demo?${params}`);
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.scenarios);

        // If specific scenario requested, select it
        if (scenarioId) {
          const found = data.scenarios.find((s: Scenario) => s.id === scenarioId);
          if (found) setSelectedScenario(found);
        }
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitResponse() {
    if (!selectedScenario || !response.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/verification/skill-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          response,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        onComplete?.(data);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelectedScenario(null);
    setResponse('');
    setResult(null);
    setShowModel(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-32 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  // Scenario selection
  if (!selectedScenario) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">
            Skill Demonstrations
          </h3>
          <p className="text-zinc-400 text-sm">
            Practice your skills by responding to real-world scenarios.
            You'll receive detailed feedback on your response.
          </p>
        </div>

        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className="text-left p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-zinc-100 group-hover:text-white">
                      {scenario.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      scenario.difficulty === 'beginner'
                        ? 'bg-green-900/50 text-green-300'
                        : scenario.difficulty === 'intermediate'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-red-900/50 text-red-300'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {scenario.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {scenario.dimensions.slice(0, 3).map((dim) => (
                      <span key={dim} className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-0.5 rounded">
                        {dim.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Result display
  if (result) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-100">
            {selectedScenario.title}
          </h3>
          <button
            onClick={reset}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Try another scenario
          </button>
        </div>

        {/* Overall Result */}
        <div className={`p-6 rounded-lg border ${
          result.result === 'pass'
            ? 'bg-green-900/20 border-green-700/50'
            : result.result === 'needs-depth'
              ? 'bg-amber-900/20 border-amber-700/50'
              : 'bg-red-900/20 border-red-700/50'
        }`}>
          <div className="flex items-start gap-4">
            {result.result === 'pass' ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-400" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-zinc-100">
                  {result.overall}%
                </span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  result.result === 'pass'
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-amber-600/30 text-amber-300'
                }`}>
                  {result.level}
                </span>
              </div>
              <p className="text-zinc-300">{result.feedback}</p>
            </div>
          </div>
        </div>

        {/* Rubric Breakdown */}
        <div className="bg-zinc-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-4">Detailed Scores</h4>
          <div className="space-y-4">
            {Object.entries(result.rubricScores).map(([criterion, data]) => (
              <div key={criterion}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-400 capitalize">
                    {criterion.replace(/-/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-zinc-200">
                    {data.score}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.score >= 60 ? 'bg-green-500' :
                      data.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{data.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Growth Edges */}
        <div className="grid md:grid-cols-2 gap-4">
          {result.strengths.length > 0 && (
            <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="text-sm text-zinc-300 space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.growthEdges.length > 0 && (
            <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Growth Edges
              </h4>
              <ul className="text-sm text-zinc-300 space-y-1">
                {result.growthEdges.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Model Response (if available and score was low) */}
        {result.modelResponse && (
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowModel(!showModel)}
              className="w-full p-4 text-left bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-zinc-300">
                See an example of a stronger response
              </span>
              <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${showModel ? 'rotate-90' : ''}`} />
            </button>
            {showModel && (
              <div className="p-4 bg-zinc-900/50 text-sm text-zinc-400 whitespace-pre-wrap">
                {result.modelResponse}
              </div>
            )}
          </div>
        )}

        {/* Try Again */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setResult(null);
              setResponse('');
            }}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
          >
            Try This Scenario Again
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Choose Different Scenario
          </button>
        </div>
      </div>
    );
  }

  // Scenario response form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={reset}
            className="text-sm text-zinc-400 hover:text-zinc-200 mb-2"
          >
            ← Back to scenarios
          </button>
          <h3 className="text-xl font-semibold text-zinc-100">
            {selectedScenario.title}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          selectedScenario.difficulty === 'beginner'
            ? 'bg-green-900/50 text-green-300'
            : selectedScenario.difficulty === 'intermediate'
              ? 'bg-amber-900/50 text-amber-300'
              : 'bg-red-900/50 text-red-300'
        }`}>
          {selectedScenario.difficulty}
        </span>
      </div>

      {/* Scenario Context */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-5">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">THE SCENARIO</h4>
        <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
          {selectedScenario.context || selectedScenario.description}
        </p>
      </div>

      {/* Response Input */}
      <div>
        <label className="block mb-2">
          <span className="text-zinc-300 font-medium">Your Response</span>
          <span className="text-zinc-500 text-sm ml-2">
            Write out what you would say or do
          </span>
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write your full response here. Include the words you would use, how you would handle pushback, and any internal process you would go through..."
          className="w-full h-64 bg-zinc-900/50 border border-zinc-600 rounded-lg p-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
          disabled={submitting}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-zinc-500 text-sm">
            {response.length} characters
            {response.length > 0 && response.length < 150 && (
              <span className="text-amber-400 ml-2">
                (more detail will get you better feedback)
              </span>
            )}
          </p>
          <button
            onClick={submitResponse}
            disabled={submitting || response.length < 100}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            {submitting ? 'Evaluating...' : 'Get Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
