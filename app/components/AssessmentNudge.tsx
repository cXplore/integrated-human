'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Pillar = 'mind' | 'body' | 'soul' | 'relationships';

interface AssessmentNudgeProps {
  pillar?: Pillar;
  context?: string;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

const PILLAR_INFO: Record<Pillar, { icon: string; name: string; prompt: string }> = {
  mind: {
    icon: '🧠',
    name: 'Mind',
    prompt: 'Curious how your psychology is developing?',
  },
  body: {
    icon: '💪',
    name: 'Body',
    prompt: 'Want to understand your embodiment and nervous system?',
  },
  soul: {
    icon: '✨',
    name: 'Soul',
    prompt: 'Interested in mapping your spiritual development?',
  },
  relationships: {
    icon: '💞',
    name: 'Relationships',
    prompt: 'Curious about your attachment and connection patterns?',
  },
};

export default function AssessmentNudge({
  pillar,
  context,
  variant = 'card',
  className = '',
}: AssessmentNudgeProps) {
  const [hasAssessment, setHasAssessment] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has completed assessment for this pillar
    async function checkAssessment() {
      try {
        const res = await fetch('/api/health/display');
        if (res.ok) {
          const data = await res.json();
          if (pillar) {
            // Check if specific pillar has data
            const pillarData = data.pillars?.[pillar];
            setHasAssessment(pillarData && pillarData.score > 0);
          } else {
            // Check if any assessment exists
            setHasAssessment(data.dimensions && data.dimensions.length > 0);
          }
        } else {
          setHasAssessment(false);
        }
      } catch {
        setHasAssessment(false);
      }
    }
    checkAssessment();
  }, [pillar]);

  // Don't show if already assessed or dismissed
  if (hasAssessment === null || hasAssessment || dismissed) return null;

  const info = pillar ? PILLAR_INFO[pillar] : null;
  const assessmentUrl = pillar ? `/assessment?start=${pillar}` : '/assessment';

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-amber-500 hover:text-amber-400 ${className}`}>
        <Link href={assessmentUrl} className="underline underline-offset-2">
          {info ? `Assess your ${info.name.toLowerCase()}` : 'Take the assessment'}
        </Link>
        {info && <span>{info.icon}</span>}
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-amber-900/20 border-l-2 border-amber-600 px-4 py-3 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          {info && <span className="text-xl">{info.icon}</span>}
          <p className="text-sm text-amber-200">
            {info?.prompt || 'Discover where you are on the integration spectrum.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={assessmentUrl}
            className="text-sm text-amber-400 hover:text-amber-300 font-medium"
          >
            Assess Now →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-400 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 p-5 relative ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        {info ? (
          <div className="text-3xl">{info.icon}</div>
        ) : (
          <div className="flex -space-x-1 text-2xl">
            <span>🧠</span>
            <span>💪</span>
            <span>✨</span>
            <span>💞</span>
          </div>
        )}
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">
            {info ? info.prompt : 'Know Where You Stand'}
          </h4>
          <p className="text-gray-500 text-sm mb-3">
            {context || (info
              ? `Map your ${info.name.toLowerCase()} development in ~10 minutes.`
              : 'Map your development across mind, body, soul, and relationships.'
            )}
          </p>
          <Link
            href={assessmentUrl}
            className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400 font-medium"
          >
            {info ? `Start ${info.name} Assessment` : 'Take Assessment'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
