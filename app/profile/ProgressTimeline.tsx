'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  type: 'assessment' | 'course' | 'article' | 'practice' | 'milestone' | 'check-in';
  title: string;
  description?: string;
  date: string;
  pillar?: string;
  impact?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

const TYPE_ICONS: Record<string, string> = {
  assessment: '📊',
  course: '📚',
  article: '📄',
  practice: '🧘',
  milestone: '🏆',
  'check-in': '✅',
};

const TYPE_COLORS: Record<string, string> = {
  assessment: 'bg-purple-900/30 border-purple-700/50',
  course: 'bg-emerald-900/30 border-emerald-700/50',
  article: 'bg-amber-900/30 border-amber-700/50',
  practice: 'bg-rose-900/30 border-rose-700/50',
  milestone: 'bg-yellow-900/30 border-yellow-700/50',
  'check-in': 'bg-blue-900/30 border-blue-700/50',
};

export default function ProgressTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, []);

  async function fetchTimeline() {
    try {
      const response = await fetch('/api/profile/timeline');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
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
              <div key={i} className="h-16 bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayEvents = expanded ? events : events.slice(0, 5);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-white">Your Journey</h2>
          <p className="text-sm text-gray-500">Recent progress and milestones</p>
        </div>
        {events.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? 'Show less' : `Show all (${events.length})`}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-xl">🌱</span>
          </div>
          <p className="text-gray-400 text-sm">Your journey is just beginning</p>
          <p className="text-gray-500 text-xs mt-1">Complete assessments and content to see your progress</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />

          {/* Events */}
          <div className="space-y-4">
            {displayEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Dot */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${TYPE_COLORS[event.type]}`}>
                  <span className="text-sm">{TYPE_ICONS[event.type]}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                      )}
                    </div>
                    <time className="text-xs text-gray-500 flex-shrink-0">
                      {formatRelativeDate(event.date)}
                    </time>
                  </div>
                  {event.pillar && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-zinc-800 text-gray-400 rounded-full">
                      {event.pillar}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-light text-white">
              {events.filter(e => e.type === 'article').length}
            </div>
            <div className="text-xs text-gray-500">Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-white">
              {events.filter(e => e.type === 'practice').length}
            </div>
            <div className="text-xs text-gray-500">Practices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-white">
              {events.filter(e => e.type === 'course').length}
            </div>
            <div className="text-xs text-gray-500">Courses</div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}
