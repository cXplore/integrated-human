'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AssessmentSummary {
  archetype: {
    primaryArchetype: string;
    secondaryArchetype: string | null;
    isWounded: boolean;
    isIntegrated: boolean;
  } | null;
  attachment: {
    style: string;
    styleName: string;
  } | null;
  nervousSystem: {
    state: string;
    stateName: string;
  } | null;
}

interface CrossInsight {
  title: string;
  insight: string;
  invitation: string;
  sources: string[];
}

interface InsightData {
  hasEnoughData: boolean;
  completedCount: number;
  missing?: {
    archetype: boolean;
    attachment: boolean;
    nervousSystem: boolean;
  };
  assessments?: AssessmentSummary;
  insights?: {
    overallPattern: string;
    insights: CrossInsight[];
    primaryWork: string;
    strengths: string[];
    watchPoints: string[];
  };
}

export default function SelfDiscovery() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/insights');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-20 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  // Assessment cards - show completed ones or prompts to take them
  const assessmentCards = [
    {
      type: 'archetype',
      title: 'Archetype',
      link: '/archetypes',
      completed: data?.assessments?.archetype,
      result: data?.assessments?.archetype
        ? `${data.assessments.archetype.primaryArchetype}${data.assessments.archetype.secondaryArchetype ? ` — ${data.assessments.archetype.secondaryArchetype}` : ''}`
        : null,
      status: data?.assessments?.archetype?.isWounded ? 'shadow' : data?.assessments?.archetype?.isIntegrated ? 'integrated' : null,
      color: 'amber',
    },
    {
      type: 'attachment',
      title: 'Attachment',
      link: '/attachment',
      completed: data?.assessments?.attachment,
      result: data?.assessments?.attachment?.styleName || null,
      color: 'rose',
    },
    {
      type: 'nervous-system',
      title: 'Nervous System',
      link: '/nervous-system',
      completed: data?.assessments?.nervousSystem,
      result: data?.assessments?.nervousSystem?.stateName || null,
      color: 'emerald',
    },
  ];

  const completedCount = assessmentCards.filter(a => a.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          Self-Discovery
        </h2>
        <span className="text-xs text-gray-600">
          {completedCount}/3 completed
        </span>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-3 gap-3">
        {assessmentCards.map((assessment) => (
          <Link
            key={assessment.type}
            href={assessment.link}
            className={`block p-4 border transition-colors ${
              assessment.completed
                ? `border-${assessment.color}-800/50 bg-${assessment.color}-900/10 hover:border-${assessment.color}-700`
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {assessment.title}
            </div>
            {assessment.completed ? (
              <>
                <div className={`text-${assessment.color}-400 font-medium text-sm`}>
                  {assessment.result}
                </div>
                {assessment.status && (
                  <div className="text-xs text-gray-600 mt-1">
                    {assessment.status === 'shadow' ? 'In shadow' : 'Integrated'}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm">Take quiz →</div>
            )}
          </Link>
        ))}
      </div>

      {/* Cross Insights */}
      {data?.hasEnoughData && data.insights && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          {/* Overall Pattern */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Your Pattern
            </div>
            <div className="text-white text-sm">
              {data.insights.overallPattern}
            </div>
          </div>

          {/* Primary Work */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Primary Focus
            </div>
            <p className="text-gray-300 text-sm">
              {data.insights.primaryWork}
            </p>
          </div>

          {/* Insights */}
          {data.insights.insights.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Insights
              </div>
              {data.insights.insights.map((insight, index) => (
                <div
                  key={index}
                  className="border border-zinc-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
                    className="w-full p-4 text-left hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {insight.title}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expandedInsight === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {insight.sources.map((source) => (
                        <span
                          key={source}
                          className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500 rounded"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </button>
                  {expandedInsight === index && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-800 space-y-3">
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {insight.insight}
                      </p>
                      <div className="bg-zinc-800/50 p-3 border-l-2 border-amber-600">
                        <p className="text-xs text-gray-500 mb-1">Invitation</p>
                        <p className="text-gray-300 text-sm">
                          {insight.invitation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Watch Points */}
          {(data.insights.strengths.length > 0 || data.insights.watchPoints.length > 0) && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {data.insights.strengths.length > 0 && (
                <div>
                  <div className="text-xs text-emerald-600 uppercase tracking-wide mb-2">
                    Strengths
                  </div>
                  <ul className="space-y-2">
                    {data.insights.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">+</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.insights.watchPoints.length > 0 && (
                <div>
                  <div className="text-xs text-amber-600 uppercase tracking-wide mb-2">
                    Watch Points
                  </div>
                  <ul className="space-y-2">
                    {data.insights.watchPoints.map((point, i) => (
                      <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">!</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt to complete more assessments */}
      {!data?.hasEnoughData && completedCount < 2 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Complete {2 - completedCount} more assessment{2 - completedCount > 1 ? 's' : ''} to see personalized insights
        </div>
      )}
    </div>
  );
}
