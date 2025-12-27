'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DimensionData {
  pillarId: string;
  dimensionId: string;
  verifiedScore: number;
  estimatedScore: number | null;
  freshness: 'fresh' | 'aging' | 'stale' | 'expired';
  stage: string;
  daysSinceAssessment: number;
}

interface ReassessmentData {
  needsReassessment: boolean;
  staleDimensions: DimensionData[];
  divergentDimensions: DimensionData[];
  primaryRecommendation: {
    pillarId: string;
    dimensionId: string;
    reason: string;
  } | null;
}

const DIMENSION_NAMES: Record<string, Record<string, string>> = {
  mind: {
    'emotional-regulation': 'Emotional Regulation',
    'cognitive-flexibility': 'Cognitive Flexibility',
    'self-awareness': 'Self-Awareness',
    'present-moment': 'Present Moment',
    'thought-patterns': 'Thought Patterns',
    'psychological-safety': 'Psychological Safety',
    'self-relationship': 'Self-Relationship',
    'meaning-purpose': 'Meaning & Purpose',
  },
  body: {
    'interoception': 'Body Awareness',
    'stress-physiology': 'Stress Response',
    'sleep-restoration': 'Sleep Quality',
    'energy-vitality': 'Energy',
    'movement-capacity': 'Movement',
    'nourishment': 'Nourishment',
    'embodied-presence': 'Embodied Presence',
  },
  soul: {
    'authenticity': 'Authenticity',
    'existential-grounding': 'Existential Grounding',
    'transcendence': 'Transcendence',
    'shadow-integration': 'Shadow Work',
    'creative-expression': 'Creative Expression',
    'life-engagement': 'Life Engagement',
    'inner-wisdom': 'Inner Wisdom',
    'spiritual-practice': 'Spiritual Practice',
  },
  relationships: {
    'attachment-patterns': 'Attachment',
    'communication': 'Communication',
    'boundaries': 'Boundaries',
    'conflict-repair': 'Conflict & Repair',
    'trust-vulnerability': 'Trust',
    'empathy-attunement': 'Empathy',
    'intimacy-depth': 'Intimacy',
    'social-connection': 'Connection',
    'relational-patterns': 'Relationship Patterns',
  },
};

const PILLAR_LABELS: Record<string, string> = {
  mind: 'Mind',
  body: 'Body',
  soul: 'Soul',
  relationships: 'Relationships',
};

function getDimensionName(pillarId: string, dimensionId: string): string {
  return DIMENSION_NAMES[pillarId]?.[dimensionId] || dimensionId.replace(/-/g, ' ');
}

export default function ReassessmentPrompt() {
  const [data, setData] = useState<ReassessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchReassessmentData() {
      try {
        const response = await fetch('/api/health/display');
        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const healthData = await response.json();
        const dimensions: DimensionData[] = healthData.dimensions || [];

        if (dimensions.length === 0) {
          setIsLoading(false);
          return;
        }

        // Find stale or expired dimensions
        const staleDimensions = dimensions.filter(
          d => d.freshness === 'stale' || d.freshness === 'expired'
        );

        // Find dimensions where estimated score significantly differs from verified
        const divergentDimensions = dimensions.filter(d => {
          if (d.estimatedScore === null) return false;
          const diff = Math.abs(d.estimatedScore - d.verifiedScore);
          return diff >= 15; // 15+ point difference is significant
        });

        // Determine primary recommendation
        let primaryRecommendation = null;

        if (staleDimensions.length > 0) {
          // Prioritize oldest stale dimension
          const oldest = staleDimensions.sort((a, b) => b.daysSinceAssessment - a.daysSinceAssessment)[0];
          primaryRecommendation = {
            pillarId: oldest.pillarId,
            dimensionId: oldest.dimensionId,
            reason: oldest.freshness === 'expired'
              ? `Your ${getDimensionName(oldest.pillarId, oldest.dimensionId)} score is over 6 months old`
              : `It has been ${oldest.daysSinceAssessment} days since you assessed ${getDimensionName(oldest.pillarId, oldest.dimensionId)}`,
          };
        } else if (divergentDimensions.length > 0) {
          // Prioritize largest divergence
          const largest = divergentDimensions.sort((a, b) => {
            const diffA = Math.abs((a.estimatedScore || 0) - a.verifiedScore);
            const diffB = Math.abs((b.estimatedScore || 0) - b.verifiedScore);
            return diffB - diffA;
          })[0];

          const isImproving = (largest.estimatedScore || 0) > largest.verifiedScore;
          primaryRecommendation = {
            pillarId: largest.pillarId,
            dimensionId: largest.dimensionId,
            reason: isImproving
              ? `Your activity suggests growth in ${getDimensionName(largest.pillarId, largest.dimensionId)}`
              : `Time to check in on ${getDimensionName(largest.pillarId, largest.dimensionId)}`,
          };
        }

        setData({
          needsReassessment: staleDimensions.length > 0 || divergentDimensions.length > 0,
          staleDimensions,
          divergentDimensions,
          primaryRecommendation,
        });
      } catch (error) {
        console.error('Failed to fetch reassessment data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReassessmentData();
  }, []);

  if (isLoading || !data?.needsReassessment || dismissed) return null;

  const { primaryRecommendation, staleDimensions, divergentDimensions } = data;

  if (!primaryRecommendation) return null;

  // Count total items needing attention
  const totalItems = staleDimensions.length + divergentDimensions.length;
  const isUrgent = staleDimensions.some(d => d.freshness === 'expired');

  return (
    <div className={`border p-5 relative ${
      isUrgent
        ? 'bg-gradient-to-r from-amber-900/20 to-zinc-900 border-amber-800/30'
        : 'bg-zinc-900/50 border-zinc-800'
    }`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUrgent ? 'bg-amber-800/30' : 'bg-zinc-800'
        }`}>
          <span className={`text-lg ${isUrgent ? 'text-amber-500' : 'text-gray-400'}`}>◐</span>
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-white mb-1">
            {isUrgent ? 'Time to Reassess' : 'Check Your Progress'}
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            {primaryRecommendation.reason}
            {totalItems > 1 && ` (+${totalItems - 1} more)`}
          </p>

          {/* Quick dimension summary */}
          {(staleDimensions.length > 0 || divergentDimensions.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {staleDimensions.slice(0, 3).map(d => (
                <span
                  key={`${d.pillarId}-${d.dimensionId}`}
                  className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 border border-amber-800/30"
                >
                  {getDimensionName(d.pillarId, d.dimensionId)} • {d.freshness}
                </span>
              ))}
              {divergentDimensions.filter(d =>
                !staleDimensions.some(s => s.pillarId === d.pillarId && s.dimensionId === d.dimensionId)
              ).slice(0, 2).map(d => (
                <span
                  key={`${d.pillarId}-${d.dimensionId}`}
                  className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 border border-blue-800/30"
                >
                  {getDimensionName(d.pillarId, d.dimensionId)} • changed
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/assessment/reassess/${primaryRecommendation.pillarId}/${primaryRecommendation.dimensionId}`}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                isUrgent
                  ? 'bg-amber-800/30 hover:bg-amber-800/50 border border-amber-700/50 text-amber-200'
                  : 'bg-white/10 hover:bg-white/20 border border-zinc-700 text-white'
              }`}
            >
              Quick Reassess
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/profile/health"
              className="text-gray-400 hover:text-white text-sm py-2 transition-colors"
            >
              View all scores
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
