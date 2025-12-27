'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type SpectrumStage = 'collapse' | 'regulation' | 'integration' | 'embodiment' | 'optimization';
type Pillar = 'mind' | 'body' | 'soul' | 'relationships';

interface PillarData {
  score: number;
  stage: SpectrumStage;
  dimensions: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}

interface HealthData {
  pillars: Record<Pillar, PillarData>;
  overall: {
    score: number;
    stage: SpectrumStage;
  };
  lastUpdated: string;
}

interface StageInfo {
  name: string;
  description: string;
  color: string;
  focus: string;
}

interface PillarInfo {
  name: string;
  description: string;
  icon: string;
  dimensions: string[];
}

const STAGE_COLORS: Record<SpectrumStage, string> = {
  collapse: 'bg-red-500',
  regulation: 'bg-orange-500',
  integration: 'bg-yellow-500',
  embodiment: 'bg-green-500',
  optimization: 'bg-blue-500',
};

const STAGE_BG_COLORS: Record<SpectrumStage, string> = {
  collapse: 'bg-red-500/10 border-red-500/30',
  regulation: 'bg-orange-500/10 border-orange-500/30',
  integration: 'bg-yellow-500/10 border-yellow-500/30',
  embodiment: 'bg-green-500/10 border-green-500/30',
  optimization: 'bg-blue-500/10 border-blue-500/30',
};

const TREND_ICONS: Record<string, string> = {
  improving: '↑',
  stable: '→',
  declining: '↓',
};

const TREND_COLORS: Record<string, string> = {
  improving: 'text-green-400',
  stable: 'text-stone-400',
  declining: 'text-red-400',
};

export default function IntegrationHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stages, setStages] = useState<Record<SpectrumStage, StageInfo> | null>(null);
  const [pillars, setPillars] = useState<Record<Pillar, PillarInfo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<Pillar | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }
      const data = await response.json();
      setHealth(data.health);
      setStages(data.meta.stages);
      setPillars(data.meta.pillars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-stone-900/50 rounded-xl p-6 border border-stone-800">
        <div className="animate-pulse">
          <div className="h-6 bg-stone-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-stone-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !health || !stages || !pillars) {
    return (
      <div className="bg-stone-900/50 rounded-xl p-6 border border-stone-800">
        <p className="text-stone-400 text-sm">Unable to load integration health.</p>
      </div>
    );
  }

  const pillarOrder: Pillar[] = ['mind', 'body', 'soul', 'relationships'];

  return (
    <div className="bg-stone-900/50 rounded-xl p-6 border border-stone-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-stone-100">Integration Health</h2>
          <p className="text-sm text-stone-400 mt-1">
            Your development across the four pillars
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full border ${STAGE_BG_COLORS[health.overall.stage]}`}>
          <span className="text-sm font-medium text-stone-200">
            {stages[health.overall.stage].name}
          </span>
        </div>
      </div>

      {/* Overall Score Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>Overall Integration</span>
          <span>{health.overall.score}%</span>
        </div>
        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${STAGE_COLORS[health.overall.stage]} transition-all duration-500`}
            style={{ width: `${health.overall.score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-600 mt-1">
          <span>Collapse</span>
          <span>Regulation</span>
          <span>Integration</span>
          <span>Embodiment</span>
          <span>Optimization</span>
        </div>
      </div>

      {/* Pillar Grid */}
      <div className="grid grid-cols-2 gap-3">
        {pillarOrder.map((pillar) => {
          const data = health.pillars[pillar];
          const info = pillars[pillar];
          const stageInfo = stages[data.stage];
          const isExpanded = expandedPillar === pillar;

          return (
            <button
              key={pillar}
              onClick={() => setExpandedPillar(isExpanded ? null : pillar)}
              className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                isExpanded
                  ? STAGE_BG_COLORS[data.stage]
                  : 'bg-stone-800/50 border-stone-700 hover:border-stone-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium text-stone-200">{info.name}</span>
                </div>
                <span className={`text-sm ${TREND_COLORS[data.trend]}`}>
                  {TREND_ICONS[data.trend]}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${STAGE_COLORS[data.stage]} transition-all duration-500`}
                  style={{ width: `${data.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">{stageInfo.name}</span>
                <span className="text-xs text-stone-500">{data.score}%</span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-stone-700/50">
                  <p className="text-xs text-stone-400 mb-3">{stageInfo.focus}</p>

                  {/* Dimension breakdown */}
                  <div className="space-y-2">
                    {info.dimensions.map((dim, i) => {
                      const dimKey = Object.keys(data.dimensions)[i];
                      const value = data.dimensions[dimKey] ?? 0;
                      return (
                        <div key={dim}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-stone-400">{dim}</span>
                            <span className="text-stone-500">{value}%</span>
                          </div>
                          <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-stone-500 transition-all duration-300"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Insight / Call to Action */}
      <div className="mt-6 pt-4 border-t border-stone-800">
        <PillarInsight health={health} stages={stages} />
      </div>

      {/* View Full Dashboard Link */}
      <div className="mt-6 text-center">
        <Link
          href="/profile/health"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors"
        >
          <span>View Full Health Dashboard</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Last updated */}
      <p className="text-xs text-stone-600 mt-4 text-center">
        Updated {new Date(health.lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
}

function PillarInsight({
  health,
  stages,
}: {
  health: HealthData;
  stages: Record<SpectrumStage, StageInfo>;
}) {
  // Find lowest pillar for focus recommendation
  const pillarOrder: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
  const lowestPillar = pillarOrder.reduce((lowest, current) =>
    health.pillars[current].score < health.pillars[lowest].score ? current : lowest
  );
  const lowestData = health.pillars[lowestPillar];

  // Find if any pillar is in collapse
  const inCollapse = pillarOrder.find((p) => health.pillars[p].stage === 'collapse');

  // Find improving areas
  const improving = pillarOrder.filter((p) => health.pillars[p].trend === 'improving');

  if (inCollapse) {
    const collapseData = health.pillars[inCollapse];
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-sm text-red-200">
          Your {inCollapse} area is showing signs of crisis. This is the priority focus.
          {inCollapse === 'body' && ' Start with nervous system regulation.'}
          {inCollapse === 'relationships' && ' Consider attachment-focused support.'}
          {inCollapse === 'mind' && ' Emotional processing and stability first.'}
          {inCollapse === 'soul' && ' Reconnecting with meaning and grounding.'}
        </p>
        <Link
          href={`/courses?pillar=${inCollapse}`}
          className="text-xs text-red-300 hover:text-red-200 mt-2 inline-block"
        >
          See recommended resources →
        </Link>
      </div>
    );
  }

  if (improving.length > 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-sm text-green-200">
          Progress in {improving.map((p) => p).join(' and ')}.{' '}
          {lowestPillar !== improving[0] && (
            <>Your {lowestPillar} ({stages[lowestData.stage].name}) could use more attention.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
      <p className="text-sm text-stone-300">
        Your {lowestPillar} area ({stages[lowestData.stage].name} stage) is your current growing edge.{' '}
        {stages[lowestData.stage].focus}
      </p>
      <Link
        href={`/courses?pillar=${lowestPillar}`}
        className="text-xs text-stone-400 hover:text-stone-300 mt-2 inline-block"
      >
        Explore {lowestPillar} courses →
      </Link>
    </div>
  );
}
