'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

interface DimensionHealth {
  pillarId: string;
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: string;
}

interface PathStep {
  type: 'course' | 'article' | 'practice' | 'milestone' | 'reassessment';
  slug: string;
  title: string;
  description: string;
  duration?: string;
  priority: 'essential' | 'recommended' | 'optional';
  targetDimension: string;
  targetPillar: string;
}

interface CustomPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  primaryPillar: string;
  targetDimensions: string[];
  currentStage: string;
  steps: PathStep[];
  estimatedDuration: string;
  expectedOutcomes: string[];
}

interface SavedPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  primaryPillar: string;
  targetDimensions: string[];
  completedSteps: string[];
  currentStepIndex: number;
  isActive: boolean;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  pathData: CustomPath;
}

const PILLAR_OPTIONS = [
  { id: 'mind', label: 'Mind', color: 'blue', icon: '🧠' },
  { id: 'body', label: 'Body', color: 'emerald', icon: '💪' },
  { id: 'soul', label: 'Soul', color: 'purple', icon: '✨' },
  { id: 'relationships', label: 'Relationships', color: 'rose', icon: '❤️' },
];

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  collapse: { label: 'Crisis/Collapse', color: 'red' },
  regulation: { label: 'Regulation', color: 'amber' },
  integration: { label: 'Integration', color: 'blue' },
  embodiment: { label: 'Embodiment', color: 'emerald' },
  optimization: { label: 'Optimization', color: 'purple' },
};

const TYPE_ICONS: Record<string, string> = {
  course: '📚',
  article: '📄',
  practice: '🧘',
  milestone: '🏆',
  reassessment: '📊',
};

