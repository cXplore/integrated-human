'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HealthNudge {
  id: string;
  type: 'reassessment' | 'engagement' | 'opportunity' | 'insight' | 'milestone' | 'streak';
  urgency: 'light' | 'gentle' | 'moderate' | 'important';
  title: string;
  message: string;
  cta: string;
  slug: string;
  dismissable: boolean;
}

const URGENCY_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  light: { border: 'border-zinc-700', bg: 'bg-zinc-900/50', icon: '💡' },
  gentle: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: '🌱' },
  moderate: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: '⏰' },
  important: { border: 'border-orange-500/40', bg: 'bg-orange-500/10', icon: '❗' },
};

const TYPE_ICONS: Record<string, string> = {
  reassessment: '🔄',
  engagement: '✨',
  opportunity: '🚀',
  insight: '💭',
  milestone: '🏆',
  streak: '🔥',
};

export default function HealthNudges() {
  const [nudges, setNudges] = useState<HealthNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadNudges() {
      try {
        const response = await fetch('/api/user/health-nudges');
        if (response.ok) {
          const data = await response.json();
          setNudges(data.nudges || []);
        }
      } catch (error) {
        console.error('Failed to load nudges:', error);
      } finally {
        setLoading(false);
      }
    }
    loadNudges();
  }, []);

  async function dismissNudge(nudgeId: string) {
    setDismissed(prev => new Set([...prev, nudgeId]));

    try {
      await fetch('/api/user/health-nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId, action: 'dismiss' }),
      });
    } catch (error) {
      console.error('Failed to dismiss nudge:', error);
    }
  }

  const visibleNudges = nudges.filter(n => !dismissed.has(n.id));

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-zinc-900 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (visibleNudges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleNudges.map(nudge => {
        const styles = URGENCY_STYLES[nudge.urgency] || URGENCY_STYLES.light;
        const typeIcon = TYPE_ICONS[nudge.type] || '💡';

        return (
          <div
            key={nudge.id}
            className={`p-4 border ${styles.border} ${styles.bg} rounded-lg`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{typeIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-white font-medium">{nudge.title}</h4>
                  {nudge.dismissable && (
                    <button
                      onClick={() => dismissNudge(nudge.id)}
                      className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{nudge.message}</p>
                <Link
                  href={nudge.slug}
                  className="inline-block mt-3 px-4 py-1.5 bg-white text-black text-sm font-medium rounded hover:bg-gray-100 transition-colors"
                >
                  {nudge.cta}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
