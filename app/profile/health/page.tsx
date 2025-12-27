'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DimensionData {
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: string;
  scoreSource: 'verified' | 'estimated' | 'none';
  confidence?: number;
  freshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  verifiedAt?: string;
  estimatedDelta?: number;
  showReassessPrompt: boolean;
  reassessReason?: string;
}

interface PillarData {
  score: number;
  stage: string;
  stageInfo: { name: string; color: string; description: string };
  scoreSource: 'verified' | 'estimated' | 'legacy' | 'none';
  confidence?: number;
  freshness?: 'fresh' | 'aging' | 'stale' | 'expired';
  verifiedAt?: string;
  dimensions: DimensionData[];
  needsAssessment: boolean;
  needsReassessment: boolean;
  reassessmentReason?: string;
}

interface HealthData {
  pillars: {
    mind: PillarData;
    body: PillarData;
    soul: PillarData;
    relationships: PillarData;
  };
  overall: {
    score: number;
    stage: string;
    stageInfo: { name: string; color: string; description: string };
    completeness: number;
  };
  dataStatus: {
    hasNewSystemData: boolean;
    hasLegacyData: boolean;
    lastUpdated: string;
  };
}

const PILLAR_NAMES: Record<string, { name: string; icon: string }> = {
  mind: { name: 'Mind', icon: '🧠' },
  body: { name: 'Body', icon: '💪' },
  soul: { name: 'Soul', icon: '✨' },
  relationships: { name: 'Relationships', icon: '💚' },
};

export default function HealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthData | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch('/api/health/display');
        if (!response.ok) {
          throw new Error('Failed to load health data');
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse text-gray-400">Loading health data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl text-red-400 mb-4">Error</h1>
          <p className="text-gray-400 mb-8">{error || 'Failed to load data'}</p>
          <Link
            href="/assessment"
            className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
          >
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl font-light">Integration Health</h1>
          <p className="text-gray-400">
            Your development across the four pillars of integrated living.
          </p>
        </div>

        {/* Overall Score */}
        <div className="p-8 border border-zinc-700 rounded-lg text-center">
          <div className="text-sm text-gray-500 mb-2">Overall Integration</div>
          <div
            className="text-5xl font-light mb-2"
            style={{ color: data.overall.stageInfo.color }}
          >
            {data.overall.score}
          </div>
          <div className="text-lg text-white mb-2">{data.overall.stageInfo.name}</div>
          <p className="text-sm text-gray-400">{data.overall.stageInfo.description}</p>

          {data.overall.completeness < 100 && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="text-sm text-gray-500">Assessment Completeness</div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${data.overall.completeness}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400">{data.overall.completeness}%</span>
              </div>
              {data.overall.completeness === 0 && (
                <Link
                  href="/assessment"
                  className="inline-block mt-4 px-6 py-2 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Start Assessment
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Pillars */}
        <div className="space-y-6">
          <h2 className="text-lg text-white">The Four Pillars</h2>

          <div className="grid gap-4">
            {(['mind', 'body', 'soul', 'relationships'] as const).map((pillarId) => {
              const pillar = data.pillars[pillarId];
              const pillarInfo = PILLAR_NAMES[pillarId];
              const isExpanded = expandedPillar === pillarId;

              return (
                <div
                  key={pillarId}
                  className="border border-zinc-700 rounded-lg overflow-hidden"
                >
                  {/* Pillar Header */}
                  <button
                    onClick={() => setExpandedPillar(isExpanded ? null : pillarId)}
                    className="w-full p-6 text-left hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pillarInfo.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{pillarInfo.name}</span>
                            <ScoreSourceBadge source={pillar.scoreSource} />
                            {pillar.freshness && pillar.freshness !== 'fresh' && (
                              <FreshnessBadge freshness={pillar.freshness} />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pillar.stageInfo.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className="text-2xl font-light"
                            style={{ color: pillar.stageInfo.color }}
                          >
                            {pillar.score}
                          </div>
                          {pillar.confidence && (
                            <div className="text-xs text-gray-500">
                              {pillar.confidence}% confidence
                            </div>
                          )}
                        </div>
                        <div
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Reassessment prompt */}
                    {pillar.needsReassessment && (
                      <div className="mt-3 text-sm text-amber-400">
                        {pillar.reassessmentReason || 'Ready for reassessment'}
                      </div>
                    )}
                  </button>

                  {/* Expanded Dimensions */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-6 space-y-4">
                      {pillar.dimensions.map((dim) => (
                        <DimensionRow
                          key={dim.dimensionId}
                          pillarId={pillarId}
                          dimension={dim}
                        />
                      ))}

                      {pillar.needsAssessment && (
                        <Link
                          href="/assessment"
                          className="block w-full p-4 border border-dashed border-zinc-600 text-center text-gray-400 hover:border-zinc-500 hover:text-white transition-colors"
                        >
                          Take full assessment to get verified scores
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 border border-zinc-800 rounded-lg text-sm text-gray-500">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-white">Understanding Your Scores</div>
            <Link
              href="/transparency/health-tracking"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Learn more →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                Verified
              </span>
              <span>From assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                Estimated
              </span>
              <span>Based on activity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                Aging
              </span>
              <span>30-90 days old</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                Stale
              </span>
              <span>90+ days old</span>
            </div>
          </div>
        </div>

        {/* Back to Profile */}
        <div className="text-center pt-4">
          <Link
            href="/profile"
            className="text-gray-500 hover:text-white transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

function ScoreSourceBadge({ source }: { source: string }) {
  if (source === 'verified') {
    return (
      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
        Verified
      </span>
    );
  }
  if (source === 'estimated') {
    return (
      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
        Estimated
      </span>
    );
  }
  return null;
}

function FreshnessBadge({ freshness }: { freshness: string }) {
  if (freshness === 'aging') {
    return (
      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
        Aging
      </span>
    );
  }
  if (freshness === 'stale') {
    return (
      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
        Stale
      </span>
    );
  }
  if (freshness === 'expired') {
    return (
      <span className="px-2 py-0.5 bg-red-500/30 text-red-400 text-xs rounded">
        Expired
      </span>
    );
  }
  return null;
}

function DimensionRow({
  pillarId,
  dimension,
}: {
  pillarId: string;
  dimension: DimensionData;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white">{dimension.dimensionName}</span>
          {dimension.scoreSource === 'estimated' && (
            <span className="text-xs text-amber-400">~</span>
          )}
          {dimension.freshness && dimension.freshness !== 'fresh' && (
            <FreshnessBadge freshness={dimension.freshness} />
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                dimension.scoreSource === 'verified' ? 'bg-white' : 'bg-amber-500/50'
              }`}
              style={{ width: `${dimension.score}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 w-8">{dimension.score}</span>
        </div>

        {/* Delta indicator */}
        {dimension.estimatedDelta !== undefined && dimension.estimatedDelta !== 0 && (
          <div
            className={`text-xs mt-1 ${
              dimension.estimatedDelta > 0 ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {dimension.estimatedDelta > 0 ? '+' : ''}
            {dimension.estimatedDelta} from activity
          </div>
        )}
      </div>

      {/* Reassess button */}
      {dimension.showReassessPrompt && (
        <Link
          href={`/assessment/reassess/${pillarId}/${dimension.dimensionId}`}
          className="ml-4 px-3 py-1 border border-amber-500/50 text-amber-400 text-sm hover:bg-amber-500/10 transition-colors rounded"
        >
          Reassess
        </Link>
      )}
    </div>
  );
}