export default function LearningPathPage() {
  const [dimensionHealth, setDimensionHealth] = useState<DimensionHealth[]>([]);
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [generatedPath, setGeneratedPath] = useState<CustomPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation options
  const [focusPillar, setFocusPillar] = useState<string>('');
  const [focusDimension, setFocusDimension] = useState<string>('');
  const [maxSteps, setMaxSteps] = useState(12);
  const [includeOptional, setIncludeOptional] = useState(false);

  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch dimension health and existing paths in parallel
      const [healthRes, pathsRes] = await Promise.all([
        fetch('/api/assessment/health'),
        fetch('/api/learning-paths/custom'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDimensionHealth(healthData.dimensions || []);
      }

      if (pathsRes.ok) {
        const pathsData = await pathsRes.json();
        setSavedPaths(pathsData.paths || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generatePath() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/learning-paths/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusPillar: focusPillar || undefined,
          focusDimension: focusDimension || undefined,
          maxSteps,
          includeOptional,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate path');
      }

      const data = await response.json();
      setGeneratedPath(data.path);

      // Refresh paths list
      await fetchData();
      setShowGenerator(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  // Get available dimensions for the selected pillar
  const availableDimensions = dimensionHealth.filter(
    d => !focusPillar || d.pillarId === focusPillar
  );

  // Get growth edges (lowest scoring dimensions)
  const growthEdges = [...dimensionHealth]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  // Active path
  const activePath = savedPaths.find(p => p.isActive);
  const completedPaths = savedPaths.filter(p => p.completedAt);

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-zinc-950 pt-20 px-6">
          <div className="max-w-4xl mx-auto py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-zinc-800 rounded w-1/3" />
              <div className="h-4 bg-zinc-800 rounded w-2/3" />
              <div className="h-64 bg-zinc-800 rounded" />
            </div>
          </div>
        </main>
      </>
    );
  }

  // No assessment data
  if (dimensionHealth.length === 0) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-zinc-950 pt-20 px-6">
          <div className="max-w-4xl mx-auto py-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl text-white mb-2">Complete an Assessment First</h1>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                To generate a personalized learning path, we need to understand where you are in your development journey. Complete the integration health assessment to get started.
              </p>
              <Link
                href="/profile/health"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
              >
                Start Assessment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950 pt-20 px-6">
        <div className="max-w-4xl mx-auto py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/profile" className="text-gray-500 hover:text-gray-300 text-sm mb-4 inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="font-serif text-4xl font-light text-white mb-2">Your Learning Path</h1>
            <p className="text-gray-400">
              A personalized journey based on your assessment results and growth edges.
            </p>
          </div>

          {/* Growth Edges Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Your Growth Edges</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {growthEdges.map(edge => (
                <div key={edge.dimensionId} className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{edge.dimensionName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      edge.stage === 'collapse' ? 'bg-red-900/50 text-red-300' :
                      edge.stage === 'regulation' ? 'bg-amber-900/50 text-amber-300' :
                      edge.stage === 'integration' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-emerald-900/50 text-emerald-300'
                    }`}>
                      {edge.stage}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                      style={{ width: `${edge.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{edge.pillarId}</span>
                    <span className="text-xs text-gray-500">{edge.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Path */}
          {activePath && (
            <div className="bg-gradient-to-r from-amber-900/20 to-transparent border border-amber-800/30 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-400">Active Path</span>
                  <h2 className="text-xl font-medium text-white mt-1">{activePath.title}</h2>
                  {activePath.subtitle && <p className="text-sm text-gray-400">{activePath.subtitle}</p>}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full bg-${PILLAR_OPTIONS.find(p => p.id === activePath.primaryPillar)?.color || 'zinc'}-900/50 text-${PILLAR_OPTIONS.find(p => p.id === activePath.primaryPillar)?.color || 'gray'}-300`}>
                  {activePath.primaryPillar}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{activePath.completedSteps.length} of {activePath.pathData.steps.length} steps</span>
                  <span>{Math.round((activePath.completedSteps.length / activePath.pathData.steps.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                    style={{ width: `${(activePath.completedSteps.length / activePath.pathData.steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {activePath.pathData.steps.map((step, index) => {
                  const isCompleted = activePath.completedSteps.includes(step.slug);
                  const isCurrent = index === activePath.currentStepIndex;

                  return (
                    <div
                      key={step.slug}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isCurrent ? 'bg-amber-900/30 border border-amber-700/50' :
                        isCompleted ? 'bg-emerald-900/20' : 'bg-zinc-800/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-900/50 text-emerald-400' :
                        isCurrent ? 'bg-amber-900/50 text-amber-400' : 'bg-zinc-700 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{TYPE_ICONS[step.type]}</span>
                          <span className={`font-medium ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
                            {step.title}
                          </span>
                          {step.priority === 'essential' && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">Essential</span>
                          )}
                        </div>
                        {step.duration && (
                          <span className="text-xs text-gray-500">{step.duration}</span>
                        )}
                      </div>
                      {isCurrent && !isCompleted && (
                        <Link
                          href={step.type === 'course' ? `/courses/${step.slug}` :
                                step.type === 'article' ? `/posts/${step.slug}` :
                                step.type === 'practice' ? `/practices/${step.slug}` : '#'}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors"
                        >
                          Start
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-700">
                <button
                  onClick={() => setShowGenerator(true)}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Generate a new path →
                </button>
              </div>
            </div>
          )}

          {/* Generator Panel */}
          {(showGenerator || !activePath) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-medium text-white mb-2">Generate Your Path</h2>
              <p className="text-gray-400 text-sm mb-6">
                Customize your learning journey based on your specific goals and available time.
              </p>

              {error && (
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Focus Pillar */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Focus Area (optional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => { setFocusPillar(''); setFocusDimension(''); }}
                      className={`p-3 rounded-lg text-sm transition-colors ${
                        !focusPillar ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      All Areas
                    </button>
                    {PILLAR_OPTIONS.map(pillar => (
                      <button
                        key={pillar.id}
                        onClick={() => { setFocusPillar(pillar.id); setFocusDimension(''); }}
                        className={`p-3 rounded-lg text-sm transition-colors ${
                          focusPillar === pillar.id ? `bg-${pillar.color}-900/50 text-${pillar.color}-300 border border-${pillar.color}-700/50` : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                      >
                        {pillar.icon} {pillar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Dimension */}
                {availableDimensions.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Specific Dimension (optional)</label>
                    <select
                      value={focusDimension}
                      onChange={(e) => setFocusDimension(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-600"
                    >
                      <option value="">Based on growth edges</option>
                      {availableDimensions.map(d => (
                        <option key={d.dimensionId} value={d.dimensionId}>
                          {d.dimensionName} ({d.score}%)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Path Length */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Path Length</label>
                  <div className="flex gap-2">
                    {[6, 12, 18].map(num => (
                      <button
                        key={num}
                        onClick={() => setMaxSteps(num)}
                        className={`flex-1 p-3 rounded-lg text-sm transition-colors ${
                          maxSteps === num ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                      >
                        {num} steps
                        <span className="block text-xs text-gray-500">
                          {num === 6 ? '~1 week' : num === 12 ? '~2 weeks' : '~3 weeks'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include Optional */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOptional}
                      onChange={(e) => setIncludeOptional(e.target.checked)}
                      className="w-5 h-5 bg-zinc-800 border border-zinc-600 rounded text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-sm text-gray-300">Include optional reassessment steps</span>
                  </label>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generatePath}
                  disabled={generating}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Your Path...
                    </span>
                  ) : (
                    'Generate My Learning Path'
                  )}
                </button>

                {showGenerator && activePath && (
                  <button
                    onClick={() => setShowGenerator(false)}
                    className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed Paths */}
          {completedPaths.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white mb-4">Completed Paths</h2>
              <div className="space-y-3">
                {completedPaths.map(path => (
                  <div key={path.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{path.title}</h3>
                      <p className="text-sm text-gray-500">
                        Completed {new Date(path.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{path.pathData.steps.length} steps</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <Link
              href="/learning-paths"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Curated Paths</h3>
                <p className="text-sm text-gray-500">Explore pre-built learning journeys</p>
              </div>
            </Link>
            <Link
              href="/profile/health"
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Integration Health</h3>
                <p className="text-sm text-gray-500">View your full assessment results</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
