'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GrowthEdge {
  dimensionId: string;
  dimensionName: string;
  pillarId: string;
  score: number;
  stage: string;
  recommendation?: string;
  suggestedContent?: {
    type: 'course' | 'article' | 'practice';
    slug: string;
    title: string;
  };
}

const PILLAR_COLORS: Record<string, string> = {
  mind: 'text-blue-400 bg-blue-900/30',
  body: 'text-emerald-400 bg-emerald-900/30',
  soul: 'text-purple-400 bg-purple-900/30',
  relationships: 'text-rose-400 bg-rose-900/30',
};

const STAGE_COLORS: Record<string, string> = {
  collapse: 'bg-red-500',
  regulation: 'bg-amber-500',
  integration: 'bg-blue-500',
  embodiment: 'bg-emerald-500',
  optimization: 'bg-purple-500',
};

export default function GrowthEdges() {
  const [edges, setEdges] = useState<GrowthEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<GrowthEdge | null>(null);

  useEffect(() => {
    fetchEdges();
  }, []);

  async function fetchEdges() {
    try {
      const response = await fetch('/api/assessment/health');
      if (response.ok) {
        const data = await response.json();
        setEdges(data.growthEdges || []);
      }
    } catch (err) {
      console.error('Error fetching growth edges:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (edges.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Growth Edges</h2>
            <p className="text-sm text-gray-500">Areas with the most potential for growth</p>
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">Complete an assessment to see your growth edges</p>
          <Link
            href="/profile/health"
            className="inline-flex items-center gap-2 mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Start Assessment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
          <span className="text-xl">🌱</span>
        </div>
        <div>
          <h2 className="text-lg font-medium text-white">Growth Edges</h2>
          <p className="text-sm text-gray-500">Where focused attention will have the most impact</p>
        </div>
      </div>

      <div className="space-y-3">
        {edges.slice(0, 5).map((edge, index) => (
          <button
            key={edge.dimensionId}
            onClick={() => setSelectedEdge(selectedEdge?.dimensionId === edge.dimensionId ? null : edge)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedEdge?.dimensionId === edge.dimensionId
                ? 'bg-zinc-800 border-amber-700/50'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 text-sm font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">{edge.dimensionName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PILLAR_COLORS[edge.pillarId]}`}>
                    {edge.pillarId}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STAGE_COLORS[edge.stage]} rounded-full`}
                      style={{ width: `${edge.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{edge.score}%</span>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  selectedEdge?.dimensionId === edge.dimensionId ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded content */}
            {selectedEdge?.dimensionId === edge.dimensionId && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-xs text-gray-400 mb-3">
                  Currently at <span className="font-medium text-gray-300">{edge.stage}</span> stage.
                  {edge.stage === 'collapse' && ' Focus on stabilization and basic safety first.'}
                  {edge.stage === 'regulation' && ' Building consistent habits and capacity.'}
                  {edge.stage === 'integration' && ' Ready for deeper processing and connection.'}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/profile/learning-path?focus=${edge.dimensionId}`}
                    className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium text-center rounded transition-colors"
                  >
                    Create Learning Path
                  </Link>
                  <Link
                    href={`/practices?pillar=${edge.pillarId}`}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300 text-xs rounded transition-colors"
                  >
                    Browse Practices
                  </Link>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Summary insight */}
      <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg">
        <p className="text-xs text-gray-400">
          <span className="text-amber-400">💡</span>{' '}
          {edges[0].stage === 'collapse'
            ? `Your ${edges[0].dimensionName.toLowerCase()} needs priority attention. Start with basics.`
            : `Focused work on ${edges[0].dimensionName.toLowerCase()} will likely create positive ripple effects.`}
        </p>
      </div>
    </div>
  );
}
